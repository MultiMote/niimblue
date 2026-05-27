package ru.mmote.niimblues;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;

@CapacitorPlugin(name = "PdfIntent")
public class PdfIntentPlugin extends Plugin {
    private String pendingPdfBase64 = null;

    @Override
    public void load() {
        // Called when the app does a "cold start"
        processIntent(getActivity().getIntent());
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        // Called when the app is already running in the background
        processIntent(intent);
    }

    // Svelte will call this when it mounts to grab any PDF that opened the app
    @PluginMethod
    public void getPending(PluginCall call) {
        JSObject ret = new JSObject();
        if (pendingPdfBase64 != null) {
            ret.put("image", pendingPdfBase64);
            pendingPdfBase64 = null; // Clear it so it doesn't load twice
        }
        call.resolve(ret);
    }

    private void processIntent(Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        String type = intent.getType();

        // Check for both "Share" (SEND) and "Open With" (VIEW)
        if ((Intent.ACTION_SEND.equals(action) || Intent.ACTION_VIEW.equals(action))
                && "application/pdf".equals(type)) {

            Uri pdfUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (pdfUri == null) {
                pdfUri = intent.getData(); // ACTION_VIEW puts the Uri here
            }

            if (pdfUri != null) {
                try {
                    ParcelFileDescriptor fd = getContext().getContentResolver().openFileDescriptor(pdfUri, "r");
                    if (fd == null) return;
                    PdfRenderer renderer = new PdfRenderer(fd);
                    PdfRenderer.Page page = renderer.openPage(0);

                    // 800px width for better print quality (NiimBot is ~200-300dpi)
                    int width = 800;
                    int height = (int) (width * ((float) page.getHeight() / page.getWidth()));
                    Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);

                    bitmap.eraseColor(Color.WHITE);
                    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_PRINT);

                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, baos);
                    byte[] imageBytes = baos.toByteArray();
                    String base64Image = "data:image/png;base64," + Base64.encodeToString(imageBytes, Base64.NO_WRAP);

                    page.close();
                    renderer.close();
                    fd.close();

                    // 1. Store it so Svelte can fetch it when it boots up
                    pendingPdfBase64 = base64Image;

                    // 2. Also broadcast it as an event (useful if the app was already open)
                    JSObject ret = new JSObject();
                    ret.put("image", base64Image);
                    notifyListeners("onPdfReceived", ret);

                } catch (Exception e) {
                    Log.e("PdfIntentPlugin", "Error converting PDF to Image", e);
                }
            }
        }
    }
}