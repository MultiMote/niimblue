<script lang="ts">
  import Dropdown from "bootstrap/js/dist/dropdown";
  import { fabric } from "fabric";
  import { onDestroy, onMount } from "svelte";
  import { Barcode } from "../fabric-object/barcode.class";
  import { QRCode } from "../fabric-object/qrcode.class";
  import { iconCodepoints, type MaterialIcon } from "../mdi_icons";
  import { connectionState } from "../stores";
  import {
    type ExportedLabelTemplate,
    type FabricJson,
    type LabelProps,
    type MoveDirection,
    type OjectType,
  } from "../types";
  import { FileUtils } from "../utils/file_utils";
  import { locale, locales, tr } from "../utils/i18n";
  import { ImageEditorObjectHelper } from "../utils/image_editor_object_helper";
  import { LocalStoragePersistence } from "../utils/persistence";
  import { Toasts } from "../utils/toasts";
  import { UndoRedo, type UndoState } from "../utils/undo_redo";
  import BarcodeParamsPanel from "./BarcodeParamsControls.svelte";
  import CsvControl from "./CsvControl.svelte";
  import GenericObjectParamsControls from "./GenericObjectParamsControls.svelte";
  import IconPicker from "./IconPicker.svelte";
  import LabelPropsEditor from "./LabelPropsEditor.svelte";
  import MdIcon from "./MdIcon.svelte";
  import ObjectPicker from "./ObjectPicker.svelte";
  import PrintPreview from "./PrintPreview.svelte";
  import QrCodeParamsPanel from "./QRCodeParamsControls.svelte";
  import TextParamsPanel from "./TextParamsControls.svelte";
  import VariableInsertControl from "./VariableInsertControl.svelte";
  import { DEFAULT_LABEL_PROPS, GRID_SIZE } from "../defaults";
  import { ImageEditorUtils } from "../utils/image_editor_utils";
  import SavedLabelsMenu from "./SavedLabelsMenu.svelte";
  import { Capacitor } from '@capacitor/core';

  let htmlCanvas: HTMLCanvasElement;
  let fabricCanvas: fabric.Canvas;
  let labelProps: LabelProps = DEFAULT_LABEL_PROPS;
  let previewOpened: boolean = false;
  let selectedObject: fabric.Object | undefined = undefined;
  let selectedCount: number = 0;
  let printNow: boolean = false;
  let csvData: string = "";
  let csvEnabled: boolean = false;

  const undo = new UndoRedo();
  let undoState: UndoState = { undoDisabled: false, redoDisabled: false };

  const discardSelection = () => {
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
    selectedObject = undefined;
    selectedCount = 0;
  };

  const loadLabelData = async (data: ExportedLabelTemplate) => {
    undo.paused = true;
    onUpdateLabelProps(data.label);
    await FileUtils.loadCanvasState(fabricCanvas, data.canvas);
    undo.paused = false;
  };

  undo.onLabelUpdate = loadLabelData;
  undo.onStateUpdate = (state: UndoState) => {
    undoState = state;
  };

  const deleteSelected = () => {
    ImageEditorUtils.deleteSelection(fabricCanvas);
    discardSelection();
  };

  const cloneSelected = () => {
    if (selectedObject) {
      ImageEditorUtils.cloneObject(fabricCanvas, selectedObject).then(() => undo.push(fabricCanvas, labelProps));
    }
  };

  const moveSelected = (direction: MoveDirection, ctrl?: boolean) => {
    ImageEditorUtils.moveSelection(fabricCanvas, direction, ctrl);
    undo.push(fabricCanvas, labelProps);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const key: string = e.key.toLowerCase();

    // Esc
    if (key === "escape") {
      discardSelection();
      return;
    }

    if (ImageEditorUtils.isAnyInputFocused(fabricCanvas)) {
      return;
    }

    // Arrows
    if (key.startsWith("arrow")) {
      moveSelected(key.slice("arrow".length) as MoveDirection, e.ctrlKey);
      return;
    }

    if (e.repeat) {
      return;
    }

    // Ctrl + D
    if (e.ctrlKey && key === "d") {
      e.preventDefault();
      cloneSelected();
      return;
    }

    // Ctrl + Y, Ctrl + Shift + Z
    if ((e.ctrlKey && key === "y") || (e.ctrlKey && e.shiftKey && key === "z")) {
      e.preventDefault();
      if (!undoState.redoDisabled) {
        undo.redo();
      }
      return;
    }

    // Ctrl + Z
    if (e.ctrlKey && key === "z") {
      e.preventDefault();
      if (!undoState.undoDisabled) {
        undo.undo();
      }
      return;
    }

    // Del
    if (key === "delete") {
      deleteSelected();
      return;
    }
  };

  const onUpdateLabelProps = (newProps: LabelProps) => {
    labelProps = newProps;
    fabricCanvas.setDimensions(labelProps.size);
    try {
      LocalStoragePersistence.saveLastLabelProps(labelProps);
      undo.push(fabricCanvas, labelProps);
    } catch (e) {
      Toasts.zodErrors(e, "Label parameters save error:");
    }
  };

  const exportCurrentLabel = (): ExportedLabelTemplate => {
    return FileUtils.makeExportedLabel(fabricCanvas, labelProps);
  };

  const onLoadRequested = (label: ExportedLabelTemplate) => {
    loadLabelData(label).then(() => undo.push(fabricCanvas, labelProps));
  };

  const zplImageReady = (img: Blob) => {
    ImageEditorObjectHelper.addImageBlob(fabricCanvas, img).then(() => undo.push(fabricCanvas, labelProps));
  };

  const onObjectPicked = (objectType: OjectType) => {
    const obj = ImageEditorObjectHelper.addObject(fabricCanvas, objectType);
    if (obj !== undefined) {
      fabricCanvas.setActiveObject(obj);
      undo.push(fabricCanvas, labelProps);
    }
  };

  const onIconPicked = (i: MaterialIcon) => {
    // todo: icon is not vertically centered
    ImageEditorObjectHelper.addStaticText(fabricCanvas, String.fromCodePoint(iconCodepoints[i]), {
      fontFamily: "Material Icons",
      fontSize: 100,
    });
    undo.push(fabricCanvas, labelProps);
  };

  const onPreviewClosed = () => {
    printNow = false;
    previewOpened = false;
  };

  const openPreview = () => {
    printNow = false;
    previewOpened = true;
  };

  const openPreviewAndPrint = () => {
    printNow = true;
    previewOpened = true;
  };

  const controlValueUpdated = () => {
    fabricCanvas.requestRenderAll();
    selectedObject = selectedObject;
  };

  const getCanvasForPreview = (): FabricJson => {
    return fabricCanvas.toJSON();
  };

  const onCsvUpdate = (enabled: boolean, csv: string) => {
    csvData = csv;
    csvEnabled = enabled;
    LocalStoragePersistence.saveCsv(csvData);
  };

  const onCsvPlaceholderPicked = (name: string) => {
    const obj = ImageEditorObjectHelper.addText(fabricCanvas, `{${name}}`, {
      textAlign: "left",
      originX: "left",
      originY: "top",
    });
    fabricCanvas.setActiveObject(obj);
    undo.push(fabricCanvas, labelProps);
  };

  const onPaste = async (event: ClipboardEvent) => {
    if (ImageEditorUtils.isAnyInputFocused(fabricCanvas)) {
      return;
    }

    const openedDropdowns = document.querySelectorAll(".dropdown-menu.show");
    if (openedDropdowns.length > 0) {
      return;
    }

    if (event.clipboardData != null) {
      event.preventDefault();
      const obj = await ImageEditorObjectHelper.addObjectFromClipboard(fabricCanvas, event.clipboardData);

      if (obj !== undefined) {
        fabricCanvas.setActiveObject(obj);
        undo.push(fabricCanvas, labelProps);
      }
    }
  };

  onMount(() => {
    const csvSaved = LocalStoragePersistence.loadCsv();
    csvData = csvSaved.data;

    try {
      const savedLabelProps = LocalStoragePersistence.loadLastLabelProps();
      if (savedLabelProps !== null) {
        labelProps = savedLabelProps;
      }
    } catch (e) {
      Toasts.zodErrors(e, "Label parameters load error:");
    }

    fabric.disableStyleCopyPaste = true;

    fabricCanvas = new fabric.Canvas(htmlCanvas, {
      width: labelProps.size.width,
      height: labelProps.size.height,
      backgroundColor: "#fff",
    });

    ImageEditorObjectHelper.addText(fabricCanvas, $tr("editor.default_text"));
    undo.push(fabricCanvas, labelProps);

    // force close dropdowns on touch devices
    fabricCanvas.on("mouse:down", (): void => {
      const dropdowns = document.querySelectorAll("[data-bs-toggle='dropdown']");
      dropdowns.forEach((el) => new Dropdown(el).hide());
    });

    fabricCanvas.on("object:moving", (e: fabric.IEvent<MouseEvent>): void => {
      if (e.target && e.target.left !== undefined && e.target.top !== undefined) {
        e.target.set({
          left: Math.round(e.target.left / GRID_SIZE) * GRID_SIZE,
          top: Math.round(e.target.top / GRID_SIZE) * GRID_SIZE,
        });
      }
    });

    fabricCanvas.on("object:modified", (): void => {
      undo.push(fabricCanvas, labelProps);
    });

    fabricCanvas.on("object:removed", (): void => {
      undo.push(fabricCanvas, labelProps);
    });

    fabricCanvas.on("selection:created", (e: fabric.IEvent<MouseEvent>): void => {
      selectedCount = e.selected?.length ?? 0;
      selectedObject = e.selected?.length === 1 ? e.selected[0] : undefined;
    });

    fabricCanvas.on("selection:updated", (e: fabric.IEvent<MouseEvent>): void => {
      selectedCount = e.selected?.length ?? 0;
      selectedObject = e.selected?.length === 1 ? e.selected[0] : undefined;
    });

    fabricCanvas.on("selection:cleared", (): void => {
      selectedObject = undefined;
      selectedCount = 0;
    });

    fabricCanvas.on("drop", (e: fabric.IEvent<MouseEvent>): void => {
      const dragEvt = e.e as DragEvent;
      dragEvt.preventDefault();

      if (dragEvt.dataTransfer?.files) {
        [...dragEvt.dataTransfer.files].forEach((file: File) => {
          ImageEditorObjectHelper.addImageFile(fabricCanvas, file);
          undo.push(fabricCanvas, labelProps);
        });
      }
    });

    fabricCanvas.on("object:scaling", (e: fabric.IEvent<MouseEvent>): void => {
      if (e.target && e.target instanceof Barcode && e.target.width !== undefined && e.target.height !== undefined) {
        e.target.set({
          width: Math.round(e.target.width * (e.target.scaleX ?? 1)),
          height: Math.round(e.target.height * (e.target.scaleY ?? 1)),
          scaleX: 1,
          scaleY: 1,
        });
      }
    });
  });

  onDestroy(() => {
    fabricCanvas.dispose();
  });
