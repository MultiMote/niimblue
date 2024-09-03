<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { fabric } from "fabric";
  import { type LabelProps, type OjectType, type ExportedLabelTemplate } from "../types";
  import LabelPropsEditor from "./LabelPropsEditor.svelte";
  import IconPicker from "./IconPicker.svelte";
  import { type IconName, icon as faIcon, parse as faParse } from "@fortawesome/fontawesome-svg-core";
  import ObjectPicker from "./ObjectPicker.svelte";
  import FaIcon from "./FaIcon.svelte";
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

  let htmlCanvas: HTMLCanvasElement;
  let fabricCanvas: fabric.Canvas;
  let labelProps: LabelProps = { printDirection: "left", size: { width: 240, height: 96 } };
  let previewOpened: boolean = false;
  let selectedObject: fabric.Object | undefined = undefined;
  let selectedCount: number = 0;

  const deleteSelected = () => {
    fabricCanvas.getActiveObjects().forEach((obj) => {
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
        obj.top! += 5;
        obj.left! += 5;
        fabricCanvas.add(obj);
        fabricCanvas.setActiveObject(obj);
      });
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    if (e.key === "Delete") {
      // todo: fix del in text editing
      deleteSelected();
    }
  };

  const onUpdateLabelProps = () => {
    labelProps = labelProps; // trigger update
    fabricCanvas.setDimensions(labelProps.size);
    localStorage.setItem("last_label_props", JSON.stringify(labelProps));
  };

  const onSaveClicked = () => {
    const data = fabricCanvas.toJSON();
    localStorage.setItem("saved_canvas_data", JSON.stringify(data));
    localStorage.setItem("saved_canvas_props", JSON.stringify(labelProps));
  };

  const onExportClicked = () => {
    FileUtils.saveLabelAsJson(fabricCanvas, labelProps);
  };

  const onImportClicked = async () => {
    const contents = await FileUtils.pickAndReadTextFile("json");
    const data = JSON.parse(contents);

    // todo: validation and merge with  onLoadClicked
    labelProps = data.label;
    onUpdateLabelProps();

    fabricCanvas.loadFromJSON(
      data.canvas,
      () => {
        fabricCanvas.requestRenderAll();
      },
      (src: object, obj: fabric.Object, error: any) => {
        obj.set({ snapAngle: 10 });
      }
    );
  };

  const onLoadClicked = () => {
    const props = localStorage.getItem("saved_canvas_props");
    if (props) {
      const parsedProps = JSON.parse(props);
      labelProps = parsedProps;
      onUpdateLabelProps();
    }

    const data = localStorage.getItem("saved_canvas_data");
    fabricCanvas.loadFromJSON(
      data,
      () => {
        fabricCanvas.requestRenderAll();
      },
      (src: object, obj: fabric.Object, error: any) => {
        obj.set({ snapAngle: 10 });
        // console.log(error);
      }
    );
  };

  const onObjectPicked = (objectType: OjectType) => {
    ImageEditorUtils.addObject(fabricCanvas, objectType);
  };

  const onIconPicked = (i: IconName) => {
    const lookup = faParse.icon(i);
    const iconData = faIcon(lookup);

    if (iconData === undefined) {
      console.error(`Icon ${i} not found`);
      return;
    }
    ImageEditorUtils.addSvg(fabricCanvas, iconData.html.toString());
  };

  const onPreviewClosed = () => {
    previewOpened = false;
  };

  const openPreview = () => {
    previewOpened = true;
  };

  const getImageForPreview = (): string => {
    return fabricCanvas.toDataURL({ format: "png" });
  };

  onMount(() => {
    const savedLabelPropsStr: string | null = localStorage.getItem("last_label_props");

    if (savedLabelPropsStr != null) {
      try {
        const obj = JSON.parse(savedLabelPropsStr);
        if ("size" in obj && "width" in obj.size && "height" in obj.size && ["top", "left"].includes(obj.printDirection)) {
          labelProps = obj as LabelProps;
        }
      } catch (e) {
        console.error(e);
      }
    }

    fabricCanvas = new fabric.Canvas(htmlCanvas, {
      width: labelProps.size.width,
      height: labelProps.size.height,
      backgroundColor: "#fff",
    });

    ImageEditorUtils.addText(fabricCanvas);

    // force close dropdowns on touch devices
    fabricCanvas.on("mouse:down", (e: fabric.IEvent<MouseEvent>): void => {
      const dropdowns = document.querySelectorAll("[data-bs-toggle='dropdown']");
      dropdowns.forEach((el) => new Dropdown(el).hide());
    });

    fabricCanvas.on("object:moving", (e: fabric.IEvent<MouseEvent>): void => {
      const grid = 5;
      if (e.target && e.target.left !== undefined && e.target.top !== undefined) {
        e.target.set({
          left: Math.round(e.target.left / grid) * grid,
          top: Math.round(e.target.top / grid) * grid,
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

<svelte:window on:keydown={onKeyDown} />

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

        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-secondary btn-sm" on:click={onSaveClicked}><FaIcon icon="floppy-disk" /></button>

          <button class="btn btn-secondary dropdown-toggle px-1" data-bs-toggle="dropdown"> </button>
          <div class="dropdown-menu px-2">
            <button class="btn btn-secondary btn-sm" on:click={onExportClicked}>Export JSON</button>
          </div>
        </div>

        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-secondary btn-sm" on:click={onLoadClicked}><FaIcon icon="folder-open" /></button>
          <button class="btn btn-secondary dropdown-toggle px-1" data-bs-toggle="dropdown"> </button>
          <div class="dropdown-menu px-2">
            <button class="btn btn-secondary btn-sm" on:click={onImportClicked}>Import JSON</button>
          </div>
        </div>

        <IconPicker onSubmit={onIconPicked} />
        <ObjectPicker onSubmit={onObjectPicked} />

        <button class="btn btn-sm btn-primary ms-1" on:click={openPreview}><FaIcon icon="print" /> Preview</button>
      </div>
    </div>
  </div>

  <div class="row mb-1">
    <div class="col d-flex justify-content-center">
      <div class="toolbar d-flex flex-wrap gap-1 justify-content-center align-items-center">
        {#if selectedCount > 0}
          <button class="btn btn-sm btn-danger me-1" on:click={deleteSelected}><FaIcon icon="trash" /></button>
        {/if}

        {#if selectedObject && selectedCount === 1}
          <button class="btn btn-sm btn-secondary me-1" on:click={cloneSelected}><FaIcon icon="clone" /></button>
          <GenericObjectParamsControls {selectedObject} valueUpdated={() => fabricCanvas.requestRenderAll()} />
        {/if}

        {#if selectedObject instanceof fabric.IText}
          <TextParamsPanel {selectedObject} valueUpdated={() => fabricCanvas.requestRenderAll()} />
        {/if}
        {#if selectedObject instanceof QRCode}
          <QrCodeParamsPanel {selectedObject} valueUpdated={() => fabricCanvas.requestRenderAll()} />
        {/if}
        {#if selectedObject instanceof Barcode}
          <BarcodeParamsPanel {selectedObject} valueUpdated={() => fabricCanvas.requestRenderAll()} />
        {/if}
      </div>
    </div>
  </div>

  {#if previewOpened}
    <PrintPreview onClosed={onPreviewClosed} imageCallback={getImageForPreview} {labelProps} />
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
