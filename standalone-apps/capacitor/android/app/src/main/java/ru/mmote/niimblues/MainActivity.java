package ru.mmote.niimblues;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

import java.io.ByteArrayOutputStream;

public class MainActivity extends BridgeActivity {

    @Override
    public void onResume() {
        super.onResume();
        handleIntent(getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        // 1. Check if the app was opened via the "Share" menu with a PDF
        if (Intent.ACTION_SEND.equals(intent.getAction()) && "application/pdf".equals(intent.getType())) {
            Uri pdfUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (pdfUri != null) {
                try {
                    // 2. Open the PDF file natively in Android
                    ParcelFileDescriptor fd = getContentResolver().openFileDescriptor(pdfUri, "r");
                    PdfRenderer renderer = new PdfRenderer(fd);
                    
                    // Grab the first page (Page 0)
                    PdfRenderer.Page page = renderer.openPage(0);
                    
                    // 3. Convert the PDF page to a Bitmap Image
                    // The B1 printer is 203 DPI (roughly 400 pixels wide for standard labels)
                    int width = 400; 
                    int height = (int) (width * ((float) page.getHeight() / page.getWidth()));
                    Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
                    
                    // Fill the background with white (otherwise it might be transparent/black)
                    bitmap.eraseColor(Color.WHITE);
                    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_PRINT);
                    
                    // 4. Compress the image to a Base64 String so JavaScript can read it
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, baos);
                    byte[] imageBytes = baos.toByteArray();
                    String base64Image = "data:image/png;base64," + Base64.encodeToString(imageBytes, Base64.NO_WRAP);
                    
                    // 5. Inject the image into the Javascript Frontend
                    if (bridge != null && bridge.getWebView() != null) {
                        String js = "window.dispatchEvent(new CustomEvent('pdfReceived', { detail: '" + base64Image + "' }));";
                        bridge.getWebView().evaluateJavascript(js, null);
                    }
                    
                    // Clean up memory
                    page.close();
                    renderer.close();
                    fd.close();
                    
                    // Remove the intent so it doesn't process twice
                    setIntent(new Intent());

                } catch (Exception e) {
                    Log.e("NiimBlue PDF", "Error converting PDF to Image", e);
                }
            }
        }
    }
}