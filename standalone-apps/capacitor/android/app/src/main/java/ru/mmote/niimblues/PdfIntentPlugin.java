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

    // Cache the image here if Android processes it before Svelte is fully loaded
    private String cachedBase64Image = null;

    @PluginMethod
    public void checkIntent(PluginCall call) {
        // 1. If we already caught a PDF while Svelte was booting, return it now!
        if (cachedBase64Image != null) {
            JSObject ret = new JSObject();
            ret.put("image", cachedBase64Image);
            call.resolve(ret);
            cachedBase64Image = null; // Clear cache after delivering
            return;
        }

        // 2. Otherwise, check the Android intent directly
        Intent intent = getActivity().getIntent();
        processAndResolve(intent, call, null);
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        getActivity().setIntent(intent);
        processAndResolve(intent, null, "onPdfReceived");
    }

    private void processAndResolve(Intent intent, PluginCall call, String eventName) {
        if (intent == null) {
            if (call != null) call.resolve(new JSObject());
            return;
        }

        String action = intent.getAction();
        Uri pdfUri = null;

        if (Intent.ACTION_SEND.equals(action)) {
            pdfUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        } else if (Intent.ACTION_VIEW.equals(action)) {
            pdfUri = intent.getData();
        }

        if (pdfUri == null) {
            if (call != null) call.resolve(new JSObject());
            return;
        }

        Uri finalUri = pdfUri;
        
        new Thread(() -> {
            try {
                ParcelFileDescriptor fd = getContext().getContentResolver().openFileDescriptor(finalUri, "r");
                if (fd == null) throw new Exception("Android returned null FD.");
                
                PdfRenderer renderer = new PdfRenderer(fd);
                if (renderer.getPageCount() == 0) throw new Exception("0 pages.");
                
                PdfRenderer.Page page = renderer.openPage(0);

                int width = 800;
                int height = (int) (width * ((float) page.getHeight() / page.getWidth()));
                Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);

                bitmap.eraseColor(Color.WHITE);
                page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_PRINT);

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, baos);
                String base64Image = "data:image/png;base64," + Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP);

                page.close();
                renderer.close();
                fd.close();

                // Clear the intent so we don't process it twice
                getActivity().setIntent(new Intent());

                JSObject ret = new JSObject();
                ret.put("image", base64Image);

                // If Javascript asked for it directly via checkIntent():
                if (call != null) {
                    call.resolve(ret);
                } 
                // If Android pushed it automatically via handleOnNewIntent():
                else if (eventName != null) {
                    cachedBase64Image = base64Image; // Cache it just in case JS misses the event
                    notifyListeners(eventName, ret); // Try to notify Svelte anyway
                }

            } catch (Exception e) {
                Log.e("PdfIntentPlugin", "PDF Error", e);
                if (call != null) call.reject(e.getMessage() != null ? e.getMessage() : "Error");
            }
        }).start();
    }
}