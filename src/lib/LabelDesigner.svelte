<script lang="ts">
  import Dropdown from "bootstrap/js/dist/dropdown";
  import * as fabric from "fabric";
  import { onDestroy, onMount, tick } from "svelte";
  import { Barcode } from "../fabric-object/barcode";
  import { QRCode } from "../fabric-object/qrcode";
  import { iconCodepoints, type MaterialIcon } from "../mdi_icons";
  import { automation, connectionState } from "../stores";
  import {
    type ExportedLabelTemplate,
    type FabricJson,
    type LabelProps,
    type MoveDirection,
    type OjectType,
  } from "../types";
  import { FileUtils } from "../utils/file_utils";
  import { tr } from "../utils/i18n";
  import { LabelDesignerObjectHelper } from "../utils/label_desinder_object_helper";
  import { LocalStoragePersistence } from "../utils/persistence";
  import { Toasts } from "../utils/toasts";
  import { UndoRedo, type UndoState } from "../utils/undo_redo";
  import BarcodeParamsPanel from "./designer-controls/BarcodeParamsControls.svelte";
  import CsvControl from "./designer-controls/CsvControl.svelte";
  import GenericObjectParamsControls from "./designer-controls/GenericObjectParamsControls.svelte";
  import IconPicker from "./designer-controls/IconPicker.svelte";
  import LabelPropsEditor from "./designer-controls/LabelPropsEditor.svelte";
  import MdIcon from "./basic/MdIcon.svelte";
  import ObjectPicker from "./designer-controls/ObjectPicker.svelte";
  import PrintPreview from "./PrintPreview.svelte";
  import QrCodeParamsPanel from "./designer-controls/QRCodeParamsControls.svelte";
  import TextParamsControls from "./designer-controls/TextParamsControls.svelte";
  import VariableInsertControl from "./designer-controls/VariableInsertControl.svelte";
  import { DEFAULT_LABEL_PROPS, GRID_SIZE } from "../defaults";
  import { LabelDesignerUtils } from "../utils/label_designer_utils";
  import SavedLabelsMenu from "./designer-controls/SavedLabelsMenu.svelte";
  import { CustomCanvas } from "../fabric-object/custom_canvas";
  import VectorParamsControls from "./designer-controls/VectorParamsControls.svelte";

  let htmlCanvas: HTMLCanvasElement;
  let fabricCanvas: CustomCanvas;
  let labelProps: LabelProps = DEFAULT_LABEL_PROPS;
  let previewOpened: boolean = false;
  let selectedObject: fabric.FabricObject | undefined = undefined;
  let selectedCount: number = 0;
  let printNow: boolean = false;
  let csvData: string = "";
  let csvEnabled: boolean = false;
  let windowWidth: number = 0;

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
    LabelDesignerUtils.deleteSelection(fabricCanvas);
    discardSelection();
  };

  const cloneSelected = () => {
    LabelDesignerUtils.cloneSelection(fabricCanvas).then(() => undo.push(fabricCanvas, labelProps));
  };

  const moveSelected = (direction: MoveDirection, ctrl?: boolean) => {
    LabelDesignerUtils.moveSelection(fabricCanvas, direction, ctrl);
    undo.push(fabricCanvas, labelProps);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const key: string = e.key.toLowerCase();
    // windows and linux users are used to ctrl, mac users use cmd
    const cmdOrCtrl = e.metaKey || e.ctrlKey;

    // Esc
    if (key === "escape") {
      discardSelection();
      return;
    }

    if (LabelDesignerUtils.isAnyInputFocused(fabricCanvas)) {
      return;
    }

    // Arrows
    if (key.startsWith("arrow")) {
      moveSelected(key.slice("arrow".length) as MoveDirection, cmdOrCtrl);
      return;
    }

    if (e.repeat) {
      return;
    }

    // Ctrl + D
    if (cmdOrCtrl && key === "d") {
      e.preventDefault();
      cloneSelected();
      return;
    }

    // Ctrl + Y, Ctrl + Shift + Z
    if ((cmdOrCtrl && key === "y") || (cmdOrCtrl && e.shiftKey && key === "z")) {
      e.preventDefault();
      if (!undoState.redoDisabled) {
        undo.redo();
      }
      return;
    }

    // Ctrl + Z
    if (cmdOrCtrl && key === "z") {
      e.preventDefault();
      if (!undoState.undoDisabled) {
        undo.undo();
      }
      return;
    }

    // Del
    if (key === "delete" || key === "backspace") {
      deleteSelected();
      return;
    }
  };

  const onUpdateLabelProps = (newProps: LabelProps) => {
    labelProps = newProps;
    fabricCanvas.setDimensions(labelProps.size);
    fabricCanvas.virtualZoom(fabricCanvas.getVirtualZoom());
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
    LabelDesignerObjectHelper.addImageBlob(fabricCanvas, img).then(() => undo.push(fabricCanvas, labelProps));
  };

  const onObjectPicked = (objectType: OjectType) => {
    const obj = LabelDesignerObjectHelper.addObject(fabricCanvas, objectType);
    if (obj !== undefined) {
      fabricCanvas.setActiveObject(obj);
      undo.push(fabricCanvas, labelProps);
    }
  };

  const onIconPicked = (i: MaterialIcon) => {
    // todo: icon is not vertically centered
    LabelDesignerObjectHelper.addStaticText(fabricCanvas, String.fromCodePoint(iconCodepoints[i]), {
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
    if (selectedObject) {
      selectedObject.setCoords();
      selectedObject.dirty = true;
    }
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
    const obj = LabelDesignerObjectHelper.addText(fabricCanvas, `{${name}}`, {
      textAlign: "left",
      originX: "left",
      originY: "top",
    });
    fabricCanvas.setActiveObject(obj);
    undo.push(fabricCanvas, labelProps);
  };

  const onPaste = async (event: ClipboardEvent) => {
    if (LabelDesignerUtils.isAnyInputFocused(fabricCanvas)) {
      return;
    }

    const openedDropdowns = document.querySelectorAll(".dropdown-menu.show");
    if (openedDropdowns.length > 0) {
      return;
    }

    if (event.clipboardData != null) {
      event.preventDefault();
      const obj = await LabelDesignerObjectHelper.addObjectFromClipboard(fabricCanvas, event.clipboardData);

      if (obj !== undefined) {
        fabricCanvas.setActiveObject(obj);
        undo.push(fabricCanvas, labelProps);
      }
    }
  };

  const clearCanvas = () => {
    if (!confirm($tr("editor.clear.confirm"))) {
      return;
    }
    undo.push(fabricCanvas, labelProps);
    fabricCanvas.clear();
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

    fabricCanvas = new CustomCanvas(htmlCanvas, {
      width: labelProps.size.width,
      height: labelProps.size.height,
    });
    fabricCanvas.setLabelProps(labelProps);

    const defaultTemplate = LocalStoragePersistence.loadDefaultTemplate();
    try {
      if (defaultTemplate !== null) {
        onLoadRequested(defaultTemplate);
      } else {
        LabelDesignerObjectHelper.addText(fabricCanvas, $tr("editor.default_text"));
      }
    } catch (e) {
      Toasts.error(e);
    }
    undo.push(fabricCanvas, labelProps);

    // force close dropdowns on touch devices
    fabricCanvas.on("mouse:down", (): void => {
      const dropdowns = document.querySelectorAll("[data-bs-toggle='dropdown']");
      dropdowns.forEach((el) => new Dropdown(el).hide());
    });

    fabricCanvas.on("object:moving", (e): void => {
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

    fabricCanvas.on("selection:created", (e): void => {
      selectedCount = e.selected?.length ?? 0;
      selectedObject = e.selected?.length === 1 ? e.selected[0] : undefined;
    });

    fabricCanvas.on("selection:updated", (e): void => {
      selectedCount = e.selected?.length ?? 0;
      selectedObject = e.selected?.length === 1 ? e.selected[0] : undefined;
    });

    fabricCanvas.on("selection:cleared", (): void => {
      selectedObject = undefined;
      selectedCount = 0;
    });

    fabricCanvas.on("drop", (e): void => {
      const dragEvt = e.e as DragEvent;
      dragEvt.preventDefault();

      if (dragEvt.dataTransfer?.files) {
        [...dragEvt.dataTransfer.files].forEach((file: File) => {
          LabelDesignerObjectHelper.addImageFile(fabricCanvas, file);
          undo.push(fabricCanvas, labelProps);
        });
      }
    });

    fabricCanvas.on("object:scaling", (e): void => {
      if (!e.target) {
        return;
      }

      const isNotScalable = e.target instanceof Barcode || e.target instanceof fabric.Rect;

      if (isNotScalable && e.target.width !== undefined && e.target.height !== undefined) {
        e.target.set({
          width: Math.round(e.target.width * (e.target.scaleX ?? 1)),
          height: Math.round(e.target.height * (e.target.scaleY ?? 1)),
          scaleX: 1,
          scaleY: 1,
        });
      }
    });

    if ($automation !== undefined) {
      if ($automation.startPrint !== undefined) {
        if ($automation.startPrint === "immediately") {
          openPreview();
        } else if ($automation.startPrint === "after_connect") {
          const unsubscribe = connectionState.subscribe((st) => {
            if (st === "connected") {
              tick().then(() => unsubscribe());
              openPreviewAndPrint();
            }
          });
        }
      }
    }
  });

  onDestroy(() => {
    fabricCanvas.dispose();
  });

  $: fabricCanvas?.setLabelProps(labelProps);
</script>

<svelte:window bind:innerWidth={windowWidth} on:keydown={onKeyDown} on:paste={onPaste} />

<div class="image-editor">
  <div class="row mb-3">
    <div class="col d-flex {windowWidth === 0 || labelProps.size.width < windowWidth ? 'justify-content-center' : ''}">
      <div class="canvas-wrapper print-start-{labelProps.printDirection}">
        <canvas bind:this={htmlCanvas}></canvas>
      </div>
    </div>
  </div>

  <div class="row mb-1">
    <div class="col d-flex justify-content-center">
      <div class="toolbar d-flex flex-wrap gap-1 justify-content-center align-items-center">
        <LabelPropsEditor {labelProps} onChange={onUpdateLabelProps} />

        <button class="btn btn-sm btn-secondary" on:click={clearCanvas} title={$tr("editor.clear")}>
          <MdIcon icon="cancel_presentation" />
        </button>

        <SavedLabelsMenu canvas={fabricCanvas} onRequestLabelTemplate={exportCurrentLabel} {onLoadRequested} />

        <button
          class="btn btn-sm btn-secondary"
          disabled={undoState.undoDisabled}
          on:click={() => undo.undo()}
          title={$tr("editor.undo")}>
          <MdIcon icon="undo" />
        </button>

        <button
          class="btn btn-sm btn-secondary"
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
        <ObjectPicker onSubmit={onObjectPicked} {labelProps} {zplImageReady} />

        <button class="btn btn-sm btn-primary ms-1" on:click={openPreview}>
          <MdIcon icon="visibility" />
          {$tr("editor.preview")}
        </button>
        <button
          title="Print with default or saved parameters"
          class="btn btn-sm btn-primary ms-1"
          on:click={openPreviewAndPrint}
          disabled={$connectionState !== "connected"}><MdIcon icon="print" /> {$tr("editor.print")}</button>
      </div>
    </div>
  </div>

  <div class="row mb-1">
    <div class="col d-flex justify-content-center">
      <div class="toolbar d-flex flex-wrap gap-1 justify-content-center align-items-center">
        {#if selectedCount > 0}
          <button class="btn btn-sm btn-danger me-1" on:click={deleteSelected} title={$tr("editor.delete")}>
            <MdIcon icon="delete" />
          </button>
        {/if}

        {#if selectedCount > 0}
          <button class="btn btn-sm btn-secondary me-1" on:click={cloneSelected} title={$tr("editor.clone")}>
            <MdIcon icon="content_copy" />
          </button>
        {/if}

        {#if selectedObject && selectedCount === 1}
          <GenericObjectParamsControls {selectedObject} valueUpdated={controlValueUpdated} />
        {/if}

        {#if selectedObject}
          <VectorParamsControls {selectedObject} valueUpdated={controlValueUpdated} />
        {/if}

        {#if selectedObject instanceof fabric.IText}
          <TextParamsControls {selectedObject} valueUpdated={controlValueUpdated} />
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
  .canvas-wrapper {
    border: 1px solid rgba(0, 0, 0, 0.4);
    background-color: rgba(60, 55, 63, 0.5);
  }
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
