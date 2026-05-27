package ru.mmote.niimblues;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register our custom local plugin
        registerPlugin(PdfIntentPlugin.class);
        super.onCreate(savedInstanceState);
    }
}