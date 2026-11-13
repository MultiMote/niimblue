<script lang="ts">
  import { onMount } from "svelte";
  import { derived } from "svelte/store";
  import { connectionState, printerClient, printerInfo, printerMeta, rfidInfo } from "$/stores/app";
  import * as effects from "$/utils/post_process";
  import {
    type EncodedImage,
    ImageEncoder,
    LabelType,
    printTaskNames,
    type PrintProgressEvent,
    type PrintTaskName,
    AbstractPrintTask,
    PrintOptions,
    PageColorType,
    PrintPacketProgressEvent,
    printTasksCapabilities,
    PrintTaskCapability as TaskCap,
  } from "@mmote/niimbluelib";
  import { type LabelProps, type PostProcessType, type FabricJson, type PreviewProps, previewPropsKeys } from "$/types";
  import ParamLockButton from "$/components/basic/ParamLockButton.svelte";
  import { tr, type TranslationKey } from "$/utils/i18n";
  import { canvasPreprocess } from "$/utils/canvas_preprocess";
  import { LabelPropsUtils } from "$/utils/label_props_utils";
  import { type DSVRowArray, csvParse } from "d3-dsv";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { Toasts } from "$/utils/toasts";
  import { CustomCanvas } from "$/fabric-object/custom_canvas";
  import { FileUtils } from "$/utils/file_utils";
  import AppModal from "$/components/basic/AppModal.svelte";

  interface Props {
    labelProps: LabelProps;
    canvasCallback: () => FabricJson;
    onClose?: () => void;
    printNow?: boolean;
    csvData: string;
    csvEnabled: boolean;
  }

  let { labelProps, canvasCallback, printNow = false, csvData, csvEnabled, onClose }: Props = $props();

  let previewCanvas: HTMLCanvasElement;
  let printState = $state<"idle" | "printing">("idle");
  let printProgress = $state<{ progressType: "send" | "print"; percents: number }>({
    progressType: "send",
    percents: 0,
  });
  let originalImage: ImageData;
  let previewContext: CanvasRenderingContext2D;
  // eslint-disable-next-line no-undef
  let statusTimer: NodeJS.Timeout | undefined = undefined;
  let error = $state<string>("");
  let detectedPrintTaskName: PrintTaskName | undefined = $printerClient?.getPrintTaskType();
  let csvParsed: DSVRowArray<string>;
  let currentPage = $state<number>(0);
  let pagesTotal = $state<number>(1);
  let warnings = $state<string[]>([]);
  let trimmed = $state<boolean>(false);
  let currentPrintTask: AbstractPrintTask | undefined;
  let savedProps = $state<PreviewProps>({});

  let params = $state<Required<PreviewProps>>({
    postProcess: "threshold",
    postProcessInvert: false,
    postProcessMirror: false,
    threshold: 140,
    thresholdRed: 100,
    strength: 1,
    serpentine: true,
    screentoneDotSize: 5,
    screentoneAngle: 45,
    contrast: 60,
    brightness: 128,
    quantity: 1,
    density: $printerMeta?.densityDefault ?? 3,
    speed: 1,
    labelType: LabelType.WithGaps,
    printTaskName: "B1",
    offset: { x: 0, y: 0, offsetType: "inner" },
  });

  let modalRef: AppModal;

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
        await $printerClient.protocol.printEnd();
      }

      $printerClient.startHeartbeat();
    }

    printState = "idle";
    printProgress = { progressType: "send", percents: 0 };
  };

  const onPrintOnSystemPrinter = async () => {
    const sources: string[] = [];

    for (let curPage = 0; curPage < pagesTotal; curPage++) {
      currentPage = curPage;
      await generatePreviewData(currentPage);
      sources.push(previewCanvas.toDataURL("image/png"));
    }

    FileUtils.printImageUrls(sources);
  };

  const onPrint = async () => {
    printState = "printing";
    error = "";

    $printerClient.stopHeartbeat();

    const opts: Partial<PrintOptions> = {
      totalPages: pagesTotal * params.quantity,
      density: params.density,
      speed: params.speed,
      labelType: params.labelType,
      statusPollIntervalMs: 100,
      statusTimeoutMs: 8_000,
      pageColor: PageColorType.SingleColor,
    };

    if (params.postProcess === "threshold_rb" && taskHasCap(TaskCap.SupportDoubleColor)) {
      opts.pageColor = PageColorType.DoubleColor;
    } else if (params.postProcess === "grayscale" && taskHasCap(TaskCap.SupportGrayscale)) {
      opts.pageColor = PageColorType.Grayscale;
    }

    const printListener = (e: PrintProgressEvent) => {
      const currentPageProgress = (e.pagePrintProgress + e.pageFeedProgress) / 2;
      const percents = Math.min(100, Math.floor(((e.page + currentPageProgress / 100) / opts.totalPages!) * 100));
      printProgress = { progressType: "print", percents };
    };

    const sendListener = (e: PrintPacketProgressEvent) => {
      printProgress = { progressType: "send", percents: e.progress };
    };

    $printerClient.on("printprogress", printListener);
    $printerClient.on("printpacketprogress", sendListener);

    currentPrintTask = $printerClient.protocol.newPrintTask(params.printTaskName, opts);

    try {
      await currentPrintTask.printInit();

      for (let pageIdx = 0; pageIdx < pagesTotal; pageIdx++) {
        currentPage = pageIdx;
        console.log("Printing page", currentPage);
        await generatePreviewData(currentPage);
        const encoded: EncodedImage = ImageEncoder.encodeCanvas(
          previewCanvas,
          opts.pageColor!,
          labelProps.printDirection,
        );

        await currentPrintTask.printPage(encoded, params.quantity);
        await currentPrintTask.waitForPageFinished();
      }
      await currentPrintTask.waitForFinished();
    } catch (e) {
      error = `${e}`;
      console.error(e);
    }

    try {
      await endPrint();
    } catch (e) {
      error = `${e}`;
      console.error(e);
    }

    printState = "idle";
    $printerClient.off("printprogress", printListener);
    $printerClient.off("printpacketprogress", sendListener);
    $printerClient.startHeartbeat();

    if (printNow && !error) {
      modalRef.hide();
    }
  };

  const getPrintheadSize = (): number => {
    if ($printerInfo?.printheadWidth !== undefined) {
      return $printerInfo.printheadWidth;
    }
    return $printerMeta?.printheadPixels ?? -1;
  };

  const updatePreview = () => {
    let iData: ImageData = effects.copyImageData(originalImage);

    const ditherOpts = {
      threshold: params.threshold,
      strength: params.strength,
      serpentine: params.serpentine,
    };

    const processors: Record<PostProcessType, (data: ImageData) => ImageData> = {
      threshold: (data) => effects.threshold(data, params.threshold),
      threshold_rb: (data) => effects.thresholdRedBlack(data, params.threshold, params.thresholdRed),
      dither: (data) => effects.atkinson(data, ditherOpts),
      floyd_steinberg: (data) => effects.floydSteinberg(data, ditherOpts),
      jjn: (data) => effects.jarvisJudiceNinke(data, ditherOpts),
      stucki: (data) => effects.stucki(data, ditherOpts),
      bayer2: (data) => effects.bayer(data, 2),
      bayer4: (data) => effects.bayer(data, 4),
      bayer8: (data) => effects.bayer(data, 8),
      screentone: (data) =>
        effects.screentone(data, params.threshold, params.screentoneDotSize, params.screentoneAngle, params.contrast),
      grayscale: (data) => effects.grayscale(data, params.contrast, params.brightness),
    };

    iData = processors[params.postProcess](iData);

    if (params.postProcessInvert) {
      iData = effects.invert(iData);
    }

    if (params.postProcessMirror) {
      iData = effects.mirror(iData);
    }

    warnings = [];

    if (params.offset.offsetType === "inner") {
      previewCanvas.width = originalImage.width;
      previewCanvas.height = originalImage.height;
      previewContext.fillStyle = "white";
      previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      previewContext.putImageData(iData, params.offset.x, params.offset.y);
    } else {
      previewCanvas.width = originalImage.width + Math.abs(params.offset.x);
      previewCanvas.height = originalImage.height + Math.abs(params.offset.y);
      previewContext.fillStyle = "white";
      previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      previewContext.putImageData(iData, Math.max(params.offset.x, 0), Math.max(params.offset.y, 0));
    }

    if (trimmed) {
      warnings.push($tr("preview.trimmed"));
    }
  };

  const toggleSavedProp = (key: string, value: any) => {
    const keyObj = key as keyof typeof savedProps;
    savedProps[keyObj] = savedProps[keyObj] === undefined ? $state.snapshot(value) : undefined;
    try {
      LocalStoragePersistence.savePreviewProps(savedProps);
    } catch (e) {
      Toasts.zodErrors(e, "Preview parameters save error:");
    }
  };

  /**
   * Commit a value typed into a slider's number box: revert if empty, clamp to the input's own
   * min/max and trim float noise to its step. (A native number input only clamps with its
   * spinner, not typed text.)
   */
  const commitSliderValue = (e: Event, current: number): number => {
    const el = e.currentTarget as HTMLInputElement;
    const typed = el.valueAsNumber;
    const decimals = (el.step.split(".")[1] ?? "").length;
    const next = Number.isNaN(typed)
      ? current
      : Number(Math.min(Number(el.max), Math.max(Number(el.min), typed)).toFixed(decimals));
    el.value = String(next);
    return next;
  };

  const updateSavedProp = (key: string, value: any, refreshPreview: boolean = false) => {
    const keyObj = key as keyof typeof savedProps;

    if (savedProps[keyObj] !== undefined) {
      savedProps[keyObj] = $state.snapshot(value);
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

      const buf: Record<string, unknown> = {};

      for (const key of previewPropsKeys) {
        if (saved[key] !== undefined) {
          if (typeof saved[key] === "object") {
            buf[key] = { ...saved[key] };
          } else {
            buf[key] = saved[key];
          }
        }
      }
      Object.assign(params, buf);
    } catch (e) {
      Toasts.zodErrors(e, "Preview parameters load error:");
    }
  };

  const pageDown = () => {
    if (!csvEnabled) {
      currentPage = 0;
      return;
    }
    currentPage = Math.max(0, Math.min(csvParsed.length - 1, currentPage - 1));
    generatePreviewData(currentPage);
  };

  const pageUp = () => {
    if (!csvEnabled) {
      currentPage = 0;
      return;
    }
    currentPage = Math.min(csvParsed.length - 1, currentPage + 1);
    generatePreviewData(currentPage);
  };

  const generatePreviewData = async (page: number): Promise<void> => {
    const pxSize = LabelPropsUtils.sizeToPx(labelProps);
    const fabricTempCanvas = new CustomCanvas(undefined, {
      width: pxSize.width,
      height: pxSize.height,
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
    const srcWidth = preRenderedCanvas.width;
    const srcHeight = preRenderedCanvas.height;
    let targetWidth = srcWidth;
    let targetHeight = srcHeight;
    const headSize = getPrintheadSize();

    if (labelProps.printDirection === "top") {
      targetWidth = headSize > 0 ? Math.min(srcWidth, headSize) : srcWidth;
      targetWidth -= targetWidth % 8;
    } else {
      targetHeight = headSize > 0 ? Math.min(srcHeight, headSize) : srcHeight;
      targetHeight -= targetHeight % 8;
    }

    trimmed = targetWidth !== srcWidth || targetHeight !== srcHeight;

    previewCanvas.width = targetWidth;
    previewCanvas.height = targetHeight;
    previewContext = previewCanvas.getContext("2d")!;
    previewContext.fillStyle = "white";
    previewContext.fillRect(0, 0, targetWidth, targetHeight);
    previewContext.drawImage(
      preRenderedCanvas,
      Math.floor((srcWidth - targetWidth) / 2),
      Math.floor((srcHeight - targetHeight) / 2),
      targetWidth,
      targetHeight,
      0,
      0,
      targetWidth,
      targetHeight,
    );
    originalImage = previewContext.getImageData(0, 0, targetWidth, targetHeight);

    updatePreview();

    fabricTempCanvas.dispose();
  };

  const onModalClose = () => {
    endPrint();
    onClose?.();
  };

  const taskHasCap = (cap: TaskCap) => {
    return printTasksCapabilities[params.printTaskName].includes(cap);
  };

  onMount(async () => {
    if (csvEnabled) {
      const parseResult = csvParse(csvData);
      const spread: DSVRowArray<string> = Object.assign([], { columns: parseResult.columns });

      for (let row of parseResult) {
        for (const k of Object.keys(row)) {
          row[k] = row[k].replaceAll("\\n", "\n");
        }

        let times = 1;

        if ("$times" in row && row["$times"] !== "") {
          try {
            times = parseInt(row["$times"]);
          } catch (e) {
            console.warn("$times parse error", e);
          }
        }

        if (times < 0) {
          times = 0;
        }

        for (let i = 0; i < times; i++) {
          spread.push(row);
        }
      }

      csvParsed = spread;
      pagesTotal = csvParsed.length;
    }

    if (detectedPrintTaskName !== undefined) {
      console.log(`Detected print task version: ${detectedPrintTaskName}`);
      params.printTaskName = detectedPrintTaskName;
    }

    // Base offset comes from the label (preset) or defaults to 0,0.
    // A locked (saved) preview offset is applied on top of it by loadProps().
    if (labelProps.offset !== undefined) {
      params.offset = { ...labelProps.offset };
    }

    if ($rfidInfo.labelRfidInfo?.consumablesType) {
      params.labelType = $rfidInfo.labelRfidInfo.consumablesType;
    }

    loadProps();

    await generatePreviewData(currentPage);

    if (printNow && !$disconnected && printState === "idle") {
      onPrint();
    }
  });
</script>

<AppModal title={$tr("preview.title")} onClose={onModalClose} bind:this={modalRef} size="lg">
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

  <div class="text-center">
    {#if pagesTotal > 1}<div>Page {currentPage + 1} / {pagesTotal}</div>{/if}

    {#if printState === "printing"}
      <div>
        {#if printProgress.progressType === "send"}
          <div>{$tr("preview.print.state.sending")}</div>
        {:else if printProgress.progressType === "print"}
          <div>{$tr("preview.print.state.printing")}</div>
        {/if}
        <div class="progress" role="progressbar">
          <div class="progress-bar" style="width: {printProgress.percents}%">{printProgress.percents}%</div>
        </div>
      </div>
    {/if}

    {#if error}
      <div class="alert alert-danger" role="alert">{error}</div>
    {/if}
  </div>

  {#snippet footer()}
    {#each warnings as line (line)}
        <span class="text-warning w-100">{line}</span>
    {/each}

    <div class="input-group input-group-sm">
      <span class="input-group-text">{$tr("preview.postprocess")}</span>

      <select
        class="form-select"
        bind:value={params.postProcess}
        onchange={() => updateSavedProp("postProcess", params.postProcess, true)}>
        <option value="threshold">{$tr("preview.postprocess.threshold")}</option>
        <option value="threshold_rb" disabled={!taskHasCap(TaskCap.SupportDoubleColor)}
          >{$tr("preview.postprocess.threshold.red")}</option>
        <option value="dither">{$tr("preview.postprocess.atkinson")}</option>
        <option value="bayer2">{$tr("preview.postprocess.bayer")} 2x2</option>
        <option value="bayer4">{$tr("preview.postprocess.bayer")} 4x4</option>
        <option value="bayer8">{$tr("preview.postprocess.bayer")} 8x8</option>
        <option value="floyd_steinberg">{$tr("preview.postprocess.floyd_steinberg")}</option>
        <option value="jjn">{$tr("preview.postprocess.jjn")}</option>
        <option value="stucki">{$tr("preview.postprocess.stucki")}</option>
        <option value="screentone">{$tr("preview.postprocess.screentone")}</option>
        <option value="grayscale">{$tr("preview.postprocess.grayscale")}</option>
      </select>

      <ParamLockButton
        propName="postProcess"
        value={params.postProcess}
        savedValue={savedProps.postProcess}
        onClick={toggleSavedProp} />

      <button
        class="btn btn-sm {params.postProcessInvert ? 'btn-secondary' : 'btn-outline-secondary'}"
        onclick={() => {
          params.postProcessInvert = !params.postProcessInvert;
          updatePreview();
        }}>
        <MdIcon icon="invert_colors" />
      </button>

      <button
        class="btn btn-sm {params.postProcessMirror ? 'btn-secondary' : 'btn-outline-secondary'}"
        onclick={() => {
          params.postProcessMirror = !params.postProcessMirror;
          updatePreview();
        }}>
        <MdIcon icon="flip" />
      </button>
    </div>

    {#if !(params.postProcess && ["bayer2", "bayer4", "bayer8", "grayscale"].includes(params.postProcess))}
      <div class="input-group input-group-sm">
        <span class="input-group-text">{$tr("preview.threshold")}</span>

        <input
          type="range"
          id="threshold"
          class="form-range"
          min="1"
          max="255"
          bind:value={params.threshold}
          onchange={() => updateSavedProp("threshold", params.threshold, true)} />
        <input
          type="number"
          class="form-control slider-value"
          min={1}
          max={255}
          value={params.threshold}
          onchange={(e) => {
            params.threshold = commitSliderValue(e, params.threshold);
            updateSavedProp("threshold", params.threshold, true);
          }} />

        <ParamLockButton
          propName="threshold"
          value={params.threshold}
          savedValue={savedProps.threshold}
          onClick={toggleSavedProp} />
      </div>
    {/if}

    {#if params.postProcess === "floyd_steinberg" || params.postProcess === "jjn" || params.postProcess === "stucki" || params.postProcess === "dither"}
      <div class="input-group input-group-sm">
        <span class="input-group-text">{$tr("preview.strength")}</span>

        <input
          type="range"
          id="strength"
          class="form-range"
          min="0"
          max="1.5"
          step="0.1"
          bind:value={params.strength}
          onchange={() => updateSavedProp("strength", params.strength, true)} />
        <input
          type="number"
          class="form-control slider-value"
          min={0}
          max={1.5}
          step={0.1}
          value={params.strength}
          onchange={(e) => {
            params.strength = commitSliderValue(e, params.strength);
            updateSavedProp("strength", params.strength, true);
          }} />

        <ParamLockButton
          propName="strength"
          value={params.strength}
          savedValue={savedProps.strength}
          onClick={toggleSavedProp} />

        <button
          class="btn btn-sm {params.serpentine ? 'btn-secondary' : 'btn-outline-secondary'}"
          title={$tr("preview.serpentine")}
          onclick={() => {
            params.serpentine = !params.serpentine;
            updateSavedProp("serpentine", params.serpentine, true);
          }}>
          <MdIcon icon="swap_vert" />
        </button>
      </div>
    {/if}

    {#if params.postProcess === "threshold_rb"}
      <div class="input-group input-group-sm">
        <span class="input-group-text">{$tr("preview.threshold.red")}</span>

        <input
          type="range"
          id="thresholdRed"
          class="form-range"
          min="1"
          max="255"
          bind:value={params.thresholdRed}
          onchange={() => updateSavedProp("thresholdRed", params.thresholdRed, true)} />
        <input
          type="number"
          class="form-control slider-value"
          min={1}
          max={255}
          value={params.thresholdRed}
          onchange={(e) => {
            params.thresholdRed = commitSliderValue(e, params.thresholdRed);
            updateSavedProp("thresholdRed", params.thresholdRed, true);
          }} />

        <ParamLockButton
          propName="thresholdRed"
          value={params.thresholdRed}
          savedValue={savedProps.thresholdRed}
          onClick={toggleSavedProp} />
      </div>
    {/if}

    {#if params.postProcess === "screentone"}
      <div class="input-group input-group-sm">
        <span class="input-group-text">{$tr("preview.postprocess.screentone.dot_size")}</span>

        <input
          type="range"
          id="screentoneDotSize"
          class="form-range"
          min="1"
          max="20"
          bind:value={params.screentoneDotSize}
          onchange={() => updateSavedProp("screentoneDotSize", params.screentoneDotSize, true)} />
        <input
          type="number"
          class="form-control slider-value"
          min={1}
          max={20}
          value={params.screentoneDotSize}
          onchange={(e) => {
            params.screentoneDotSize = commitSliderValue(e, params.screentoneDotSize);
            updateSavedProp("screentoneDotSize", params.screentoneDotSize, true);
          }} />

        <ParamLockButton
          propName="screentoneDotSize"
          value={params.screentoneDotSize}
          savedValue={savedProps.screentoneDotSize}
          onClick={toggleSavedProp} />
      </div>

      <div class="input-group input-group-sm">
        <span class="input-group-text">{$tr("preview.postprocess.screentone.angle")}</span>

        <input
          type="range"
          id="screentoneAngle"
          class="form-range"
          min="0"
          max="90"
          bind:value={params.screentoneAngle}
          onchange={() => updateSavedProp("screentoneAngle", params.screentoneAngle, true)} />
        <input
          type="number"
          class="form-control slider-value"
          min={0}
          max={90}
          value={params.screentoneAngle}
          onchange={(e) => {
            params.screentoneAngle = commitSliderValue(e, params.screentoneAngle);
            updateSavedProp("screentoneAngle", params.screentoneAngle, true);
          }} />

        <ParamLockButton
          propName="screentoneAngle"
          value={params.screentoneAngle}
          savedValue={savedProps.screentoneAngle}
          onClick={toggleSavedProp} />
      </div>
    {/if}

    {#if ["screentone", "grayscale"].includes(params.postProcess)}
      <div class="input-group input-group-sm">
        <span class="input-group-text">{$tr("preview.postprocess.contrast")}</span>

        <input
          type="range"
          id="contrast"
          class="form-range"
          min="0"
          max="127"
          bind:value={params.contrast}
          onchange={() => updateSavedProp("contrast", params.contrast, true)} />
        <input
          type="number"
          class="form-control slider-value"
          min={0}
          max={127}
          value={params.contrast}
          onchange={(e) => {
            params.contrast = commitSliderValue(e, params.contrast);
            updateSavedProp("contrast", params.contrast, true);
          }} />

        <ParamLockButton
          propName="contrast"
          value={params.contrast}
          savedValue={savedProps.contrast}
          onClick={toggleSavedProp} />
      </div>
    {/if}

    {#if ["grayscale"].includes(params.postProcess)}
      <div class="input-group input-group-sm">
        <span class="input-group-text">{$tr("preview.postprocess.brightness")}</span>

        <input
          type="range"
          id="brightness"
          class="form-range"
          min="0"
          max="255"
          bind:value={params.brightness}
          onchange={() => updateSavedProp("brightness", params.brightness, true)} />
        <input
          type="number"
          class="form-control slider-value"
          min={0}
          max={255}
          value={params.brightness}
          onchange={(e) => {
            params.brightness = commitSliderValue(e, params.brightness);
            updateSavedProp("brightness", params.brightness, true);
          }} />

        <ParamLockButton
          propName="brightness"
          value={params.brightness}
          savedValue={savedProps.brightness}
          onClick={toggleSavedProp} />
      </div>
    {/if}

    <div class="input-group flex-nowrap input-group-sm">
      <span class="input-group-text">{$tr("preview.copies")}</span>
      <input
        class="form-control"
        type="number"
        min="1"
        bind:value={params.quantity}
        onchange={() => updateSavedProp("quantity", params.quantity)} />
      <ParamLockButton
        propName="quantity"
        value={params.quantity}
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
        bind:value={params.density}
        onchange={() => updateSavedProp("density", params.density)} />
      <ParamLockButton
        propName="density"
        value={params.density}
        savedValue={savedProps.density}
        onClick={toggleSavedProp} />
    </div>

    {#if params.printTaskName === "D110M_V4"}
      <div class="input-group flex-nowrap input-group-sm">
        <span class="input-group-text">{$tr("preview.speed")}</span>
        <select
          class="form-select"
          bind:value={params.speed}
          onchange={() => updateSavedProp("speed", params.speed, true)}>
          <option value={0}>{$tr("preview.speed.0")}</option>
          <option value={1}>{$tr("preview.speed.1")}</option>
        </select>

        <ParamLockButton
          propName="speed"
          value={params.speed}
          savedValue={savedProps.speed}
          onClick={toggleSavedProp} />
      </div>
    {/if}

    <div class="input-group input-group-sm">
      <span class="input-group-text">{$tr("preview.label_type")}</span>
      <select
        class="form-select"
        bind:value={params.labelType}
        onchange={() => updateSavedProp("labelType", params.labelType)}>
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
        value={params.labelType}
        savedValue={savedProps.labelType}
        onClick={toggleSavedProp} />
    </div>

    <div class="input-group input-group-sm">
      <span class="input-group-text">{$tr("preview.print_task")}</span>
      <select
        class="form-select"
        bind:value={params.printTaskName}
        onchange={() => {
          updateSavedProp("printTaskName", params.printTaskName);
          if (!taskHasCap(TaskCap.SupportDoubleColor) && params.postProcess === "threshold_rb") {
            params.postProcess = "threshold";
            updatePreview();
          }
        }}>
        {#each printTaskNames as name (name)}
          <option value={name}>
            {#if detectedPrintTaskName === name}✔{/if}
            {name}
          </option>
        {/each}
      </select>

      <ParamLockButton
        propName="printTaskName"
        value={params.printTaskName}
        savedValue={savedProps.printTaskName}
        onClick={toggleSavedProp} />
    </div>

    <div class="input-group input-group-sm">
      <span class="input-group-text">{$tr("preview.offset")}</span>
      <span class="input-group-text"><MdIcon icon="unfold_more" class="r-90" /></span>
      <input
        class="form-control"
        type="number"
        bind:value={params.offset.x}
        onchange={() => updateSavedProp("offset", params.offset, true)} />
      <span class="input-group-text"><MdIcon icon="unfold_more" /></span>
      <input
        class="form-control"
        type="number"
        bind:value={params.offset.y}
        onchange={() => updateSavedProp("offset", params.offset, true)} />
      <select
        class="form-select"
        bind:value={params.offset.offsetType}
        onchange={() => updateSavedProp("offset", params.offset, true)}>
        <option value="inner">{$tr("preview.offset.inner")}</option>
        <option value="outer">{$tr("preview.offset.outer")}</option>
      </select>

      <ParamLockButton
        propName="offset"
        value={params.offset}
        savedValue={savedProps.offset}
        onClick={toggleSavedProp} />
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

    <button type="button" class="btn btn-primary" disabled={$disconnected || printState !== "idle"} onclick={onPrint}>
      {#if $disconnected}
        {$tr("preview.not_connected")}
      {:else}
        <MdIcon icon="print" /> {$tr("preview.print")}
      {/if}
    </button>
  {/snippet}
</AppModal>

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
  .input-group .slider-value {
    flex: 0 0 auto;
    width: 4rem;
  }
  .input-group .form-range {
    flex-grow: 1;
    width: 1%;
    height: unset;
    padding: 0 1rem;
  }
</style>
