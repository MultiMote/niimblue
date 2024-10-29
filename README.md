# NiimBlue

Niimbot printers webui. Design and print labels right from your browser.

Uses [NiimBlueLib](https://github.com/MultiMote/niimbluelib) for communication.

> [!NOTE]
> If you have printing problems, try different print task versions in print preview dialog. Make if default by pressing "Lock" button.
>
> If you found version suitable for your model, please write [here](https://github.com/MultiMote/niimbluelib/issues/1).

## Features

You can see implemented and planned feature list [in this issue](https://github.com/MultiMote/niimblue/issues/3).

List of supported models you can find in [niimluelib](https://github.com/MultiMote/niimbluelib/issues/1) repository.

## Demo

The public preview is available [here](https://niim.mmote.ru).

## Browser support

Your browser must support Web Bluetooth API: [supported browsers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API#browser_compatibility).

For serial communication: [supported browsers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility).

## Feedback needed!

I only have D110 and B1 printers. If you own other models, please write a comment [here](https://github.com/MultiMote/niimbluelib/issues/1) describing your model working or not.

Bluetooth dumps are MUCH appreciated (search how to enable **Bluetooth HCI Snoop Log** for your device, print any label with **Niimbot** app then run `adb bugreport filename`, you should find **btsnoop_hci.log** in the archive).

## Images

Images may be outdated, interface is changing constantly.

![ui](about/ui.png)

![labels](about/labels.png)

![print_preview](about/print_preview.png)

![dither](about/dither.png)

![templating](about/templating.png)

![batch](about/batch.png)

![printed_b1](about/printed_b1.jpg)

![printed_d110](about/printed_d110.jpg)

## Launching development server

Skip steps you have done.

1. Install [git](https://git-scm.com)

2. Install [nodejs](https://nodejs.org)

3. Install [yarn](https://yarnpkg.com)

4. Clone repository

    ```bash
    git clone https://github.com/MultiMote/niimblue.git
    ```

5. Install dependencies

    ```bash
    yarn install
    ```

6. Run dev server

    Check code and open browser:

    ```bash
    yarn dev-check
    ```

    Or just run:

    ```bash
    yarn dev
    ```

Eslint not included. Install it with:

```bash
npm install --no-save --no-package-lock eslint@9.x globals @types/eslint @eslint/js typescript-eslint eslint-plugin-svelte
```
