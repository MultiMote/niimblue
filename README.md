# NiimBlue

> ⚠ **draft** branch
>
> This branch contains current code of both projects:
>
> - **niimblue** - frontend
> - **niimbluelib** - printer interface
>
> Do not create references to this branch, it will be split into the different repos
> and/or squash-merged to the main branch on the first release. Then this branch will most likely be removed.

Niimbot printers webui. Design and print labels right from your browser.

Tested printers:

- Niimbot D110
- Niimbot B1

## Features

You can see implemented and planned feature list [in this issue](https://github.com/MultiMote/niimblue/issues/3).

## Demo

The public preview is available [here](https://niim.mmote.ru).

## Browser support

Your browser must support Web Bluetooth API: [supported browsers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API#browser_compatibility).

For serial communication: [supported browsers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility).

## Feedback needed!

I only have D110 and B1 printers. If you own other models, please open an issue, confirm you model working or not with this project.

Bluetooth dumps are MUCH appreciated (search how to enable **Bluetooth HCI Snoop Log** for your device, print any label with **Niimbot** app then run `adb bugreport filename`, you should find **btsnoop_hci.log** in the archive).

## Images

Images may be outdated, interface is changing constantly.

![ui](about/ui.png)

![labels](about/labels.png)

![print_preview](about/print_preview.png)

![dither](about/dither.png)

![printed_b1](about/printed_b1.jpg)

![printed_d110](about/printed_d110.jpg)

## Launching development server

Skip steps you have done.

1. Install [git](https://git-scm.com)

2. Install [nodejs](https://nodejs.org)

3. Install [yarn](https://yarnpkg.com)

4. Clone repository

    ```bash
    git clone -b draft https://github.com/MultiMote/niimblue.git
    ```

5. Install dependencies

    ```bash
    cd niimblue
    yarn --cwd niimbluelib
    yarn --cwd niimblue
    ```

6. Run dev server

    ```bash
    yarn --cwd niimblue dev-locallib
    ```

    or

    ```bash
    cd niimblue
    yarn dev-locallib
    ```

    This command will install local niimbluelib to the niimblue project and run the server.
    If niimbluelib is modified you must re-run this command.
