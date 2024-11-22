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

To see console, go to `vivaldi:inspect/#devices` on desktop chrome browser and select niimblue on your device.

To get prebuilt apk, see the latest artifact in [build-android-app](https://github.com/MultiMote/niimblue/actions/workflows/build-android-app.yml) Actions task.