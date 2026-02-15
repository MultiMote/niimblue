<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { derived } from "svelte/store";
  import Modal from "bootstrap/js/dist/modal";
  import { appConfig, connectionState, printerClient, printerMeta, refreshRfidInfo } from "$/stores";
  import { copyImageData, threshold, atkinson, invert, bayer } from "$/utils/post_process";
  import {
    type EncodedImage,
    ImageEncoder,
    LabelType,
    printTaskNames,
    type PrintProgressEvent,
    type PrintTaskName,
    AbstractPrintTask,
    Utils,
  } from "@mmote/niimbluelib";
  import type { LabelProps, PostProcessType, FabricJson, PreviewProps, PreviewPropsOffset } from "$/types";
  import ParamLockButton from "$/components/basic/ParamLockButton.svelte";
  import { tr, type TranslationKey } from "$/utils/i18n";
  import { canvasPreprocess } from "$/utils/canvas_preprocess";
  import { type DSVRowArray, csvParse } from "d3-dsv";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { Toasts } from "$/utils/toasts";
  import { CustomCanvas } from "$/fabric-object/custom_canvas";
  import { FileUtils } from "$/utils/file_utils";

  interface Props {
    onClosed: () => void;
    labelProps: LabelProps;
    canvasCallback: () => FabricJson;
    printNow?: boolean;
    csvData: string;
    csvEnabled: boolean;
  }

  let { onClosed, labelProps, canvasCallback, printNow = false, csvData, csvEnabled }: Props = $props();

  let modalElement: HTMLElement;
  let previewCanvas: HTMLCanvasElement;
  let printState = $state<"idle" | "sending" | "printing">("idle");
  let modal: Modal;
  let printProgress = $state<number>(0); // todo: more progress data
  let density = $state<number>($printerMeta?.densityDefault ?? 3);
  let speed = $state<0 | 1>(1);
  let quantity = $state<number>(1);
  let postProcessType = $state<PostProcessType>();
  let postProcessInvert = $state<boolean>(false);
  let thresholdValue = $state<number>(140);
  let originalImage: ImageData;
  let previewContext: CanvasRenderingContext2D;
  let printTaskName = $state<PrintTaskName>("B1");
  let labelType = $state<LabelType>(LabelType.WithGaps);
  // eslint-disable-next-line no-undef
  let statusTimer: NodeJS.Timeout | undefined = undefined;
  let error = $state<string>("");
  let detectedPrintTaskName: PrintTaskName | undefined = $printerClient?.getPrintTaskType();
  let csvParsed: DSVRowArray<string>;
  let page = $state<number>(0);
  let pagesTotal = $state<number>(1);
  let offset = $state<PreviewPropsOffset>({ x: 0, y: 0, offsetType: "inner" });
  let offsetWarning = $state<string>("");
  let currentPrintTask: AbstractPrintTask | undefined;

  let savedProps = $state<PreviewProps>({});

  const disconnected = derived(connectionState, ($connectionState) => $connectionState !== "connected");

  const labelTypeTranslationKey = (labelType: string): TranslationKey =>
    `preview.label_type.${labelType}` as TranslationKey;

  const endPrint = async () => {
    clearInterval(statusTimer);

    if (!$disconnected && printState !== "idle") {
      if (currentPrintTask !== undefined) {
        await currentPrintTask.printEnd();
      } else {
        console.warn("Print task undefined, falling back to PrintEnd command");
        await $printerClient.abstraction.printEnd();
      }

      refreshRfidInfo();

      $printerClient.startHeartbeat();
    }

    printState = "idle";
    printProgress = 0;
  };

  const onPrintOnSystemPrinter = async () => {
    const sources: string[] = [];

    for (let curPage = 0; curPage < pagesTotal; curPage++) {
      page = curPage;
      await generatePreviewData(page);
      sources.push(previewCanvas.toDataURL("image/png"));
    }

    FileUtils.printImageUrls(sources);
  };

  const onPrint = async () => {
    printState = "sending";
    error = "";

    // do it in a stupid way (multi-page print not finished yet)
    for (let curPage = 0; curPage < pagesTotal; curPage++) {
      $printerClient.stopHeartbeat();

      currentPrintTask = $printerClient.abstraction.newPrintTask(printTaskName, {
        totalPages: quantity,
        density,
        speed,
        labelType,
        statusPollIntervalMs: 100,
        statusTimeoutMs: 8_000,
      });

      page = curPage;
      console.log("Printing page", page);

      await generatePreviewData(page);

      try {
        const encoded: EncodedImage = ImageEncoder.encodeCanvas(previewCanvas, labelProps.printDirection);
        await currentPrintTask.printInit();
        await currentPrintTask.printPage(encoded, quantity);
      } catch (e) {
        error = `${e}`;
        console.error(e);
        return;
      }

      printState = "printing";

      const listener = (e: PrintProgressEvent) => {
        printProgress = Math.floor((e.page / quantity) * ((e.pagePrintProgress + e.pageFeedProgress) / 2));
      };

      $printerClient.on("printprogress", listener);

      try {
        await currentPrintTask.waitForFinished();
      } catch (e) {
        error = `${e}`;
        console.error(e);
      }

      $printerClient.off("printprogress", listener);

      await endPrint();

      if ($appConfig.pageDelay !== undefined && $appConfig.pageDelay > 0 && pagesTotal > 1 && curPage < pagesTotal - 1) {
        await Utils.sleep($appConfig.pageDelay);
      }
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
    } else if (postProcessType === "bayer") {
      iData = bayer(iData, thresholdValue);
    }

    if (postProcessInvert) {
      iData = invert(iData);
    }

    offsetWarning = "";

    if (offset.offsetType === "inner") {
      previewCanvas.width = originalImage.width;
      previewCanvas.height = originalImage.height;
      previewContext.fillStyle = "white";
      previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      previewContext.putImageData(iData, offset.x, offset.y);
    } else {
      previewCanvas.width = originalImage.width + Math.abs(offset.x);
      previewCanvas.height = originalImage.height + Math.abs(offset.y);
      previewContext.fillStyle = "white";
      previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      previewContext.putImageData(iData, Math.max(offset.x, 0), Math.max(offset.y, 0));
    }

    if ($printerMeta !== undefined) {
      const headSize = labelProps.printDirection == "left" ? previewCanvas.height : previewCanvas.width;
      if (headSize > $printerMeta.printheadPixels) {
        offsetWarning += $tr("params.label.warning.width") + " ";
        offsetWarning += `(${headSize} > ${$printerMeta.printheadPixels})`;
        offsetWarning += "\n";
      }
    }
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
      savedProps[keyObj] = value;
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
      if (saved.postProcess !== undefined) postProcessType = saved.postProcess;
      if (saved.postProcessInvert !== undefined) postProcessInvert = saved.postProcessInvert;
      if (saved.threshold !== undefined) thresholdValue = saved.threshold;
      if (saved.quantity !== undefined) quantity = saved.quantity;
      if (saved.density !== undefined) density = saved.density;
      if (saved.speed !== undefined) speed = saved.speed;
      if (saved.labelType !== undefined) labelType = saved.labelType;
      if (saved.printTaskName !== undefined) printTaskName = saved.printTaskName;
      if (saved.offset !== undefined) offset = saved.offset;
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
    const fabricTempCanvas = new CustomCanvas(undefined, {
      width: labelProps.size.width,
      height: labelProps.size.height,
    });

    fabricTempCanvas.setCustomBackground(false);
    fabricTempCanvas.setHighlightMirror(false);

    fabricTempCanvas.setLabelProps(labelProps);

    await fabricTempCanvas.loadFromJSON(canvasCallback());

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

    await fabricTempCanvas.createMirroredObjects();

    fabricTempCanvas.requestRenderAll();

    const preRenderedCanvas = fabricTempCanvas.toCanvasElement();
    const ctx = preRenderedCanvas.getContext("2d")!;
    previewCanvas.width = preRenderedCanvas.width;
    previewCanvas.height = preRenderedCanvas.height;
    previewContext = previewCanvas.getContext("2d")!;
    originalImage = ctx.getImageData(0, 0, preRenderedCanvas.width, preRenderedCanvas.height);

    updatePreview();

    fabricTempCanvas.dispose();
  };

  onMount(async () => {
    if (csvEnabled) {
      const parseResult = csvParse(csvData);
      const spread: DSVRowArray<string> = Object.assign([], { columns: parseResult.columns });

      for(const row of parseResult) {
        let times = 1;
        if ("$times" in row && row["$times"] !== "") {
          try {
            times = parseInt(row["$times"]);
          } catch (e) {
            console.warn("$times parse error", e);
          }
        }

        if (times < 0 ) {
          times = 0;
        }

        for (let i = 0; i < times; i++) {
          spread.push(row);
        }
      }

      csvParsed = spread;
      pagesTotal = csvParsed.length;
    }

    modal = new Modal(modalElement);
    modal.show();
    modalElement.addEventListener("hidden.bs.modal", async () => {
      endPrint();
      onClosed();
    });

    if (detectedPrintTaskName !== undefined) {
      console.log(`Detected print task version: ${detectedPrintTaskName}`);
      printTaskName = detectedPrintTaskName;
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
        <button aria-label="Dismiss" type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body text-center">
        <div class="d-flex justify-content-center">
          {#if pagesTotal > 1}
            <button disabled={printState !== "idle"} class="btn w-100 fs-1" onclick={pageDown}>
              <MdIcon icon="chevron_left" />
            </button>
          {/if}

          <canvas class="print-start-{labelProps.printDirection}" bind:this={previewCanvas}></canvas>

          {#if pagesTotal > 1}
            <button disabled={printState !== "idle"} class="btn w-100 fs-1" onclick={pageUp}>
              <MdIcon icon="chevron_right" />
            </button>
          {/if}
        </div>
        {#if pagesTotal > 1}<div>Page {page + 1} / {pagesTotal}</div>{/if}

        {#if printState === "sending"}
          <div>Sending...</div>
        {/if}
        {#if printState === "printing"}
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
            onchange={() => updateSavedProp("postProcess", postProcessType, true)}>
            <option value="threshold">{$tr("preview.postprocess.threshold")}</option>
            <option value="dither">{$tr("preview.postprocess.atkinson")}</option>
            <option value="bayer">{$tr("preview.postprocess.bayer")}</option>
          </select>

          <ParamLockButton
            propName="postProcess"
            value={postProcessType}
            savedValue={savedProps.postProcess}
            onClick={toggleSavedProp} />

          <button
            class="btn btn-sm {postProcessInvert ? 'btn-secondary' : 'btn-outline-secondary'}"
            onclick={() => {
              postProcessInvert = !postProcessInvert;
              updatePreview();
            }}>
            <MdIcon icon="invert_colors" />
          </button>
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
            onchange={() => updateSavedProp("threshold", thresholdValue, true)} />
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
            onchange={() => updateSavedProp("quantity", quantity)} />
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
            onchange={() => updateSavedProp("density", density)} />
          <ParamLockButton
            propName="density"
            value={density}
            savedValue={savedProps.density}
            onClick={toggleSavedProp} />
        </div>

        {#if printTaskName === "D110M_V4"}
          <div class="input-group flex-nowrap input-group-sm">
            <span class="input-group-text">{$tr("preview.speed")}</span>
            <select
              class="form-select"
              bind:value={speed}
              onchange={() => updateSavedProp("speed", speed, true)}>
              <option value={0}>{$tr("preview.speed.0")}</option>
              <option value={1}>{$tr("preview.speed.1")}</option>
            </select>

            <ParamLockButton
              propName="speed"
              value={speed}
              savedValue={savedProps.speed}
              onClick={toggleSavedProp} />
          </div>
        {/if}

        <div class="input-group input-group-sm">
          <span class="input-group-text">{$tr("preview.label_type")}</span>
          <select class="form-select" bind:value={labelType} onchange={() => updateSavedProp("labelType", labelType)}>
            {#each Object.values(LabelType) as lt (lt)}
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
          <span class="input-group-text">{$tr("preview.print_task")}</span>
          <select
            class="form-select"
            bind:value={printTaskName}
            onchange={() => updateSavedProp("printTaskName", printTaskName)}>
            {#each printTaskNames as name (name)}
              <option value={name}>
                {#if detectedPrintTaskName === name}✔{/if}
                {name}
              </option>
            {/each}
          </select>

          <ParamLockButton
            propName="printTaskName"
            value={printTaskName}
            savedValue={savedProps.printTaskName}
            onClick={toggleSavedProp} />
        </div>

        <div class="input-group input-group-sm">
          <span class="input-group-text">{$tr("preview.offset")}</span>
          {#if offsetWarning}
            <span class="input-group-text text-warning" title={offsetWarning}><MdIcon icon="warning" /></span>
          {/if}
          <span class="input-group-text"><MdIcon icon="unfold_more" class="r-90" /></span>
          <input
            class="form-control"
            type="number"
            bind:value={offset.x}
            onchange={() => updateSavedProp("offset", offset, true)} />
          <span class="input-group-text"><MdIcon icon="unfold_more" /></span>
          <input
            class="form-control"
            type="number"
            bind:value={offset.y}
            onchange={() => updateSavedProp("offset", offset, true)} />
          <select
            class="form-select"
            bind:value={offset.offsetType}
            onchange={() => updateSavedProp("offset", offset, true)}>
            <option value="inner">{$tr("preview.offset.inner")}</option>
            <option value="outer">{$tr("preview.offset.outer")}</option>
          </select>

          <ParamLockButton propName="offset" value={offset} savedValue={savedProps.offset} onClick={toggleSavedProp} />
        </div>

        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{$tr("preview.close")}</button>

        {#if printState !== "idle"}
          <button type="button" class="btn btn-primary" disabled={$disconnected} onclick={endPrint}>
            {$tr("preview.print.cancel")}
          </button>
        {/if}

        <button
          type="button"
          class="btn btn-secondary"
          title={$tr("preview.print.system")}
          onclick={onPrintOnSystemPrinter}>
          <MdIcon icon="print" />
        </button>

        <button
          type="button"
          class="btn btn-primary"
          disabled={$disconnected || printState !== "idle"}
          onclick={onPrint}>
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
    image-rendering: pixelated;
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
