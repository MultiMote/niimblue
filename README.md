# NiimBlue

Niimbot printers webui. Design and print labels right from your browser.

There is no code yet. It will be pushed when I finish a library and ui. It is very raw.

If you really want to see how it made, you can browse source code [here](https://gitee.mmote.ru/MultiMote/niimblue-nightly) (you will see auto-generated daily commits, after first release repository will be deleted).

Tested printers:

- Niimbot D110
- Niimbot B1

## Features

You can see implemented and planned feature list [in this issue](https://github.com/MultiMote/niimblue/issues/3).

## Demo

The public preview is available [here](https://dev.mmote.ru/niimblue/) (updated often).

## Browser support

Your browser must support Web Bluetooth API: [supported browsers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API#browser_compatibility).

For serial communication: [supported browsers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility).

## Feedback needed!

I only have D110 and B1 printers. If you own other models, please open an issue, confirm you model working or not with this project.

Bluetooth dumps are MUCH appreciated (search how to enable **Bluetooth HCI Snoop Log** for your device, print any label with **Niimbot** app then run `adb bugreport filename`, you should find **btsnoop_hci.log** in the archive).

## Images

![ui](about/ui.png)

![labels](about/labels.png)

![print_preview](about/print_preview.png)

![dither](about/dither.png)

![printed_b1](about/printed_b1.jpg)

![printed_d110](about/printed_d110.jpg)
