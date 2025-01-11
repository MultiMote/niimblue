## NiimBlue standalone app

Install dependencies

```bash
yarn --cwd .. install
yarn install
```

Build niimblue static files

```bash
yarn build-www
```

# Android

Run debug build on android device (adb)

```bash
yarn run-android
```

Or build release apk (`apksigner` should be in your PATH):

```bash
export KEYSTORE_PATH=/path/to/keystore.jks
export KEYSTORE_ALIAS=your_alias_name
export KEYSTORE_PASSWORD=pa$$word
export KEYSTORE_ALIAS_PASSWORD=pa$$word

yarn build-android
```

To see console, go to `chrome:inspect/#devices` on desktop chrome browser and select niimblue on your device.

To get prebuilt apk, see the latest artifact in [build-android-app](https://github.com/MultiMote/niimblue/actions/workflows/build-android-app.yml) Actions task.

# iOS (experimental)

Run debug build on iPhone Simulator

```bash
yarn run-ios
```

Run on device,

```bash
yarn build-ios
```

**iOS**: Unlike Android (and also Cordova), Capacitor lacks ability to pass `DEVELOPMENT_TEAM` as environment variable.

In order to run on actual device, you'll need to set your own DEVELOPMENT_TEAM within Xcode under `Signing & Capabilities`.

Free (limited) developer account is also available.
[Click here for more details](https://developer.apple.com/support/compare-memberships/)

**macOS (Catalyst)**: Choose Mac Catalyst.

Note: macOS doesn't need codesign to run on local machine.
