<script lang="ts">
  import { fabric } from "fabric";
  import { onDestroy, onMount } from "svelte";
  import { derived } from "svelte/store";
  import Modal from "bootstrap/js/dist/modal";
  import { connectionState, printerClient, printerMeta } from "../stores";
  import { copyImageData, threshold, atkinson } from "../utils/post_process";
  import {
    type EncodedImage,
    ImageEncoder,
    LabelType,
    PrintTaskVersion,
    type PrintProgressEvent,
  } from "@mmote/niimbluelib";
  import type { LabelProps, PostProcessType, FabricJson, PreviewProps } from "../types";
  import ParamLockButton from "./ParamLockButton.svelte";
  import { tr, type TranslationKey } from "../utils/i18n";
  import { canvasPreprocess } from "../utils/canvas_preprocess";
  import { type DSVRowArray, csvParse } from "d3-dsv";
  import { LocalStoragePersistence } from "../utils/persistence";
  import MdIcon from "./MdIcon.svelte";
  import { Toasts } from "../utils/toasts";

  export let onClosed: () => void;
  export let labelProps: LabelProps;
  export let canvasCallback: () => FabricJson;
  export let printNow: boolean = false;
  export let csvData: string;
  export let csvEnabled: boolean;

  let modalElement: HTMLElement;
  let previewCanvas: HTMLCanvasElement;
  let printState: "idle" | "sending" | "printing" = "idle";
  let modal: Modal;
  let printProgress: number = 0; // todo: more progress data
  let density: number = $printerMeta?.densityDefault ?? 3;
  let quantity: number = 1;
  let postProcessType: PostProcessType;
  let thresholdValue: number = 140;
  let originalImage: ImageData;
  let previewContext: CanvasRenderingContext2D;
  let printTaskVersion: PrintTaskVersion = PrintTaskVersion.V3;
  let labelType: LabelType = LabelType.WithGaps;
  let statusTimer: NodeJS.Timeout | undefined = undefined;
  let error: string = "";
  let taskVer = $printerClient?.getPrintTaskVersion();
  let csvParsed: DSVRowArray<string>;
  let page = 0;
  let pagesTotal = 1;

  let savedProps = {} as PreviewProps;

  const disconnected = derived(connectionState, ($connectionState) => $connectionState !== "connected");

  const labelTypeTranslationKey = (labelType: string): TranslationKey =>
    `preview.label_type.${labelType}` as TranslationKey;

  const endPrint = async () => {
    clearInterval(statusTimer);

    if (!$disconnected && printState !== "idle") {
      await $printerClient.abstraction.printEnd();
    }

    printState = "idle";
    printProgress = 0;
    $printerClient.startHeartbeat();
  };

  const onPrint = async () => {
    printState = "sending";
    error = "";
    $printerClient.stopHeartbeat();

    // do it in a stupid way (library not supports multi-page print yet)
    for (let curPage = 0; curPage < pagesTotal; curPage++) {
      page = curPage;
      console.log("Printing page", page);

      await generatePreviewData(page);
      const encoded: EncodedImage = ImageEncoder.encodeCanvas(previewCanvas, labelProps.printDirection);

      try {
        await $printerClient.abstraction.print(printTaskVersion, encoded, { quantity, density, labelType });
      } catch (e) {
        error = `${e}`;
        console.error(e);
        return;
      }

      printState = "printing";

      const listener = (e: PrintProgressEvent) => {
        printProgress = Math.floor((e.page / quantity) * ((e.pagePrintProgress + e.pageFeedProgress) / 2));
      };

      $printerClient.addEventListener("printprogress", listener);

      try {
        await $printerClient.abstraction.waitUntilPrintFinished(printTaskVersion, quantity, {
          pollIntervalMs: 100, timeoutMs: 8_000
        });
      } catch (e) {
        error = `${e}`;
        console.error(e);
      }

      $printerClient.removeEventListener("printprogress", listener);

      await endPrint();
    }

    printState = "idle";
    $printerClient.startHeartbeat();

    if (printNow && !error) {
      modal.hide();
    }
  };

  const updatePreview = () => {
    let iData: ImageData = copyImageData(originalImage);

    if (postProcessType === "threshold") {
      iData = threshold(iData, thresholdValue);
    } else if (postProcessType === "dither") {
      iData = atkinson(iData, thresholdValue);
    }

    previewContext.putImageData(iData, 0, 0);
  };

  const toggleSavedProp = (key: string, value: any) => {
    const keyObj = key as keyof typeof savedProps;
    savedProps[keyObj] = savedProps[keyObj] === undefined ? value : undefined;
    try {
      LocalStoragePersistence.savePreviewProps(savedProps);
    } catch (e) {
      Toasts.zodErrors(e, "Preview parameters save error:");
    }
  };

  const updateSavedProp = (key: string, value: any, refreshPreview: boolean = false) => {
    const keyObj = key as keyof typeof savedProps;

    if (savedProps[keyObj] !== undefined) {
      savedProps[keyObj] = savedProps[keyObj] = value;
      try {
        LocalStoragePersistence.savePreviewProps(savedProps);
      } catch (e) {
        Toasts.zodErrors(e, "Preview parameters save error:");
      }
    }

    if (refreshPreview) {
      updatePreview();
    }
  };

  const loadProps = () => {
    try {
      const saved = LocalStoragePersistence.loadSavedPreviewProps();
      if (saved === null) {
        return;
      }
      savedProps = saved;
      if (saved.postProcess) postProcessType = saved.postProcess;
      if (saved.threshold) thresholdValue = saved.threshold;
      if (saved.quantity) quantity = saved.quantity;
      if (saved.density) density = saved.density;
      if (saved.labelType) labelType = saved.labelType;
      if (saved.printTaskVersion) printTaskVersion = saved.printTaskVersion;
    } catch (e) {
      Toasts.zodErrors(e, "Preview parameters load error:");
    }
  };

  const pageDown = () => {
    if (!csvEnabled) {
      page = 0;
      return;
    }
    page = Math.max(0, Math.min(csvParsed.length - 1, page - 1));
    generatePreviewData(page);
  };

  const pageUp = () => {
    if (!csvEnabled) {
      page = 0;
      return;
    }
    page = Math.min(csvParsed.length - 1, page + 1);
    generatePreviewData(page);
  };

  const generatePreviewData = async (page: number): Promise<void> => {
    return new Promise((resolve) => {
      const fabricTempCanvas = new fabric.Canvas(null, { width: labelProps.size.width, height: labelProps.size.height });

      fabricTempCanvas.loadFromJSON(canvasCallback(), () => {
        let variables = {};

        if (csvEnabled) {
          if (page >= 0 && page < csvParsed.length) {
            variables = csvParsed[page];
          } else {
            console.warn(`Page ${page} is out of csv bounds (csv length is ${csvParsed.length})`);
          }
        }

        console.log("Page variables:", variables);

        canvasPreprocess(fabricTempCanvas, variables);

        fabricTempCanvas.requestRenderAll();

        const preRenderedCanvas = fabricTempCanvas.toCanvasElement();
        const ctx = preRenderedCanvas.getContext("2d")!;
        previewCanvas.width = preRenderedCanvas.width;
        previewCanvas.height = preRenderedCanvas.height;
        previewContext = previewCanvas.getContext("2d")!;
        originalImage = ctx.getImageData(0, 0, preRenderedCanvas.width, preRenderedCanvas.height);

        updatePreview();

        fabricTempCanvas.dispose();
        resolve();
      });
    });
  };

  onMount(async () => {
    if (csvEnabled) {
      csvParsed = csvParse(csvData);
      pagesTotal = csvParsed.length;
    }

    modal = new Modal(modalElement);
    modal.show();
    modalElement.addEventListener("hidden.bs.modal", async () => {
      endPrint();
      onClosed();
    });

    if (taskVer !== undefined) {
      console.log(`Detected print task version: ${PrintTaskVersion[taskVer]}`);
      printTaskVersion = taskVer;
    }

    loadProps();

    await generatePreviewData(page);

    if (printNow && !$disconnected && printState === "idle") {
      onPrint();
    }
  });

  onDestroy(() => {
    if (modal) {
      modal.hide();
      modal.dispose();
    }
  });
