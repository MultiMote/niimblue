# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NiimBlue is a web-based label designer and printer interface for NIIMBOT printers. It uses Web Bluetooth API and Web Serial API to communicate with printers directly from the browser. The application also supports Android via Capacitor.

## Development Commands

### Development
- `npm run dev` - Start Vite dev server
- `npm run dev-check` - Run svelte-check then start dev server
- `npm run dev-open` - Start dev server and open browser

### Build
- `npm run build` - Production build (default base path)
- `npm run build-rel` - Production build with relative base path (./)

### Code Quality
- `npm run sv-check` - Run svelte-check for TypeScript validation
- `npm run lint` - Run ESLint (requires manual installation)

### Other
- `npm run gen-mdi-list` - Generate Material Design Icons list

### ESLint Installation
ESLint is not included in dependencies. Install manually if needed:
```bash
npm install --no-save --no-package-lock eslint@9.x globals @types/eslint @eslint/js typescript-eslint eslint-plugin-svelte
```

## Architecture

### Core Technology Stack
- **Framework**: Svelte 4 with TypeScript
- **Build Tool**: Vite 5
- **Canvas Library**: Fabric.js 6 (custom objects for label design)
- **Printer Communication**: @mmote/niimbluelib (custom library for NIIMBOT protocol)
- **Validation**: Zod schemas
- **Styling**: Bootstrap 5 + Sass
- **Platform**: Capacitor 7 for Android app

### Key Architectural Patterns

#### State Management
- Uses Svelte stores (`src/stores.ts`) for global state
- Custom `writablePersisted` store wrapper for localStorage persistence with Zod validation
- Key stores:
  - `printerClient`: Active printer connection client
  - `connectionState`: Connection status ("connecting" | "connected" | "disconnected")
  - `appConfig`: App configuration (persisted)
  - `heartbeatData`, `printerInfo`, `rfidInfo`: Printer state

#### Printer Communication
- Abstraction layer over Web Bluetooth, Web Serial, and Capacitor BLE
- Client initialization in `stores.ts` via `initClient(connectionType)`
- Event-driven architecture (connect, disconnect, heartbeat, etc.)
- Protocol implementation in `@mmote/niimbluelib` package
- Connection types: "bluetooth" | "serial" | "capacitor-ble"

#### Label Designer (Fabric.js)
- Custom `CustomCanvas` class extends `fabric.Canvas` (`src/fabric-object/custom_canvas.ts`)
- Custom fabric objects: `QRCode`, `Barcode` (extend fabric base classes)
- Canvas features:
  - Virtual zoom (mouse wheel + middle click reset)
  - Custom background rendering (label shapes, tails, split labels)
  - Mirrored object rendering for split labels
  - Grid snapping (GRID_SIZE constant)

#### Undo/Redo System
- Implemented in `src/utils/undo_redo.ts`
- Stores snapshots of canvas JSON + label props
- Triggered on object modifications, additions, deletions
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y/Ctrl+Shift+Z (redo)

#### Persistence Layer
- `LocalStoragePersistence` class (`src/utils/persistence.ts`)
- All localStorage operations go through Zod validation
- Stores:
  - Label templates (saved_label_*)
  - Label presets
  - Last used label props
  - Print preview settings
  - CSV data for batch printing
  - Font cache
  - Default template

#### Type System
- Central type definitions in `src/types.ts`
- Zod schemas for runtime validation
- Key types:
  - `LabelProps`: Label configuration (size, shape, split, mirror, tail)
  - `ExportedLabelTemplate`: Complete label (canvas + props + metadata)
  - `PreviewProps`: Print settings (post-process, density, quantity)
  - `ConnectionType`, `ConnectionState`: Printer connection state

### Component Structure
- `MainPage.svelte`: Root layout component
- `LabelDesigner.svelte`: Main canvas editor with toolbar
- `PrintPreview.svelte`: Print preview and settings dialog
- `PrinterConnector.svelte`: Connection UI
- `designer-controls/*.svelte`: Toolbar controls (object properties, label settings)
- `basic/*.svelte`: Reusable UI components

### Image Processing Pipeline
1. Canvas export to ImageData
2. Optional post-processing (`src/utils/post_process.ts`):
   - Threshold (simple black/white)
   - Dithering (Floyd-Steinberg)