</script>

<svelte:window on:keydown={onKeyDown} on:paste={onPaste} />

<div class="image-editor">
  <div class="col d-flex justify-content-center align-items-center">    
    <div class="col d-flex justify-content-center">
      <div class="canvas-wrapper print-start-{labelProps.printDirection}">
        <canvas bind:this={htmlCanvas}></canvas>
      </div>
    </div>
  </div>

  <div class:fixed-bottom={Capacitor.getPlatform() !== 'web'}>
    <div class="row mb-1">
      <div class="col d-flex justify-content-center">
        <div class="toolbar d-flex flex-wrap gap-1 justify-content-center align-items-center">
          {#if selectedCount > 0}
            <button class="btn btn-danger me-1" on:click={deleteSelected} title={$tr("editor.delete")}>
              <MdIcon icon="delete" />
            </button>
          {/if}

          {#if selectedObject && selectedCount === 1}
            <button class="btn btn-secondary me-1" on:click={cloneSelected} title={$tr("editor.clone")}>
              <MdIcon icon="content_copy" />
            </button>
            <GenericObjectParamsControls {selectedObject} valueUpdated={controlValueUpdated} />
          {/if}

          {#if selectedObject instanceof fabric.IText}
            <TextParamsPanel {selectedObject} valueUpdated={controlValueUpdated} />
          {/if}
          {#if selectedObject instanceof QRCode}
            <QrCodeParamsPanel {selectedObject} valueUpdated={controlValueUpdated} />
          {/if}
          {#if selectedObject instanceof Barcode}
            <BarcodeParamsPanel {selectedObject} valueUpdated={controlValueUpdated} />
          {/if}
          {#if selectedObject instanceof fabric.IText || selectedObject instanceof QRCode || (selectedObject instanceof Barcode && selectedObject.encoding === "CODE128B")}
            <VariableInsertControl {selectedObject} valueUpdated={controlValueUpdated} />
          {/if}
        </div>
      </div>
    </div>

    <div class="row mb-1">
      <div class="col d-flex justify-content-center">
        <div class="toolbar d-flex flex-wrap gap-1 justify-content-center align-items-center">
          <LabelPropsEditor {labelProps} onChange={onUpdateLabelProps} />

          <SavedLabelsMenu canvas={fabricCanvas} onRequestLabelTemplate={exportCurrentLabel} {onLoadRequested} />

          <button
            class="btn btn-secondary"
            disabled={undoState.undoDisabled}
            on:click={() => undo.undo()}
            title={$tr("editor.undo")}>
            <MdIcon icon="undo" />
          </button>

          <button
            class="btn btn-secondary"
            disabled={undoState.redoDisabled}
            on:click={() => undo.redo()}
            title={$tr("editor.redo")}>
            <MdIcon icon="redo" />
          </button>

          <CsvControl
            csv={csvData}
            enabled={csvEnabled}
            onUpdate={onCsvUpdate}
            onPlaceholderPicked={onCsvPlaceholderPicked} />

          <IconPicker onSubmit={onIconPicked} />
          <ObjectPicker onSubmit={onObjectPicked} labelProps={labelProps} zplImageReady={zplImageReady} />

          <button class="btn btn-primary ms-1" on:click={openPreview}>
            <MdIcon icon="visibility" />
            {$tr("editor.preview")}
          </button>
          <button
            title="Print with default or saved parameters"
            class="btn btn-primary ms-1"
            on:click={openPreviewAndPrint}
            disabled={$connectionState !== "connected"}><MdIcon icon="print" /> {$tr("editor.print")}</button>
        </div>
      </div>
    </div>

    <!-- svelte-ignore missing-declaration -->
    <div class="text-center text-secondary p-2" class:fixed-bottom={Capacitor.getPlatform() === 'web'}>
      <div>
        <select class="form-select form-select-sm d-inline-block w-auto" bind:value={$locale}>
          {#each Object.entries(locales) as [key, name]}
            <option value={key}>{name}</option>
          {/each}
        </select>
      </div>
      <div>
        {#if __APP_COMMIT__}
          <a class="text-secondary" href="https://github.com/MultiMote/niimblue/commit/{__APP_COMMIT__}">
            {__APP_COMMIT__.slice(0, 6)}
          </a>
        {/if}
        {$tr("main.built")}
        {__BUILD_DATE__}
      </div>
      <div>
        <a class="text-secondary" href="https://github.com/MultiMote/niimblue">{$tr("main.code")}</a>
      </div>
    </div>
  </div>
  {#if previewOpened}
    <PrintPreview
      onClosed={onPreviewClosed}
      canvasCallback={getCanvasForPreview}
      {labelProps}
      {printNow}
      {csvEnabled}
      {csvData} />
  {/if}
</div>

<style>
  .canvas-wrapper.print-start-left {
    border-left: 2px solid #ff4646;
  }
  .canvas-wrapper.print-start-top {
    border-top: 2px solid #ff4646;
  }
  .canvas-wrapper canvas {
    image-rendering: pixelated;
  }
</style>
