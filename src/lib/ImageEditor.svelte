<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { fabric } from "fabric";
  import {
    type LabelProps,
    type OjectType,
    type MoveDirection,
    type FabricJson,
    ExportedLabelTemplateSchema,
  } from "../types";
  import LabelPropsEditor from "./LabelPropsEditor.svelte";
  import IconPicker from "./IconPicker.svelte";
  import ObjectPicker from "./ObjectPicker.svelte";
  import PrintPreview from "./PrintPreview.svelte";
  import TextParamsPanel from "./TextParamsControls.svelte";
  import GenericObjectParamsControls from "./GenericObjectParamsControls.svelte";
  import { ImageEditorUtils } from "../utils/image_editor_utils";
  import { QRCode } from "../fabric-object/qrcode.class";
  import QrCodeParamsPanel from "./QRCodeParamsControls.svelte";
  import { Barcode } from "../fabric-object/barcode.class";
  import BarcodeParamsPanel from "./BarcodeParamsControls.svelte";
  import Dropdown from "bootstrap/js/dist/dropdown";
  import { FileUtils } from "../utils/file_utils";
  import ZplImportButton from "./ZplImportButton.svelte";
  import { connectionState } from "../stores";
  import { tr } from "../utils/i18n";
  import VariableInsertControl from "./VariableInsertControl.svelte";
  import CsvControl from "./CsvControl.svelte";
  import { LocalStoragePersistence } from "../utils/persistence";
  import { iconCodepoints, type MaterialIcon } from "../mdi_icons";
  import MdIcon from "./MdIcon.svelte";
  import { Toasts } from "../utils/toasts";

  let GRID_SIZE: number = 5;

  let htmlCanvas: HTMLCanvasElement;
  let fabricCanvas: fabric.Canvas;
  let labelProps: LabelProps = { printDirection: "left", size: { width: 240, height: 96 } };
  let previewOpened: boolean = false;
  let selectedObject: fabric.Object | undefined = undefined;
  let selectedCount: number = 0;
  let printNow: boolean = false;
  let csvData: string = "";
  let csvEnabled: boolean = false;

  const deleteSelected = () => {
    const selected: fabric.Object[] = fabricCanvas.getActiveObjects();
    for (const obj of selected) {
      if (obj instanceof fabric.IText && obj.isEditing) {
        return;
      }
    }
    selected.forEach((obj) => {
      fabricCanvas.remove(obj);
    });
    selectedObject = undefined;
    selectedCount = 0;
    fabricCanvas.discardActiveObject();
  };

  const cloneSelected = () => {
    if (selectedObject) {
      selectedObject.clone((obj: fabric.Object) => {
        obj.snapAngle = 10;
        obj.top! += GRID_SIZE;
        obj.left! += GRID_SIZE;
        fabricCanvas.add(obj);
        fabricCanvas.setActiveObject(obj);
      });
    }
  };

  const moveSelected = (direction: MoveDirection, ctrl?: boolean) => {
    const selected: fabric.Object[] = fabricCanvas.getActiveObjects();
    for (const obj of selected) {
      if (obj instanceof fabric.IText && obj.isEditing) {
        return;
      }
    }

    const amount = ctrl ? 1 : GRID_SIZE;

    selected.forEach((obj) => {
      if (direction === "Left") {
        // round to fix inter-pixel positions
        obj.left = Math.round(obj.left!) - amount;
      } else if (direction === "Right") {
        obj.left = Math.round(obj.left!) + amount;
      } else if (direction === "Up") {
        obj.top = Math.round(obj.top!) - amount;
      } else if (direction === "Down") {
        obj.top = Math.round(obj.top!) + amount;
      }
      obj.setCoords();
    });
    fabricCanvas.requestRenderAll();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key.startsWith("Arrow")) {
      moveSelected(e.key.slice("Arrow".length) as MoveDirection, e.ctrlKey);
    }

    if (e.repeat) {
      return;
    }

    if (e.key === "Delete") {
      deleteSelected();
    } else if (e.key === "Escape") {
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
    }
  };

  const onUpdateLabelProps = (newProps: LabelProps) => {
    labelProps = newProps;
    fabricCanvas.setDimensions(labelProps.size);
    try {
      LocalStoragePersistence.saveLastLabelProps(labelProps);
    } catch (e) {
      Toasts.zodErrors(e, "Label parameters save error:");
    }
  };

  const onSaveClicked = () => {
    if (confirm($tr("editor.warning.save"))) {
      try {
        LocalStoragePersistence.saveCanvas(labelProps, fabricCanvas.toJSON());
      } catch (e) {
        Toasts.zodErrors(e, "Canvas save error:");
      }
    }
  };

  const onExportClicked = () => {
    try {
      FileUtils.saveLabelAsJson(fabricCanvas, labelProps);
    } catch (e) {
      Toasts.zodErrors(e, "Canvas save error:");
    }
  };

  const onImportClicked = async () => {
    const contents = await FileUtils.pickAndReadTextFile("json");
    const rawData = JSON.parse(contents);

    if (!confirm($tr("editor.warning.load"))) {
      return;
    }

    try {
      const data = ExportedLabelTemplateSchema.parse(rawData);

      labelProps = data.label;
      onUpdateLabelProps(labelProps);

      fabricCanvas.loadFromJSON(
        data.canvas,
        () => {
          fabricCanvas.backgroundColor = "#fff";
          fabricCanvas.requestRenderAll();
        },
        (src: object, obj: fabric.Object, error: any) => {
          obj.set({ snapAngle: 10 });
        },
      );
    } catch (e) {
      Toasts.zodErrors(e, "Canvas load error:");
    }
  };

  const onLoadClicked = () => {
    if (!confirm($tr("editor.warning.load"))) {
      return;
    }

    try {
      const { labelData, canvasData } = LocalStoragePersistence.loadSavedCanvas();

      if (labelData === null || canvasData === null) {
        Toasts.error("No saved label data found, or data is corrupt");
        return;
      }

      labelProps = labelData;
      onUpdateLabelProps(labelProps);

      fabricCanvas.loadFromJSON(
        canvasData,
        () => {
          fabricCanvas.backgroundColor = "#fff";
          fabricCanvas.requestRenderAll();
        },
        (src: object, obj: fabric.Object, error: any) => {
          obj.set({ snapAngle: 10 });
          // console.log(error);
        },
      );
    } catch (e) {
      Toasts.zodErrors(e, "Canvas load error:");
    }
  };

  const zplImageReady = (img: Blob) => {
    const reader = new FileReader();

    reader.readAsDataURL(img);
    reader.onload = (readerEvt: ProgressEvent<FileReader>) => {
      if (readerEvt?.target?.result) {
        fabric.Image.fromURL(readerEvt.target.result as string, (img: fabric.Image) => {
          img.set({ left: 0, top: 0, snapAngle: 10 });
          fabricCanvas.add(img);
        });
      }
    };

    reader.onerror = (readerEvt: ProgressEvent<FileReader>) => {
      console.error(readerEvt);
    };
  };

  const onObjectPicked = (objectType: OjectType) => {
    const obj = ImageEditorUtils.addObject(fabricCanvas, objectType);
    if (obj !== undefined) {
      fabricCanvas.setActiveObject(obj);
    }
  };

  const onIconPicked = (i: MaterialIcon) => {
    // todo: icon is not vertically centered
    ImageEditorUtils.addStaticText(fabricCanvas, String.fromCodePoint(iconCodepoints[i]), {
      fontFamily: "Material Icons",
      fontSize: 100,
    });
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
    const obj = ImageEditorUtils.addText(fabricCanvas, `{${name}}`, {
      textAlign: "left",
      originX: "left",
      originY: "top",
    });
    fabricCanvas.setActiveObject(obj);
  };

  const onPaste = (event: ClipboardEvent) => {
    const selected: fabric.Object[] = fabricCanvas.getActiveObjects();
    for (const obj of selected) {
      if ((obj instanceof fabric.IText && obj.isEditing) || obj instanceof QRCode) {
        return;
      }
    }

    const openedDropdowns = document.querySelectorAll(".dropdown-menu.show");
    if (openedDropdowns.length > 0) {
      return;
    }

    if (event.clipboardData) {
      // paste image
      for (const item of event.clipboardData.items) {
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            ImageEditorUtils.addImageFile(fabricCanvas, blob);
          }
        }
      }

      // paste text
      const text = event.clipboardData.getData("text");
      if (text) {
        const obj = ImageEditorUtils.addText(fabricCanvas, text);
        fabricCanvas.setActiveObject(obj);
      }

      event.preventDefault();
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

    ImageEditorUtils.addText(fabricCanvas, $tr("editor.default_text"));

    // force close dropdowns on touch devices
    fabricCanvas.on("mouse:down", (e: fabric.IEvent<MouseEvent>): void => {
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
        [...dragEvt.dataTransfer.files].forEach((file: File, idx: number) => {
          ImageEditorUtils.addImageFile(fabricCanvas, file);
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
  <div class="row mb-1">
    <div class="col d-flex justify-content-center">
      <div class="canvas-wrapper print-start-{labelProps.printDirection}">
        <canvas bind:this={htmlCanvas}></canvas>
      </div>
    </div>
  </div>

  <div class="row mb-1">
    <div class="col d-flex justify-content-center">
      <div class="toolbar d-flex flex-wrap gap-1 justify-content-center align-items-center">
        <LabelPropsEditor {labelProps} onChange={onUpdateLabelProps} />

        <CsvControl
          csv={csvData}
          enabled={csvEnabled}
          onUpdate={onCsvUpdate}
          onPlaceholderPicked={onCsvPlaceholderPicked} />

        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-secondary dropdown-toggle px-1" data-bs-toggle="dropdown">
            <MdIcon icon="save" />
          </button>
          <div class="dropdown-menu px-2">
            <div class="d-flex gap-1 flex-wrap">
              <button class="btn btn-secondary btn-sm" on:click={onSaveClicked}>
                <MdIcon icon="open_in_browser" />
                {$tr("editor.save.browser")}
              </button>
              <button class="btn btn-secondary btn-sm" on:click={onExportClicked}>
                <MdIcon icon="data_object" />
                {$tr("editor.save.json")}
              </button>
            </div>
          </div>
        </div>

        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-secondary dropdown-toggle px-1" data-bs-toggle="dropdown" data-bs-auto-close="outside">
            <MdIcon icon="folder" />
          </button>
          <div class="dropdown-menu px-2">
            <div class="d-flex gap-1 flex-wrap">
              <button class="btn btn-secondary btn-sm" on:click={onLoadClicked}>
                <MdIcon icon="open_in_browser" />
                {$tr("editor.load.browser")}
              </button>
              <button class="btn btn-secondary btn-sm" on:click={onImportClicked}>
                <MdIcon icon="data_object" />
                {$tr("editor.load.json")}
              </button>
              <ZplImportButton {labelProps} onImageReady={zplImageReady} text={$tr("editor.import.zpl")} />
            </div>
          </div>
        </div>

        <IconPicker onSubmit={onIconPicked} />
        <ObjectPicker onSubmit={onObjectPicked} />

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

        {#if selectedObject && selectedCount === 1}
          <button class="btn btn-sm btn-secondary me-1" on:click={cloneSelected} title={$tr("editor.clone")}>
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
</style>