3. Canvas preprocessing (`src/utils/canvas_preprocess.ts`):
   - Offset application (inner/outer)
   - Mirror object creation for split labels
4. Conversion to printer format (handled by niimbluelib)

### Label Features
- **Shapes**: rectangle, rounded rectangle, circle
- **Split**: vertical/horizontal division (2+ parts)
- **Mirror**: copy or flip mode for split labels
- **Tail**: configurable position and length
- **Objects**: text, shapes (rect, circle, line), images, QR codes, barcodes
- **Batch printing**: CSV templating with {placeholder} syntax

### Keyboard Shortcuts (LabelDesigner.svelte)
- Escape: Deselect
- Delete/Backspace: Delete selected
- Ctrl+D: Clone selected
- Ctrl+Z: Undo
- Ctrl+Y / Ctrl+Shift+Z: Redo
- Arrow keys: Move selected (+ Ctrl for fine movement)
- Mouse wheel: Zoom canvas
- Middle click: Reset zoom

### Build Configuration
- Vite uses manual chunk splitting (`vite.config.ts`):
  - `lib.2.fabric`: Fabric.js
  - `lib.2.niim`: NiimBlueLib
  - `lib.2.cap`: Capacitor plugins
  - `lib.2.zod`: Zod
  - `lib.1.other`: Other node_modules
- Build-time constants: `__APP_VERSION__`, `__APP_COMMIT__`, `__BUILD_DATE__`
- Override: Canvas package removed from fabric.js (web-only)

### Internationalization
- i18n system in `src/utils/i18n.ts`
- Locale files in `src/locale/`
- Translation via `$tr("key")` in components
- Weblate integration for community translations

### Important Utilities
- `FileUtils` (`src/utils/file_utils.ts`): Import/export, image handling
- `LabelDesignerUtils` (`src/utils/label_designer_utils.ts`): Canvas operations (clone, move, delete)
- `LabelDesignerObjectHelper` (`src/utils/label_desinder_object_helper.ts`): Add objects to canvas
- `Toasts` (`src/utils/toasts.ts`): User notifications

### Testing
No test framework is currently configured. When adding tests:
- Consider unit tests for utilities (post_process, canvas_utils, persistence)
- Consider E2E tests for critical user flows (label design, print preview)

## Common Development Patterns

### Adding a New Object Type to Canvas
1. Create custom class extending fabric object in `src/fabric-object/` (if needed)
2. Add type to `OjectType` union in `src/types.ts`
3. Implement in `LabelDesignerObjectHelper.addObject()`
4. Add to `ObjectPicker.svelte`
5. Create param controls component in `designer-controls/`
6. Add to `LabelDesigner.svelte` toolbar (conditional rendering)

### Adding Persistent Configuration
1. Define Zod schema in `src/types.ts`
2. Add load/save methods to `LocalStoragePersistence`
3. Use `writablePersisted` store for reactive persistence

### Adding Printer Features
1. Check if feature exists in `@mmote/niimbluelib`
2. If not, contribute to niimbluelib first
3. Add UI in relevant component (usually `PrinterConnector.svelte` or `PrintPreview.svelte`)
4. Subscribe to printer events via `printerClient` store

### Working with Canvas
- Always call `canvas.requestRenderAll()` after modifications
- Use `setCoords()` after programmatic position changes
- Push to undo stack after user actions: `undo.push(fabricCanvas, labelProps)`
- Access label bounds (excluding tail): `canvas.getLabelBounds()`
- Check for split/mirror: `canvas.getFoldInfo()` and `canvas.getMirroredObjectCoords(obj)`

## Important Notes

- The app works completely offline (privacy-first design)
- Web Bluetooth/Serial APIs require HTTPS or localhost
- Chrome flags may need enabling: `chrome://flags` → "Experimental Web Platform Features"
- Fabric.js canvas package is explicitly excluded (web environment)
- localStorage quota management: `LocalStoragePersistence.usedSpace()` returns KB used
- Printer protocol documentation: https://niim-docs.pages.dev/
- Compatible printers: See https://github.com/MultiMote/niimbluelib/issues/1
