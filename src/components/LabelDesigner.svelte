<script lang="ts">
  import Dropdown from "bootstrap/js/dist/dropdown";
  import * as fabric from "fabric";
  import { onDestroy, onMount, tick } from "svelte";
  import { Barcode } from "$/fabric-object/barcode";
  import { QRCode } from "$/fabric-object/qrcode";
  import { iconCodepoints, type MaterialIcon } from "$/styles/mdi_icons";
  import { automation, connectionState, csvData } from "$/stores";
  import {
    type ExportedLabelTemplate,
    type FabricJson,
    type LabelProps,
    type MoveDirection,
    type OjectType,
  } from "$/types";
  import { FileUtils } from "$/utils/file_utils";
  import { tr } from "$/utils/i18n";
  import { LabelDesignerObjectHelper } from "$/utils/label_designer_object_helper";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import { Toasts } from "$/utils/toasts";
  import { UndoRedo, type UndoState } from "$/utils/undo_redo";
  import BarcodeParamsPanel from "$/components/designer-controls/BarcodeParamsControls.svelte";
  import CsvControl from "$/components/designer-controls/CsvControl.svelte";
  import GenericObjectParamsControls from "$/components/designer-controls/GenericObjectParamsControls.svelte";
  import IconPicker from "$/components/designer-controls/IconPicker.svelte";
  import LabelPropsEditor from "$/components/designer-controls/LabelPropsEditor.svelte";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import ObjectPicker from "$/components/designer-controls/ObjectPicker.svelte";
  import PrintPreview from "$/components/PrintPreview.svelte";
  import QrCodeParamsPanel from "$/components/designer-controls/QRCodeParamsControls.svelte";
  import TextParamsControls from "$/components/designer-controls/TextParamsControls.svelte";
  import VariableInsertControl from "$/components/designer-controls/VariableInsertControl.svelte";
  import { DEFAULT_LABEL_PROPS, GRID_SIZE } from "$/defaults";
  import { LabelDesignerUtils } from "$/utils/label_designer_utils";
  import SavedLabelsMenu from "$/components/designer-controls/SavedLabelsMenu.svelte";
  import { CustomCanvas } from "$/fabric-object/custom_canvas";
  import VectorParamsControls from "$/components/designer-controls/VectorParamsControls.svelte";
  import { fixFabricObjectScale } from "$/utils/canvas_utils";

  let htmlCanvas: HTMLCanvasElement;
  let canvasAreaRef: HTMLDivElement;
  let touchOverlayRef: HTMLDivElement;

  let fabricCanvas = $state<CustomCanvas>();
  let labelProps = $state<LabelProps>(DEFAULT_LABEL_PROPS);
  let previewOpened = $state<boolean>(false);
  let showPrintConfirm = $state<boolean>(false);
  let showClearConfirm = $state<boolean>(false);
  let selectedObject = $state<fabric.FabricObject | undefined>(undefined);
  let selectedCount = $state<number>(0);
  let editRevision = $state<number>(0);
  let printNow = $state<boolean>(false);
  let csvEnabled = $state<boolean>(false);
  let windowWidth = $state<number>(0);
  let undoState = $state<UndoState>({ undoDisabled: false, redoDisabled: false });
  let currentZoom = $state<number>(1);
  let isMultiSelectMode = $state<boolean>(false);

  // Touch gesture tracking
  let lastPinchDist = 0;
  let isPinching = false;
  let touchStartPos = { x: 0, y: 0 };
  let isPanning = false;
  let panStartScroll = { left: 0, top: 0 };
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;

  const MOVE_THRESHOLD = 8;
  const LONG_PRESS_MS = 400;

  const getTouchDist = (t1: Touch, t2: Touch): number => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const cancelLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };

  const enterMultiSelectMode = () => {
    isMultiSelectMode = true;
    if (navigator.vibrate) navigator.vibrate(30);
    if (fabricCanvas) {
      fabricCanvas.selection = true;
    }
    // Overlay off \u2192 Fabric receives all touch events directly
    if (touchOverlayRef) {
      touchOverlayRef.style.pointerEvents = "none";
    }
  };

  const exitMultiSelectMode = () => {
    isMultiSelectMode = false;
    if (fabricCanvas) {
      fabricCanvas.selection = false;
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
    }
    // Re-enable overlay for pan mode
    if (touchOverlayRef) {
      touchOverlayRef.style.pointerEvents = "auto";
    }
  };

  // Overlay logic: object selected \u2192 overlay off (Fabric handles drag/resize)
  //                nothing selected \u2192 overlay on (pan mode)
  //                multi-select mode \u2192 overlay off (Fabric handles everything)
  $effect(() => {
    if (touchOverlayRef && !isMultiSelectMode) {
      touchOverlayRef.style.pointerEvents = selectedCount > 0 ? "none" : "auto";
    }
  });

  const onOverlayTouchStart = (e: TouchEvent) => {
    if (e.touches.length >= 2) {
      cancelLongPress();
      isPanning = false;
      return;
    }

    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStartPos = { x: t.clientX, y: t.clientY };
      isPanning = false;
      panStartScroll = {
        left: canvasAreaRef?.scrollLeft ?? 0,
        top: canvasAreaRef?.scrollTop ?? 0,
      };

      // Start long-press timer for multi-select
      cancelLongPress();
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        enterMultiSelectMode();
      }, LONG_PRESS_MS);
    }
  };

  const onOverlayTouchMove = (e: TouchEvent) => {
    if (e.touches.length >= 2 || isPinching) {
      cancelLongPress();
      return;
    }

    if (e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - touchStartPos.x;
      const dy = t.clientY - touchStartPos.y;

      if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
        cancelLongPress();
        isPanning = true;
      }

      if (isPanning && canvasAreaRef) {
        e.preventDefault();
        canvasAreaRef.scrollLeft = panStartScroll.left - dx;
        canvasAreaRef.scrollTop = panStartScroll.top - dy;
      }
    }
  };

  const onOverlayTouchEnd = (e: TouchEvent) => {
    cancelLongPress();

    if (e.touches.length === 0) {
      if (!isPanning && !isPinching) {
        // Quick tap: forward to Fabric upper canvas for object selection
        const touch = e.changedTouches[0];
        const upperCanvas = (fabricCanvas as any)?.upperCanvasEl as HTMLElement | null;
        if (upperCanvas && touchOverlayRef) {
          touchOverlayRef.style.pointerEvents = "none";
          upperCanvas.dispatchEvent(new PointerEvent("pointerdown", {
            clientX: touch.clientX,
            clientY: touch.clientY,
            bubbles: true,
            pointerId: 1,
            pointerType: "touch",
          }));
          setTimeout(() => {
            upperCanvas.dispatchEvent(new PointerEvent("pointerup", {
              clientX: touch.clientX,
              clientY: touch.clientY,
              bubbles: true,
              pointerId: 1,
              pointerType: "touch",
            }));
            setTimeout(() => {
              if (touchOverlayRef && selectedCount === 0 && !isMultiSelectMode) {
                touchOverlayRef.style.pointerEvents = "auto";
              }
            }, 50);
          }, 50);
        }
      }
      isPanning = false;
    }
  };

  const setupTouchOverlay = (el: HTMLDivElement) => {
    el.addEventListener("touchstart", onOverlayTouchStart, { passive: false });
    el.addEventListener("touchmove", onOverlayTouchMove, { passive: false });
    el.addEventListener("touchend", onOverlayTouchEnd, { passive: true });
  };

  const teardownTouchOverlay = (el: HTMLDivElement) => {
    el.removeEventListener("touchstart", onOverlayTouchStart);
    el.removeEventListener("touchmove", onOverlayTouchMove);
    el.removeEventListener("touchend", onOverlayTouchEnd);
  };

  // Pinch-to-zoom: always active on canvas area, independent of overlay/mode
  const onAreaTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      cancelLongPress();
      isPanning = false;
      isPinching = true;
      lastPinchDist = getTouchDist(e.touches[0], e.touches[1]);
      e.preventDefault();
    }
  };

  const onAreaTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && isPinching && fabricCanvas) {
      e.preventDefault();
      const dist = getTouchDist(e.touches[0], e.touches[1]);
      const ratio = dist / lastPinchDist;
      const newZoom = fabricCanvas.getVirtualZoom() * ratio;
      fabricCanvas.virtualZoom(newZoom);
      currentZoom = fabricCanvas.getVirtualZoom();
      lastPinchDist = dist;
    }
  };

  const onAreaTouchEnd = (e: TouchEvent) => {
    if (isPinching && e.touches.length < 2) {
      isPinching = false;
      if (e.touches.length === 1) {
        const t = e.touches[0];
        touchStartPos = { x: t.clientX, y: t.clientY };
        panStartScroll = {
          left: canvasAreaRef?.scrollLeft ?? 0,
          top: canvasAreaRef?.scrollTop ?? 0,
        };
        isPanning = false;
      }
    }
  };

  const setupPinchZoom = (el: HTMLDivElement) => {
    el.addEventListener("touchstart", onAreaTouchStart, { passive: false });
    el.addEventListener("touchmove", onAreaTouchMove, { passive: false });
    el.addEventListener("touchend", onAreaTouchEnd, { passive: true });
  };

  const teardownPinchZoom = (el: HTMLDivElement) => {
    el.removeEventListener("touchstart", onAreaTouchStart);
    el.removeEventListener("touchmove", onAreaTouchMove);
    el.removeEventListener("touchend", onAreaTouchEnd);
  };

  const fitToWidth = () => {
    if (fabricCanvas && canvasAreaRef) {
      const containerWidth = canvasAreaRef.clientWidth - 32; // subtract padding
      const canvasWidth = fabricCanvas.getWidth();
      const fitZoom = containerWidth / canvasWidth;
      fabricCanvas.virtualZoom(fitZoom);
      currentZoom = fabricCanvas.getVirtualZoom();
      canvasAreaRef.scrollLeft = 0;
      canvasAreaRef.scrollTop = 0;
    }
  };

  const resetZoom = () => {
    fitToWidth();
  };

  const undo = new UndoRedo();

  const discardSelection = () => {
    fabricCanvas!.discardActiveObject();
    fabricCanvas!.requestRenderAll();
    selectedObject = undefined;
    selectedCount = 0;
    editRevision = 0;
  };

  const loadLabelData = async (data: ExportedLabelTemplate) => {
    undo.paused = true;
    onUpdateLabelProps(data.label);
    if (data.csv) {
      $csvData = data.csv;
      csvEnabled = true;
    }
    await FileUtils.loadCanvasState(fabricCanvas!, data.canvas);
    undo.paused = false;
  };

  undo.onLabelUpdate = loadLabelData;
  undo.onStateUpdate = (state: UndoState) => {
    undoState = state;
  };

  const deleteSelected = () => {
    LabelDesignerUtils.deleteSelection(fabricCanvas!);
    discardSelection();
  };

  const cloneSelected = () => {
    LabelDesignerUtils.cloneSelection(fabricCanvas!).then(() => undo.push(fabricCanvas!, labelProps));
  };

  const moveSelected = (direction: MoveDirection, ctrl?: boolean) => {
    LabelDesignerUtils.moveSelection(fabricCanvas!, direction, ctrl);
    undo.push(fabricCanvas!, labelProps);
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

    if (LabelDesignerUtils.isAnyInputFocused(fabricCanvas!)) {
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
    fabricCanvas!.setDimensions(labelProps.size);
    // Re-fit to container width after dimension change
    tick().then(() => fitToWidth());
    try {
      LocalStoragePersistence.saveLastLabelProps(labelProps);
      undo.push(fabricCanvas!, labelProps);
    } catch (e) {
      Toasts.zodErrors(e, "Label parameters save error:");
    }
  };

  const exportCurrentLabel = (): ExportedLabelTemplate => {
    return FileUtils.makeExportedLabel(fabricCanvas!, labelProps, csvEnabled);
  };

  const onLoadRequested = (label: ExportedLabelTemplate) => {
    loadLabelData(label).then(() => undo.push(fabricCanvas!, labelProps));
  };

  const zplImageReady = async (img: Blob) => {
    await LabelDesignerObjectHelper.addImageBlob(fabricCanvas!, img);
    undo.push(fabricCanvas!, labelProps);
  };

  const onObjectPicked = (objectType: OjectType) => {
    const obj = LabelDesignerObjectHelper.addObject(fabricCanvas!, objectType);
    if (obj !== undefined) {
      fabricCanvas!.setActiveObject(obj);
      undo.push(fabricCanvas!, labelProps);
    }
  };

  const onIconPicked = (i: MaterialIcon) => {
    // todo: icon is not vertically centered
    LabelDesignerObjectHelper.addStaticText(fabricCanvas!, String.fromCodePoint(iconCodepoints[i]), {
      fontFamily: "Material Icons",
      fontSize: 100,
    });
    undo.push(fabricCanvas!, labelProps);
  };

  const onSvgIconPicked = (i: string) => {
    LabelDesignerObjectHelper.addSvg(fabricCanvas!, i);
    undo.push(fabricCanvas!, labelProps);
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
    showPrintConfirm = true;
  };

  const confirmPrint = () => {
    showPrintConfirm = false;
    printNow = true;
    previewOpened = true;
  };

  const cancelPrint = () => {
    showPrintConfirm = false;
  };

  const controlValueUpdated = () => {
    if (selectedObject) {
      selectedObject.setCoords();
      selectedObject.dirty = true;
      undo.push(fabricCanvas!, labelProps);
    }
    fabricCanvas!.requestRenderAll();

    // trigger reactivity for controls
    editRevision++;
  };

  const getCanvasForPreview = (): FabricJson => {
    return fabricCanvas!.toJSON();
  };

  const onCsvPlaceholderPicked = (name: string) => {
    const obj = LabelDesignerObjectHelper.addText(fabricCanvas!, `{${name}}`, {
      textAlign: "left",
      originX: "left",
      originY: "top",
    });
    fabricCanvas!.setActiveObject(obj);
    undo.push(fabricCanvas!, labelProps);
  };

  const onPaste = async (event: ClipboardEvent) => {
    if (LabelDesignerUtils.isAnyInputFocused(fabricCanvas!)) {
      return;
    }

    const openedDropdowns = document.querySelectorAll(".dropdown-menu.show");
    if (openedDropdowns.length > 0) {
      return;
    }

    if (event.clipboardData != null) {
      event.preventDefault();
      const obj = await LabelDesignerObjectHelper.addObjectFromClipboard(fabricCanvas!, event.clipboardData);

      if (obj !== undefined) {
        fabricCanvas!.setActiveObject(obj);
        undo.push(fabricCanvas!, labelProps);
      }
    }
  };

  const clearCanvas = () => {
    showClearConfirm = true;
  };

  const confirmClear = () => {
    showClearConfirm = false;
    undo.push(fabricCanvas!, labelProps);
    fabricCanvas!.clear();
  };

  const cancelClear = () => {
    showClearConfirm = false;
  };

  const loadDefaultLabel = async () => {
    try {
      const urlTemplate = await FileUtils.readLabelFromUrl();

      if (urlTemplate !== null && confirm($tr("params.saved_labels.load.url.warn"))) {
        onLoadRequested(urlTemplate);
        Toasts.message($tr("params.saved_labels.load.url.loaded"));
        return;
      }
    } catch (e) {
      Toasts.error(e);
    }

    try {
      const defaultTemplate = LocalStoragePersistence.loadDefaultTemplate();

      if (defaultTemplate !== null) {
        onLoadRequested(defaultTemplate);
        return;
      }
    } catch (e) {
      Toasts.error(e);
    }

    LabelDesignerObjectHelper.addText(fabricCanvas!, $tr("editor.default_text"));
  };

  onMount(async () => {
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
    // On touch: selection disabled by default, enabled via long-press multi-select mode
    if (window.matchMedia('(pointer: coarse)').matches) {
      fabricCanvas.selection = false;
    }
    fabricCanvas.setLabelProps(labelProps);

    await loadDefaultLabel();

    undo.push(fabricCanvas, labelProps);

    // force close dropdowns on touch devices
    fabricCanvas.on("mouse:down", (): void => {
      const dropdowns = document.querySelectorAll("[data-bs-toggle='dropdown']");
      dropdowns.forEach((el) => new Dropdown(el).hide());
    });

    // sync zoom indicator with mouse wheel zoom
    fabricCanvas.on("mouse:wheel", (): void => {
      currentZoom = fabricCanvas!.getVirtualZoom();
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
      undo.push(fabricCanvas!, labelProps);
    });

    fabricCanvas.on("object:removed", (): void => {
      undo.push(fabricCanvas!, labelProps);
    });

    fabricCanvas.on("selection:created", (e): void => {
      selectedCount = e.selected?.length ?? 0;
      selectedObject = e.selected?.length === 1 ? e.selected[0] : undefined;
      editRevision++;
    });

    fabricCanvas.on("selection:updated", (e): void => {
      selectedCount = e.selected?.length ?? 0;
      selectedObject = e.selected?.length === 1 ? e.selected[0] : undefined;
      editRevision++;
    });

    fabricCanvas.on("selection:cleared", (): void => {
      selectedObject = undefined;
      selectedCount = 0;
      editRevision++;
    });

    fabricCanvas.on("dragover", (e): void => {
      e.e.preventDefault();
    });

    fabricCanvas.on("drop:after", async (e): Promise<void> => {
      const dragEvt = e.e as DragEvent;
      dragEvt.preventDefault();

      let dropped = false;

      if (dragEvt.dataTransfer?.files) {
        for (const file of dragEvt.dataTransfer.files) {
          try {
            await LabelDesignerObjectHelper.addImageFile(fabricCanvas!, file);
            dropped = true;
          } catch (e) {
            Toasts.error(e);
          }
        }

        if (dropped) {
          undo.push(fabricCanvas!, labelProps);
        }
      }
    });

    fabricCanvas.on("object:scaling", (e): void => {
      if (!e.target) {
        return;
      }

      fixFabricObjectScale(e.target);
    });

    if ($automation !== undefined) {
      if ($automation.startPrint !== undefined) {
        if ($automation.startPrint === "immediately") {
          openPreview();
        } else if ($automation.startPrint === "after_connect") {
          const unsubscribe = connectionState.subscribe((st) => {
            if (st === "connected") {
              tick().then(() => unsubscribe());
              confirmPrint();
            }
          });
        }
      }
    }

    // Setup touch overlay for pan/tap/long-press gestures
    if (touchOverlayRef) {
      setupTouchOverlay(touchOverlayRef);
    }

    // Setup pinch-to-zoom on canvas area (always active, even in multi-select)
    if (canvasAreaRef) {
      setupPinchZoom(canvasAreaRef);
    }

    // Fit canvas to container width on initial load
    tick().then(() => fitToWidth());
  });

  onDestroy(() => {
    if (touchOverlayRef) {
      teardownTouchOverlay(touchOverlayRef);
    }
    if (canvasAreaRef) {
      teardownPinchZoom(canvasAreaRef);
    }
    fabricCanvas!.dispose();
  });

  $effect(() => {
    fabricCanvas?.setLabelProps(labelProps);
  });
</script>

<svelte:window bind:innerWidth={windowWidth} onkeydown={onKeyDown} onpaste={onPaste} />

<div class="nb-editor">
  <!-- Canvas area -->
  <div class="nb-canvas-container">
    <div class="nb-canvas-area"
      bind:this={canvasAreaRef}>
      <div class="nb-canvas-wrapper print-start-{labelProps.printDirection}">
        <canvas bind:this={htmlCanvas}></canvas>
        <div class="nb-touch-overlay" bind:this={touchOverlayRef}></div>
      </div>
    </div>
    {#if isMultiSelectMode}
      <button class="nb-multiselect-badge" onclick={exitMultiSelectMode}>
        <MdIcon icon="select_all" />
        <MdIcon icon="close" />
      </button>
    {/if}
    <button class="nb-zoom-badge" onclick={resetZoom} title="Fit to width">
      {Math.round(currentZoom * 100)}%
      <MdIcon icon="fit_screen" />
    </button>
  </div>

  <!-- Object controls toolbar (shown when object selected) -->
  {#if selectedCount > 0}
  <div class="nb-toolbar">
    <div class="nb-toolbar-row nb-toolbar-controls">
        <button class="nb-tool-btn danger" onclick={deleteSelected} title={$tr("editor.delete")}>
          <MdIcon icon="delete" />
        </button>

        <button class="nb-tool-btn" onclick={cloneSelected} title={$tr("editor.clone")}>
          <MdIcon icon="content_copy" />
        </button>

      {#if selectedObject && selectedCount === 1}
        <GenericObjectParamsControls {selectedObject} {editRevision} valueUpdated={controlValueUpdated} />
      {/if}

      {#if selectedObject}
        <VectorParamsControls {selectedObject} {editRevision} valueUpdated={controlValueUpdated} />
      {/if}

      {#if selectedObject instanceof fabric.IText}
        <TextParamsControls selectedText={selectedObject} {editRevision} valueUpdated={controlValueUpdated} />
      {/if}

      {#if selectedObject instanceof QRCode}
        <QrCodeParamsPanel selectedQRCode={selectedObject} {editRevision} valueUpdated={controlValueUpdated} />
      {/if}

      {#if selectedObject instanceof Barcode}
        <BarcodeParamsPanel selectedBarcode={selectedObject} {editRevision} valueUpdated={controlValueUpdated} />
      {/if}

      {#if selectedObject instanceof fabric.IText || selectedObject instanceof QRCode || (selectedObject instanceof Barcode && selectedObject.encoding === "CODE128B")}
        <VariableInsertControl {selectedObject} valueUpdated={controlValueUpdated} />
      {/if}
    </div>
  </div>
  {/if}

  <!-- Main toolbar -->
  <div class="nb-toolbar">
    <div class="nb-toolbar-grid">
      <div class="nb-grid-item" style="--icon-bg:#E5E7EB; --icon-color:#4B5563">
        <LabelPropsEditor {labelProps} onChange={onUpdateLabelProps} />
      </div>

      <button class="nb-grid-btn" onclick={clearCanvas} title={$tr("editor.clear")}>
        <div class="nb-grid-icon" style="background:#FEE2E2; color:#DC2626"><MdIcon icon="cancel_presentation" /></div>
      </button>

      <div class="nb-grid-item" style="--icon-bg:#E0E7FF; --icon-color:#4338CA">
        <SavedLabelsMenu
          canvas={fabricCanvas!}
          onRequestLabelTemplate={exportCurrentLabel}
          {onLoadRequested}
          {csvEnabled} />
      </div>

      <button class="nb-grid-btn" disabled={undoState.undoDisabled} onclick={() => undo.undo()} title={$tr("editor.undo")}>
        <div class="nb-grid-icon" style="background:#F3F4F6; color:#6B7280"><MdIcon icon="undo" /></div>
      </button>

      <button class="nb-grid-btn" disabled={undoState.redoDisabled} onclick={() => undo.redo()} title={$tr("editor.redo")}>
        <div class="nb-grid-icon" style="background:#F3F4F6; color:#6B7280"><MdIcon icon="redo" /></div>
      </button>

      <div class="nb-grid-item" style="--icon-bg:#FEF3C7; --icon-color:#D97706">
        <CsvControl bind:enabled={csvEnabled} onPlaceholderPicked={onCsvPlaceholderPicked} />
      </div>

      <div class="nb-grid-item" style="--icon-bg:#FCE7F3; --icon-color:#DB2777">
        <IconPicker onSubmit={onIconPicked} onSubmitSvg={onSvgIconPicked} />
      </div>

      <div class="nb-grid-item" style="--icon-bg:#DBEAFE; --icon-color:#2563EB">
        <ObjectPicker onSubmit={onObjectPicked} {labelProps} {zplImageReady} />
      </div>

      <button class="nb-grid-btn" onclick={openPreview}>
        <div class="nb-grid-icon" style="background:#D1FAE5; color:#059669"><MdIcon icon="visibility" /></div>
      </button>

      <button class="nb-grid-btn" onclick={openPreviewAndPrint} disabled={$connectionState !== "connected"}>
        <div class="nb-grid-icon" style="background:#DBEAFE; color:#2563EB"><MdIcon icon="print" /></div>
      </button>
    </div>
  </div>

  {#if showClearConfirm}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="nb-confirm-overlay" onclick={cancelClear} onkeydown={(e) => e.key === 'Escape' && cancelClear()}>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="nb-confirm-dialog" onclick={(e) => e.stopPropagation()}>
        <div class="nb-confirm-icon danger">
          <MdIcon icon="delete_forever" />
        </div>
        <p class="nb-confirm-text">{$tr("editor.clear")}?</p>
        <div class="nb-confirm-actions">
          <button class="nb-confirm-btn cancel" onclick={cancelClear}>
            <MdIcon icon="close" />
          </button>
          <button class="nb-confirm-btn confirm danger" onclick={confirmClear}>
            <MdIcon icon="delete_forever" />
            {$tr("editor.clear")}
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showPrintConfirm}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="nb-confirm-overlay" onclick={cancelPrint} onkeydown={(e) => e.key === 'Escape' && cancelPrint()}>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="nb-confirm-dialog" onclick={(e) => e.stopPropagation()}>
        <div class="nb-confirm-icon">
          <MdIcon icon="print" />
        </div>
        <p class="nb-confirm-text">{$tr("editor.print")}?</p>
        <div class="nb-confirm-actions">
          <button class="nb-confirm-btn cancel" onclick={cancelPrint}>
            <MdIcon icon="close" />
          </button>
          <button class="nb-confirm-btn confirm" onclick={confirmPrint}>
            <MdIcon icon="print" />
            {$tr("editor.print")}
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if previewOpened}
    <PrintPreview
      onClosed={onPreviewClosed}
      canvasCallback={getCanvasForPreview}
      {labelProps}
      {printNow}
      {csvEnabled}
      csvData={$csvData.data} />
  {/if}
</div>

<style>
  .nb-editor {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .nb-canvas-container {
    position: relative;
    border-radius: var(--nb-radius);
    overflow: hidden;
  }

  .nb-canvas-area {
    padding: 16px;
    background: radial-gradient(circle at 50% 50%, var(--nb-surface-alt) 0%, var(--nb-bg) 100%);
    min-height: 200px;
    overflow: auto;
    touch-action: pan-x pan-y;
    -webkit-overflow-scrolling: touch;
    text-align: center;
  }

  .nb-zoom-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(0, 0, 0, 0.65);
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    backdrop-filter: blur(8px);
    transition: background 0.15s;
    z-index: 6;
  }

  .nb-zoom-badge:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .nb-multiselect-badge {
    position: absolute;
    bottom: 8px;
    left: 8px;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 8px;
    background: rgba(37, 99, 235, 0.85);
    color: white;
    border: none;
    border-radius: 16px;
    font-size: 12px;
    cursor: pointer;
    backdrop-filter: blur(8px);
    z-index: 6;
    animation: slideUp 0.15s ease;
  }

  .nb-multiselect-badge:active {
    transform: scale(0.95);
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .nb-canvas-wrapper {
    border: 1px solid var(--nb-border);
    background-color: var(--nb-surface);
    border-radius: 4px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    position: relative;
    display: inline-block;
  }

  .nb-touch-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 5;
    touch-action: none;
  }

  /* On desktop (mouse), don't intercept events - let Fabric handle directly */
  @media (hover: hover) and (pointer: fine) {
    .nb-touch-overlay {
      display: none !important;
    }
  }

  .nb-canvas-wrapper.print-start-left::before,
  .nb-canvas-wrapper.print-start-top::before {
    content: '';
    position: absolute;
    z-index: 10;
    pointer-events: none;
  }

  .nb-canvas-wrapper.print-start-left::before {
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #EF4444;
    border-radius: 4px 0 0 4px;
  }
  .nb-canvas-wrapper.print-start-top::before {
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #EF4444;
    border-radius: 4px 4px 0 0;
  }

  .nb-canvas-wrapper :global(canvas) {
    image-rendering: pixelated;
  }

  .nb-toolbar {
    display: flex;
    justify-content: center;
  }

  .nb-toolbar-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    align-items: center;
    padding: 10px 14px;
    background: var(--nb-surface);
    border-radius: var(--nb-radius);
    border: 1px solid var(--nb-border);
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }

  .nb-toolbar-controls:empty {
    display: none;
  }

  .nb-toolbar-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
    padding: 8px;
    background: var(--nb-surface);
    border-radius: var(--nb-radius);
    border: 1px solid var(--nb-border);
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    width: 100%;
  }

  .nb-grid-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid var(--nb-border);
    background: var(--nb-surface);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .nb-grid-btn:hover {
    border-color: var(--nb-primary);
    background: var(--nb-primary-light);
  }

  .nb-grid-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .nb-grid-btn:disabled:hover {
    border-color: var(--nb-border);
    background: var(--nb-surface);
  }

  .nb-grid-item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid var(--nb-border);
    background: var(--nb-surface);
    transition: all 0.15s ease;
  }

  .nb-grid-item:hover {
    border-color: var(--nb-primary);
    background: var(--nb-primary-light);
  }

  /* Style component internal trigger buttons to look like grid icons */
  .nb-grid-item :global(.dropdown > .btn),
  .nb-grid-item :global(> .btn) {
    height: 30px;
    min-width: 30px;
    width: auto;
    padding: 0 6px !important;
    border-radius: 8px !important;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none !important;
    font-size: 16px;
    background: var(--icon-bg, #E5E7EB) !important;
    color: var(--icon-color, #4B5563) !important;
    box-shadow: none !important;
  }

  .nb-grid-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 18px;
  }

  .nb-tool-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 10px;
    background: var(--nb-surface);
    color: var(--nb-text-secondary);
    border: 1px solid var(--nb-border);
    border-radius: var(--nb-radius-xs);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .nb-tool-btn:hover {
    background: var(--nb-surface-alt);
    color: var(--nb-text);
  }

  .nb-tool-btn.danger {
    color: var(--nb-accent);
    border-color: rgba(244,63,94,0.2);
  }

  .nb-tool-btn.danger:hover {
    background: var(--nb-accent-light);
  }

  .nb-confirm-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    backdrop-filter: blur(2px);
  }

  .nb-confirm-dialog {
    background: white;
    border-radius: 16px;
    padding: 24px;
    min-width: 280px;
    max-width: 320px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  }

  .nb-confirm-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #DBEAFE;
    color: #2563EB;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
    font-size: 24px;
  }

  .nb-confirm-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--nb-text);
    margin: 0 0 20px;
  }

  .nb-confirm-actions {
    display: flex;
    gap: 10px;
  }

  .nb-confirm-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    border: none;
    transition: all 0.15s ease;
  }

  .nb-confirm-btn.cancel {
    background: #F3F4F6;
    color: #6B7280;
  }

  .nb-confirm-btn.cancel:hover {
    background: #E5E7EB;
  }

  .nb-confirm-btn.confirm {
    background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }

  .nb-confirm-btn.confirm:hover {
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
  }

  .nb-confirm-icon.danger {
    background: #FEE2E2;
    color: #DC2626;
  }

  .nb-confirm-btn.confirm.danger {
    background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }

  .nb-confirm-btn.confirm.danger:hover {
    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
  }
</style>