</script>

<div bind:this={modalElement} class="modal fade" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5">{$tr("preview.title")}</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body text-center">
        <div class="d-flex justify-content-center">
          {#if pagesTotal > 1}
            <button disabled={printState !== "idle"} class="btn w-100 fs-1" on:click={pageDown}>
              <MdIcon icon="chevron_left" />
            </button>
          {/if}

          <canvas class="print-start-{labelProps.printDirection}" bind:this={previewCanvas}></canvas>

          {#if pagesTotal > 1}
            <button disabled={printState !== "idle"} class="btn w-100 fs-1" on:click={pageUp}>
              <MdIcon icon="chevron_right" />
            </button>
          {/if}
        </div>
        {#if pagesTotal > 1}<div>Page {page + 1} / {pagesTotal}</div>{/if}

        {#if printState === "sending"}
          <div>Sending...</div>
        {/if}
        {#if printState === "printing" }
          <div>
            Printing...
            <div class="progress" role="progressbar">
              <div class="progress-bar" style="width: {printProgress}%">{printProgress}%</div>
            </div>
          </div>
        {/if}
      </div>

      {#if error}
        <div class="alert alert-danger" role="alert">{error}</div>
      {/if}

      <div class="modal-footer">
        <div class="input-group input-group-sm">
          <span class="input-group-text">{$tr("preview.postprocess")}</span>

          <select
            class="form-select"
            bind:value={postProcessType}
            on:change={() => updateSavedProp("postProcess", postProcessType, true)}>
            <option value="threshold">{$tr("preview.postprocess.threshold")}</option>
            <option value="dither">{$tr("preview.postprocess.atkinson")}</option>
          </select>

          <ParamLockButton
            propName="postProcess"
            value={postProcessType}
            savedValue={savedProps.postProcess}
            onClick={toggleSavedProp} />
        </div>

        <div class="input-group input-group-sm">
          <span class="input-group-text">{$tr("preview.threshold")}</span>

          <input
            type="range"
            id="threshold"
            class="form-range"
            min="1"
            max="255"
            bind:value={thresholdValue}
            on:change={() => updateSavedProp("threshold", thresholdValue, true)} />
          <span class="input-group-text">{thresholdValue}</span>

          <ParamLockButton
            propName="threshold"
            value={thresholdValue}
            savedValue={savedProps.threshold}
            onClick={toggleSavedProp} />
        </div>

        <div class="input-group flex-nowrap input-group-sm">
          <span class="input-group-text">{$tr("preview.copies")}</span>
          <input
            class="form-control"
            type="number"
            min="1"
            bind:value={quantity}
            on:change={() => updateSavedProp("quantity", quantity)} />
          <ParamLockButton
            propName="quantity"
            value={quantity}
            savedValue={savedProps.quantity}
            onClick={toggleSavedProp} />
        </div>

        <div class="input-group flex-nowrap input-group-sm">
          <span class="input-group-text">{$tr("preview.density")}</span>
          <input
            class="form-control"
            type="number"
            min={$printerMeta?.densityMin ?? 1}
            max={$printerMeta?.densityMax ?? 20}
            bind:value={density}
            on:change={() => updateSavedProp("density", density)} />
          <ParamLockButton propName="density" value={density} savedValue={savedProps.density} onClick={toggleSavedProp} />
        </div>

        <div class="input-group input-group-sm">
          <span class="input-group-text">{$tr("preview.label_type")}</span>
          <select class="form-select" bind:value={labelType} on:change={() => updateSavedProp("labelType", labelType)}>
            {#each Object.values(LabelType) as lt}
              {#if typeof lt !== "string"}
                <option value={lt}>
                  {#if $printerMeta?.paperTypes.includes(lt)}✔{/if}
                  {$tr(labelTypeTranslationKey(LabelType[lt]))}
                </option>
              {/if}
            {/each}
          </select>

          <ParamLockButton
            propName="labelType"
            value={labelType}
            savedValue={savedProps.labelType}
            onClick={toggleSavedProp} />
        </div>

        <div class="input-group input-group-sm">
          <span class="input-group-text">{$tr("preview.print_task_version")}</span>
          <select
            class="form-select"
            bind:value={printTaskVersion}
            on:change={() => updateSavedProp("printTaskVersion", printTaskVersion)}>
            <option value={PrintTaskVersion.V1}>
              {#if taskVer === PrintTaskVersion.V1}✔{/if} V1 - D11/B21
            </option>
            <option value={PrintTaskVersion.V2}>
              {#if taskVer === PrintTaskVersion.V2}✔{/if} V2
            </option>
            <option value={PrintTaskVersion.V3}>
              {#if taskVer === PrintTaskVersion.V3}✔{/if} V3 - D110
            </option>
            <option value={PrintTaskVersion.V4}>
              {#if taskVer === PrintTaskVersion.V4}✔{/if} V4 - B1
            </option>
            <option value={PrintTaskVersion.V5}>
              {#if taskVer === PrintTaskVersion.V5}✔{/if} V5
            </option>
          </select>

          <ParamLockButton
            propName="printTaskVersion"
            value={printTaskVersion}
            savedValue={savedProps.printTaskVersion}
            onClick={toggleSavedProp} />
        </div>

        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{$tr("preview.close")}</button>

        {#if printState !== "idle"}
          <button type="button" class="btn btn-primary" disabled={$disconnected} on:click={endPrint}>
            Cancel print
          </button>
        {/if}

        <button type="button" class="btn btn-primary" disabled={$disconnected || printState !== "idle"} on:click={onPrint}>
          {#if $disconnected}
            {$tr("preview.not_connected")}
          {:else}
            <MdIcon icon="print" /> {$tr("preview.print")}
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  canvas {
    border: 1px solid #6d6d6d;
    max-width: 100%;
  }
  canvas.print-start-left {
    border-left: 2px solid #ff4646;
  }
  canvas.print-start-top {
    border-top: 2px solid #ff4646;
  }
  .progress-bar {
    transition: none;
  }
  .input-group .form-range {
    flex-grow: 1;
    width: 1%;
    height: unset;
    padding: 0 1rem;
  }
</style>
