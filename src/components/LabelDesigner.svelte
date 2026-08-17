<script lang="ts">
  import Dropdown from "bootstrap/js/dist/dropdown";
  import * as fabric from "fabric";
  import { onDestroy, onMount, tick } from "svelte";
  import { ArUcoMarker } from "$/fabric-object/aruco";
  import { Barcode } from "$/fabric-object/barcode";
  import { QRCode } from "$/fabric-object/qrcode";
  import { iconCodepoints, type MaterialIcon } from "$/styles/mdi_icons";
  import { appConfig, automation, connectionState, csvData, loadedFonts } from "$/stores";
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
  import ArUcoParamsPanel from "$/components/designer-controls/ArUcoParamsControls.svelte";
  import QrCodeParamsPanel from "$/components/designer-controls/QRCodeParamsControls.svelte";
  import TextParamsControls from "$/components/designer-controls/TextParamsControls.svelte";
  import VariableInsertControl from "$/components/designer-controls/VariableInsertControl.svelte";
  import { DEFAULT_LABEL_PROPS, GRID_SIZE, OBJECT_DEFAULTS } from "$/defaults";
  import { LabelDesignerUtils } from "$/utils/label_designer_utils";
  import SavedLabelsMenu from "$/components/designer-controls/SavedLabelsMenu.svelte";
  import { CustomCanvas } from "$/fabric-object/custom_canvas";
  import VectorParamsControls from "$/components/designer-controls/VectorParamsControls.svelte";
  import { CanvasUtils } from "$/utils/canvas_utils";
  import ObjectPanel from "$/components/designer-controls/ObjectPanel.svelte";
  import ShortcutsHelp from "$/components/ShortcutsHelp.svelte";

  let htmlCanvas: HTMLCanvasElement;

  let fabricCanvas = $state<CustomCanvas>();
  let labelProps = $state<LabelProps>(DEFAULT_LABEL_PROPS);
  let previewOpened = $state<boolean>(false);
  let selectedObject = $state<fabric.FabricObject | undefined>(undefined);
  let selectedCount = $state<number>(0);
  let editRevision = $state<number>(0);
  let printNow = $state<boolean>(false);
  let csvEnabled = $state<boolean>(false);
  let windowWidth = $state<number>(0);
  let undoState = $state<UndoState>({ undoDisabled: false, redoDisabled: false });
  let zoomText = $state<string>("100%");
  let shortcutsShow = $state<boolean>(false);
  let dirty = $state<boolean>(false);
  let designerReady = false;
  let mobilePropertyPanelOpen = $state(false);
  let mobilePropertyPanelTab = $state<"properties" | "objects">("properties");
  let designerEl = $state<HTMLDivElement | undefined>(undefined);
  let propertyPanelEl = $state<HTMLElement | undefined>(undefined);

  const MOBILE_BREAK = 960;

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
    if (designerReady) dirty = true;
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

  let keyboardPasteAt = 0;

  const onKeyDown = (e: KeyboardEvent) => {
    const key: string = e.key.toLowerCase();
    // windows and linux users are used to ctrl, mac users use cmd
    const cmdOrCtrl = e.metaKey || e.ctrlKey;

    if (cmdOrCtrl && !e.altKey && key === "v") {
      keyboardPasteAt = performance.now();
    }

    // Esc
    if (key === "escape") {
      discardSelection();
      return;
    }

    if (key === "?" || (e.shiftKey && key === "/")) {
      if (!LabelDesignerUtils.isAnyInputFocused(fabricCanvas!)) {
        e.preventDefault();
        shortcutsShow = true;
      }
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
    fabricCanvas!.virtualZoom(fabricCanvas!.getVirtualZoom());
    try {
      LocalStoragePersistence.saveLastLabelProps(labelProps);
      undo.push(fabricCanvas!, labelProps);
    } catch (e) {
      Toasts.zodErrors(e, "Label parameters save error:");
    }
  };

  const applyZplLabelSize = (size: { width: number; height: number }) => {
    if (!fabricCanvas) return;
    if (size.width === labelProps.size.width && size.height === labelProps.size.height) return;
    labelProps = { ...labelProps, size };
    fabricCanvas.setDimensions(labelProps.size);
    fabricCanvas.setLabelProps(labelProps);
    fabricCanvas.virtualZoom(fabricCanvas.getVirtualZoom());
    try {
      LocalStoragePersistence.saveLastLabelProps(labelProps);
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

  const pdfImageReady = async (el: HTMLCanvasElement) => {
    const img = new fabric.FabricImage(el, {
      ...OBJECT_DEFAULTS,
      left: 0,
      top: 0,
    });

    fabricCanvas!.add(img);
    fabricCanvas!.setActiveObject(img);
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
      undo.push(fabricCanvas!, labelProps);
    }
    fabricCanvas!.requestRenderAll();

    // trigger reactivity for controls
    editRevision++;
  };

  const onObjectVisibilityChange = () => {
    undo.push(fabricCanvas!, labelProps);
    fabricCanvas!.requestRenderAll();
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
    // Ignore Linux/X11 middle-click PRIMARY paste; canvas paste is Ctrl/⌘+V only.
    const fromShortcut = performance.now() - keyboardPasteAt < 1000;
    if (!fromShortcut) {
      if (!LabelDesignerUtils.isAnyInputFocused(fabricCanvas!)) {
        event.preventDefault();
      }
      return;
    }

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
    if (!confirm($tr("editor.clear.confirm"))) {
      return;
    }
    undo.push(fabricCanvas!, labelProps);
    fabricCanvas!.clear();
  };

  const toggleGrid = () => {
    const newVal = !$appConfig.gridEnabled;
    appConfig.update((cfg) => ({ ...cfg, gridEnabled: newVal }));
    fabricCanvas?.setGridEnabled(newVal);
  };

  const loadLabelFromUrl = async () => {
    try {
      const urlTemplate = await FileUtils.readLabelFromUrl();

      if (urlTemplate !== null && confirm($tr("params.saved_labels.load.url.warn"))) {
        onLoadRequested(urlTemplate);
        Toasts.message($tr("params.saved_labels.load.url.loaded"));
        return true;
      }
    } catch (e) {
      Toasts.error(e);
    }
    return false;
  }

  const loadDefaultLabel = async () => {
    const urlLoaded = await loadLabelFromUrl();

    if (urlLoaded) {
      return;
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

  const renderOnFontsChanged = () => {
    fabricCanvas?.forEachObject((o) => {
      if (o instanceof fabric.Textbox) {
        o.dirty = true;
      }
    });
    fabricCanvas?.requestRenderAll();
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
    fabricCanvas.setLabelProps(labelProps);
    fabricCanvas.onZoomChange = (z) => {
      zoomText = Math.round(z * 100) + "%";
    };
    fabricCanvas.setGridEnabled(!!$appConfig.gridEnabled);

    await loadDefaultLabel();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (window.innerWidth <= 960) {
          fabricCanvas?.fitToViewport();
        } else {
          fabricCanvas?.centerInViewport();
        }
      });
    });

    window.addEventListener("hashchange", loadLabelFromUrl);

    undo.push(fabricCanvas, labelProps);
    designerReady = true;
    editRevision++;

    window.addEventListener("beforeunload", onBeforeUnload);

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
      undo.push(fabricCanvas!, labelProps);
    });

    fabricCanvas.on("text:changed", () => {
      editRevision++;
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

      CanvasUtils.fixFabricObjectScale(e.target);
    });

    // userFonts.subscribe((e) => {console.log(e); renderOnFontsChanged();});

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

  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = "";
  };

  const onStageClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      discardSelection();
    }
  };

  onDestroy(() => {
    fabricCanvas!.dispose();
    window.removeEventListener("hashchange", loadLabelFromUrl);
    window.removeEventListener("beforeunload", onBeforeUnload);
  });

  $effect(() => {
    fabricCanvas?.setLabelProps(labelProps);
  });

  $effect(() => {
    if (!previewOpened) {
      printNow = false;
    }
  });

  $effect(() => {
    if ($loadedFonts) {
      renderOnFontsChanged();
    }
  });

  $effect(() => {
    if (windowWidth === 0 || windowWidth > MOBILE_BREAK) return;
    if (selectedCount > 0) {
      mobilePropertyPanelTab = "properties";
    } else {
      mobilePropertyPanelOpen = false;
    }
  });

  /** Update canvas bottom inset for the mobile sheet without changing zoom. */
  const syncMobilePanelInset = () => {
    if (!designerEl || !propertyPanelEl) return;
    if (windowWidth === 0 || windowWidth > MOBILE_BREAK) return;

    const panelH = propertyPanelEl.getBoundingClientRect().height;
    designerEl.style.setProperty("--nb-mobile-panel-h", `${panelH}px`);
  };

  $effect(() => {
    if (windowWidth === 0 || windowWidth > MOBILE_BREAK) return;
    if (!designerEl || !propertyPanelEl) return;
    mobilePropertyPanelOpen;
    mobilePropertyPanelTab;
    syncMobilePanelInset();
  });

  $effect(() => {
    if (!propertyPanelEl) return;
    const observer = new ResizeObserver(() => syncMobilePanelInset());
    observer.observe(propertyPanelEl);
    return () => observer.disconnect();
  });

  const openMobilePropertyPanel = (tab: "properties" | "objects") => {
    if (mobilePropertyPanelOpen && mobilePropertyPanelTab === tab) {
      mobilePropertyPanelOpen = false;
      return;
    }
    mobilePropertyPanelTab = tab;
    mobilePropertyPanelOpen = true;
  };
