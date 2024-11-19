import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ru.mmote.niimblues",
  appName: "NiimBlues",
  webDir: "www",
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
  android: {
    buildOptions: {
      releaseType: "APK",
      keystorePath: process.env.KEYSTORE_PATH,
      keystorePassword: process.env.KEYSTORE_PASSWORD,
      keystoreAlias: process.env.KEYSTORE_ALIAS,
      keystoreAliasPassword: process.env.KEYSTORE_ALIAS_PASSWORD,
      signingType: "apksigner",
    },
  },
};

export default config;
