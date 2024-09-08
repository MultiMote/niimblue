## niimbluelib-headless

niimbluelib client implementations for not-browser use.

Tested environment:

* Windows 10
* Bluetooth adapter (TP-LINK UB500)
* USB serial connection
* Printers: B1, D110

Usage example:

* [utils/test-serial.mjs](utils/test-serial.mjs) (run with `yarn test-serial`)
* [utils/test-bluetooth.mjs](utils/test-bluetooth.mjs) (run with `yarn test-bluetooth`)


### Command-line usage

Available options:

```bash
node cli.mjs help print
```

B1 serial:

```bash
node cli.mjs print -d -t serial -a COM8 -o top label_15x30.png
```

Or if package installed:

```bash
niimblue-cli print -d -t serial -a COM8 -o top label_15x30.png
```

B1 Bluetooth:

```bash
node cli.mjs print -d -t bluetooth -a 07:27:03:17:6E:82 -o top label_15x30.png
```