</script>

<svelte:window bind:innerWidth={windowWidth} onkeydown={onKeyDown} onpaste={onPaste} />

<div
  bind:this={designerEl}
  class="designer"
  class:mobile-property-panel-open={mobilePropertyPanelOpen}
  class:mobile-has-selection={selectedCount > 0}
  class:mobile-tab-properties={mobilePropertyPanelTab === "properties"}
  class:mobile-tab-objects={mobilePropertyPanelTab === "objects"}>
  <div class="designer-topbar">
    <div class="toolbar-cluster">
      <LabelPropsEditor {labelProps} onChange={onUpdateLabelProps} />

      <SavedLabelsMenu
        canvas={fabricCanvas!}
        onRequestLabelTemplate={exportCurrentLabel}
        {onLoadRequested}
        {csvEnabled} />

      <button class="btn btn-sm btn-secondary icon-btn" onclick={clearCanvas} title={$tr("editor.clear")}>
        <MdIcon icon="cancel_presentation" />
      </button>
    </div>

    <div class="toolbar-divider d-none d-md-block"></div>

    <div class="toolbar-cluster">
      <button
        class="btn btn-sm btn-secondary icon-btn"
        disabled={undoState.undoDisabled}
        onclick={() => undo.undo()}
        title={$tr("editor.undo")}>
        <MdIcon icon="undo" />
      </button>

      <button
        class="btn btn-sm btn-secondary icon-btn"
        disabled={undoState.redoDisabled}
        onclick={() => undo.redo()}
        title={$tr("editor.redo")}>
        <MdIcon icon="redo" />
      </button>

      <button
        class="btn btn-sm icon-btn {$appConfig.gridEnabled ? 'btn-primary' : 'btn-secondary'}"
        onclick={toggleGrid}
        title={$tr("editor.grid")}>
        <MdIcon icon="grid_on" />
      </button>

      <button
        class="btn btn-sm btn-secondary"
        onclick={() => fabricCanvas?.resetVirtualZoom()}
        title={$tr("editor.zoom.reset")}>
        {zoomText}
      </button>
    </div>

    <div class="header-spacer"></div>

    <div class="toolbar-cluster">
      <button class="btn btn-sm btn-primary icon-btn" onclick={openPreview} title={$tr("editor.preview")}>
        <MdIcon icon="visibility" />
        <span class="btn-label">{$tr("editor.preview")}</span>
      </button>
      <button
        title="Print with default or saved parameters"
        class="btn btn-sm btn-primary icon-btn"
        onclick={openPreviewAndPrint}
        disabled={$connectionState !== "connected"}>
        <MdIcon icon="print" />
        <span class="btn-label">{$tr("editor.print")}</span>
      </button>
    </div>
  </div>

  <aside class="tools-rail">
    <div class="tools-group-label">{$tr("ui.tools")}</div>
    <ObjectPicker
      variant="rail"
      onSubmit={onObjectPicked}
      {labelProps}
      {zplImageReady}
      {pdfImageReady}
      canvas={fabricCanvas}
      onZplLabelSize={applyZplLabelSize}
      onZplObjectsImported={() => {
        undo.push(fabricCanvas!, labelProps);
        editRevision++;
      }} />
    <IconPicker labeled onSubmit={onIconPicked} onSubmitSvg={onSvgIconPicked} />
    <CsvControl labeled bind:enabled={csvEnabled} onPlaceholderPicked={onCsvPlaceholderPicked} />
  </aside>

  <div class="canvas-stage" role="presentation" onclick={onStageClick}>
    <div class="canvas-wrapper print-start-{labelProps.printDirection}">
      <canvas bind:this={htmlCanvas}></canvas>
    </div>
  </div>

  <aside class="property-panel" bind:this={propertyPanelEl}>
    <div class="property-panel-handle">
      <button
        type="button"
        class="property-panel-tab"
        class:active={mobilePropertyPanelOpen && mobilePropertyPanelTab === "properties"}
        onclick={() => openMobilePropertyPanel("properties")}>
        <MdIcon icon="tune" />
        {$tr("ui.properties")}
        {#if selectedCount > 0}
          <span class="property-panel-count">{selectedCount}</span>
        {/if}
      </button>
      <button
        type="button"
        class="property-panel-tab"
        class:active={mobilePropertyPanelOpen && mobilePropertyPanelTab === "objects"}
        onclick={() => openMobilePropertyPanel("objects")}>
        <MdIcon icon="layers" />
        {$tr("ui.objects")}
      </button>
      <div class="property-panel-quick-actions">
        {#if selectedCount > 0}
          <button type="button" class="property-panel-quick" onclick={deleteSelected} title={$tr("editor.delete")}>
            <MdIcon icon="delete" />
          </button>
          <button type="button" class="property-panel-quick" onclick={cloneSelected} title={$tr("editor.clone")}>
            <MdIcon icon="content_copy" />
          </button>
        {/if}
        <button
          type="button"
          class="property-panel-toggle"
          onclick={() => (mobilePropertyPanelOpen = !mobilePropertyPanelOpen)}
          aria-expanded={mobilePropertyPanelOpen}>
          <MdIcon icon={mobilePropertyPanelOpen ? "expand_more" : "expand_less"} />
        </button>
      </div>
    </div>

    <div class="property-panel-body">
    <div class="property-panel-section property-panel-properties">
      <h3>{$tr("ui.properties")}</h3>
      {#if selectedCount > 0}
        <div class="property-panel-controls">
          <button class="btn btn-sm btn-danger" onclick={deleteSelected} title={$tr("editor.delete")}>
            <MdIcon icon="delete" />
            {$tr("editor.delete")}
          </button>
          <button class="btn btn-sm btn-secondary" onclick={cloneSelected} title={$tr("editor.clone")}>
            <MdIcon icon="content_copy" />
            {$tr("editor.clone")}
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

          {#if selectedObject instanceof ArUcoMarker}
            <ArUcoParamsPanel selectedArUco={selectedObject} {editRevision} valueUpdated={controlValueUpdated} />
          {/if}

          {#if selectedObject instanceof Barcode}
            <BarcodeParamsPanel selectedBarcode={selectedObject} {editRevision} valueUpdated={controlValueUpdated} />
          {/if}

          {#if selectedObject instanceof fabric.IText || selectedObject instanceof QRCode || (selectedObject instanceof Barcode && selectedObject.encoding === "CODE128B")}
            <VariableInsertControl {selectedObject} valueUpdated={controlValueUpdated} />
          {/if}
        </div>
      {:else}
        <div class="property-panel-empty">
          <MdIcon icon="touch_app" />
          <div>{$tr("ui.properties.empty")}</div>
        </div>
      {/if}
    </div>

    <div class="property-panel-section property-panel-objects">
      <h3>{$tr("ui.objects")}</h3>
      <ObjectPanel canvas={fabricCanvas} {selectedObject} {editRevision} onVisibilityChange={onObjectVisibilityChange} />
    </div>
    </div>
  </aside>

  {#if previewOpened}
    <PrintPreview
      bind:show={previewOpened}
      canvasCallback={getCanvasForPreview}
      {labelProps}
      {printNow}
      {csvEnabled}
      csvData={$csvData.data} />
  {/if}

  {#if shortcutsShow}
    <ShortcutsHelp bind:show={shortcutsShow} />
  {/if}
</div>
