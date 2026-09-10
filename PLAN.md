# Niimblue → Electron label studio (Windows)

Goal: turn this fork into a standalone Electron app for Windows that keeps the niimbot serial comms and print pipeline from the original, with a new editor engine and a modern, customisable UI.

## Decisions

- Serial: Web Serial inside Electron's Chromium. Keeps the proven niimbluelib client. The trade-off is the Web Serial permission-prompt flow stays.
- UI: Tailwind + shadcn-svelte on Svelte 5. Bootstrap is out.
- Editor engine: new. fabric.js and the custom fabric objects are dropped. A fresh canvas scene engine replaces them, with new renderers for text, shapes, images, QR/barcode/ArUco, and PDF/ZPL import.
- Persistence: on-disk files. Labels are saved as files in a user-chosen folder through Electron file APIs, with an in-app library browser.

## What stays from the fork

- `@mmote/niimbluelib`: connection clients, print tasks, image encoder, RFID, heartbeat, firmware, sound, reset.
- Print pipeline logic: the dither/threshold post-processing in `utils/post_process.ts` and the print flow concept from `PrintPreview` (density, speed, quantity, label type, print task, offset, progress, cancel).
- Zod schemas for label/preview props as the basis for the new file format.

## What goes

- Bootstrap, all `components/**` Svelte UI, `fabric-object/**`, the fabric-based `LabelDesigner`, `MainPage`, `BrowserWarning`.
- Capacitor and Tauri standalone shells.
- localStorage persistence.

## Feature target

Parity with the official niimbot app, plus what label-making apps usually offer.

- Connect over serial (BT optional). Live status: model, battery, paper/ribbon RFID, density range, printhead width.
- Editor: text and richtext, shapes, images, QR/barcode/ArUco, PDF and ZPL import, custom fonts and icons, grids and guides, snapping, zoom, undo/redo, layers, alignment, templates and presets.
- Paper stock templates: built-in templates keyed to the label rolls niimbot actually sells, grouped by printer family (D11/D110/D101/H1S, B1/B21, B31/B4, N1) and by paper type (die-cut WithGaps, continuous Continuous, transparent Transparent, black-mark WithBlackMarks). Continuous rolls get a fixed width with a user-settable length. The printer's reported `paperTypes` and `printheadPixels` filter the list to what the connected model can actually print.
- Library: file-based save/load/import/export, thumbnails, folders or tags, recent.
- Batch and templating: CSV and dynamic data, per-row preview, quantity, serial numbering.
- Print dialog: live preview with post-processing, density/speed/quantity/labelType/printTask/offset, progress, cancel, fallback to a system printer.
- Printer tools: firmware update, RFID read, sound toggles, factory reset, packet log.
- Settings: app config, defaults, connection prefs.

## Build order

1. Scaffold Electron (main + renderer), wire Vite + Svelte + Tailwind, set up shadcn-svelte, port the reusable comms/print pieces.
2. Connection panel: serial connect/disconnect, live status.
3. Editor shell: new scene engine + object controls + tools + layers.
4. Library and file persistence.
5. Print dialog (new pipeline, reused post-processing) + batch/CSV.
6. Printer tools.
7. Polish: theming, shortcuts, native menus, packaging (electron-builder, Windows installer), auto-update.

## Open question for phase 3

The new editor engine needs a base. Options:

- Canvas 2D with a hand-written scene graph (objects, transforms, hit-testing, selection). Full control, no third-party scene lib, more code to write and maintain.
- Konva (2D canvas scene graph with transforms, groups, events). Less to write, but a dependency and a fixed mental model.
- PixiJS (WebGL renderer with a scene graph). Fastest for big scenes, heavier, overkill for label sizes.

I lean Canvas 2D hand-written, since labels are small scenes and we want full control of the print render. Confirm or pick another before phase 3 starts.
