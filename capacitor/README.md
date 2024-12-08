## NiimBlue standalone app

Install dependencies

```bash
yarn install
```

Build niimblue static files

```bash
yarn build-www
```

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
