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

  // Middle-mouse pan (desktop)
  let isMiddlePanning = false;
  let middlePanStart = { x: 0, y: 0 };
  let middlePanScroll = { left: 0, top: 0 };

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

  // Right-click pan handlers (desktop browser)
  const onPanMouseDown = (e: MouseEvent) => {
    if (e.button === 2 && canvasAreaRef) {
      e.preventDefault();
      e.stopPropagation();
      isMiddlePanning = true;
      middlePanStart = { x: e.clientX, y: e.clientY };
      middlePanScroll = {
        left: canvasAreaRef.scrollLeft,
        top: canvasAreaRef.scrollTop,
      };
      canvasAreaRef.style.cursor = "grabbing";
    }
  };

  const onPanMouseMove = (e: MouseEvent) => {
    if (isMiddlePanning && canvasAreaRef) {
      e.preventDefault();
      const dx = e.clientX - middlePanStart.x;
      const dy = e.clientY - middlePanStart.y;
      canvasAreaRef.scrollLeft = middlePanScroll.left - dx;
      canvasAreaRef.scrollTop = middlePanScroll.top - dy;
    }
  };

  const onPanMouseUp = (e: MouseEvent) => {
    if (isMiddlePanning) {
      e.preventDefault();
      isMiddlePanning = false;
      if (canvasAreaRef) canvasAreaRef.style.cursor = "";
    }
  };

  // Prevent context menu on canvas area (right-click is used for pan)
  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  let baseZoom = $state<number>(1); // the fitToWidth zoom level

  const fitToWidth = () => {
    if (fabricCanvas && canvasAreaRef) {
      const containerWidth = canvasAreaRef.clientWidth - 32; // subtract padding
      const canvasWidth = fabricCanvas.getWidth();
      const fitZoom = containerWidth / canvasWidth;
      fabricCanvas.virtualZoom(fitZoom);
      currentZoom = fabricCanvas.getVirtualZoom();
      baseZoom = currentZoom;
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
      // Right-click pan (desktop)
      canvasAreaRef.addEventListener("mousedown", onPanMouseDown, { capture: true });
      canvasAreaRef.addEventListener("contextmenu", onContextMenu);
      window.addEventListener("mousemove", onPanMouseMove);
      window.addEventListener("mouseup", onPanMouseUp);
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
      canvasAreaRef.removeEventListener("mousedown", onPanMouseDown, { capture: true });
      canvasAreaRef.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("mousemove", onPanMouseMove);
      window.removeEventListener("mouseup", onPanMouseUp);
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
    {#if Math.round(currentZoom * 100) !== Math.round(baseZoom * 100)}
    <button class="nb-zoom-badge" onclick={resetZoom} title="Fit to width">
      {Math.round(currentZoom * 100)}%
      <MdIcon icon="fit_screen" />
    </button>
    {/if}
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
      <div class="nb-grid-item" style="--icon-bg:var(--nb-icon-settings-bg); --icon-color:var(--nb-icon-settings-color)">
        <LabelPropsEditor {labelProps} onChange={onUpdateLabelProps} />
      </div>

      <button class="nb-grid-btn" onclick={clearCanvas} title={$tr("editor.clear")}>
        <div class="nb-grid-icon" style="background:var(--nb-icon-delete-bg); color:var(--nb-icon-delete-color)"><MdIcon icon="cancel_presentation" /></div>
      </button>

      <div class="nb-grid-item" style="--icon-bg:var(--nb-icon-save-bg); --icon-color:var(--nb-icon-save-color)">
        <SavedLabelsMenu
          canvas={fabricCanvas!}
          onRequestLabelTemplate={exportCurrentLabel}
          {onLoadRequested}
          {csvEnabled} />
      </div>

      <button class="nb-grid-btn" disabled={undoState.undoDisabled} onclick={() => undo.undo()} title={$tr("editor.undo")}>
        <div class="nb-grid-icon" style="background:var(--nb-icon-undo-bg); color:var(--nb-icon-undo-color)"><MdIcon icon="undo" /></div>
      </button>

      <button class="nb-grid-btn" disabled={undoState.redoDisabled} onclick={() => undo.redo()} title={$tr("editor.redo")}>
        <div class="nb-grid-icon" style="background:var(--nb-icon-undo-bg); color:var(--nb-icon-undo-color)"><MdIcon icon="redo" /></div>
      </button>

      <div class="nb-grid-item" style="--icon-bg:var(--nb-icon-csv-bg); --icon-color:var(--nb-icon-csv-color)">
        <CsvControl bind:enabled={csvEnabled} onPlaceholderPicked={onCsvPlaceholderPicked} />
      </div>

      <div class="nb-grid-item" style="--icon-bg:var(--nb-icon-emoji-bg); --icon-color:var(--nb-icon-emoji-color)">
        <IconPicker onSubmit={onIconPicked} onSubmitSvg={onSvgIconPicked} />
      </div>

      <div class="nb-grid-item" style="--icon-bg:var(--nb-icon-objects-bg); --icon-color:var(--nb-icon-objects-color)">
        <ObjectPicker onSubmit={onObjectPicked} {labelProps} {zplImageReady} />
      </div>

      <button class="nb-grid-btn" onclick={openPreview}>
        <div class="nb-grid-icon" style="background:var(--nb-icon-preview-bg); color:var(--nb-icon-preview-color)"><MdIcon icon="visibility" /></div>
      </button>

      <button class="nb-grid-btn" onclick={openPreviewAndPrint} disabled={$connectionState !== "connected"}>
        <div class="nb-grid-icon" style="background:var(--nb-icon-print-bg); color:var(--nb-icon-print-color)"><MdIcon icon="print" /></div>
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
            Clear
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
    box-shadow: var(--nb-shadow);
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
    box-shadow: var(--nb-shadow);
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
    box-shadow: var(--nb-shadow);
    width: 100%;
  }

  .nb-grid-btn {
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    padding: 0;
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
    align-items: stretch;
    justify-content: stretch;
    padding: 0;
    border-radius: 8px;
    border: 1px solid var(--nb-border);
    background: var(--icon-bg, var(--nb-surface));
    transition: all 0.15s ease;
    position: relative;
  }

  .nb-grid-item:hover,
  .nb-grid-item:has(.dropdown.show) {
    border-color: var(--nb-primary);
    background: var(--nb-primary-light);
  }

  /* Make dropdown container fill entire grid cell */
  .nb-grid-item :global(.dropdown) {
    display: flex;
    width: 100%;
    height: 100%;
  }

  /* Make trigger button fill entire dropdown and be transparent */
  .nb-grid-item :global(.dropdown > .btn),
  .nb-grid-item :global(> .btn) {
    min-height: 44px;
    min-width: 44px;
    width: 100% !important;
    height: 100% !important;
    flex: 1 !important;
    padding: 4px !important;
    margin: 0 !important;
    border-radius: 7px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border: none !important;
    font-size: 18px;
    background: transparent !important;
    color: var(--icon-color, var(--nb-text-secondary)) !important;
    box-shadow: none !important;
    cursor: pointer;
  }

  .nb-grid-icon {
    width: 100%;
    height: 100%;
    min-height: 30px;
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

  /* Style all Bootstrap buttons inside the toolbar to be visible */
  .nb-toolbar-controls :global(.btn) {
    background: var(--nb-surface-alt) !important;
    color: var(--nb-text-secondary) !important;
    border: 1px solid var(--nb-border) !important;
  }

  .nb-toolbar-controls :global(.btn:hover) {
    background: var(--nb-surface-raised) !important;
    color: var(--nb-text) !important;
    border-color: var(--nb-primary) !important;
  }

  .nb-toolbar-controls :global(.btn.btn-secondary),
  .nb-toolbar-controls :global(.btn-check:checked + .btn) {
    background: var(--nb-primary-light) !important;
    color: var(--nb-primary) !important;
    border-color: var(--nb-primary) !important;
  }

  .nb-toolbar-controls :global(.btn.btn-primary) {
    background: linear-gradient(135deg, var(--nb-primary) 0%, var(--nb-primary-dark) 100%) !important;
    color: #fff !important;
    border: none !important;
  }

  /* Keep nb-tool-btn styles (delete, clone) as they are */
  .nb-toolbar-controls :global(.nb-tool-btn) {
    background: var(--nb-surface) !important;
    border: 1px solid var(--nb-border) !important;
  }

  .nb-toolbar-controls :global(.nb-tool-btn.danger) {
    color: var(--nb-accent) !important;
    border-color: rgba(244,63,94,0.2) !important;
  }
</style>
