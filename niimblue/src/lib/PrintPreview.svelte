<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { derived } from "svelte/store";
  import Modal from "bootstrap/js/dist/modal";
  import { connectionState, printerClient, printerMeta } from "../stores";
  import { copyImageData, threshold, atkinson } from "../utils/post_process";
  import {
    type EncodedImage,
    ImageEncoder,
    LabelType,
    ProtocolVersion,
    type PrintProgressEvent,
  } from "@mmote/niimbluelib";
  import type { LabelProps, PostProcessType } from "../types";
  import FaIcon from "./FaIcon.svelte";
  import ParamLockButton from "./ParamLockButton.svelte";

  export let onClosed: () => void;
  export let labelProps: LabelProps;
  export let imageCallback: () => string;
  export let printNow: boolean = false;

  let modalElement: HTMLElement;
  let previewCanvas: HTMLCanvasElement;
  let printState: "idle" | "sending" | "printing" = "idle";
  let modal: Modal;
  let printProgress: number = 0; // todo: more progress data
  let density: number = 3;
  let quantity: number = 1;
  let postProcessType: PostProcessType;
  let thresholdValue: number = 140;
  let imgData: ImageData;
  let imgContext: CanvasRenderingContext2D;
  let printTaskVersion: ProtocolVersion = ProtocolVersion.V3;
  let labelType: LabelType = LabelType.WithGaps;
  let statusTimer: NodeJS.Timeout | undefined = undefined;
  let error: string = "";
  let taskVer = $printerClient?.getPrintTaskVersion();

  let savedProps = {} as {
    postProcess?: PostProcessType;
    threshold?: number;
    quantity?: number;
    density?: number;
    labelType?: LabelType;
    printTaskVersion?: ProtocolVersion;
  };

  const disconnected = derived(connectionState, ($connectionState) => $connectionState !== "connected");

  const endPrint = async () => {
    clearInterval(statusTimer);

    if (!$disconnected && printState !== "idle") {
      await $printerClient.abstraction.printEnd();
    }

    printState = "idle";
    printProgress = 0;
  };

  const onPrint = async () => {
    const encoded: EncodedImage = ImageEncoder.encodeCanvas(previewCanvas, labelProps.printDirection);

    printState = "sending";
    error = "";

    try {
      await $printerClient.abstraction.print(printTaskVersion, encoded, { quantity, density, labelType });
    } catch (e) {
      error = `${e}`;
      console.error(e);
      return;
    }

    printState = "printing";

    const listener = (e: PrintProgressEvent) => {
      printProgress = e.pagePrintProgress;
    };

    $printerClient.addEventListener("printprogress", listener);

    try {
      await $printerClient.abstraction.waitUntilPrintFinished(quantity, 100);
    } catch (e) {
      error = `${e}`;
      console.error(e);
    }

    $printerClient.removeEventListener("printprogress", listener);
    await endPrint();

    printState = "idle";

    if (printNow && !error) {
      modal.hide();
    }
  };

  const updatePreview = () => {
    let iData: ImageData = copyImageData(imgData);

    if (postProcessType === "threshold") {
      iData = threshold(iData, thresholdValue);
    } else if (postProcessType === "dither") {
      iData = atkinson(iData, thresholdValue);
    }

    imgContext.putImageData(iData, 0, 0);
  };

  const toggleSavedProp = (key: string, value: any) => {
    const keyObj = key as keyof typeof savedProps;
    savedProps[keyObj] = savedProps[keyObj] === undefined ? value : undefined;
    localStorage.setItem("saved_preview_props", JSON.stringify(savedProps));
  };

  const updateSavedProp = (key: string, value: any, refreshPreview: boolean = false) => {
    const keyObj = key as keyof typeof savedProps;

    if (savedProps[keyObj] !== undefined) {
      savedProps[keyObj] = savedProps[keyObj] = value;
      localStorage.setItem("saved_preview_props", JSON.stringify(savedProps));
    }

    if (refreshPreview) {
      updatePreview();
    }
  };

  const loadProps = () => {
    try {
      savedProps = JSON.parse(localStorage.getItem("saved_preview_props") ?? "{}");
      if (savedProps.postProcess) postProcessType = savedProps.postProcess;
      if (savedProps.threshold) thresholdValue = savedProps.threshold;
      if (savedProps.quantity) quantity = savedProps.quantity;
      if (savedProps.density) density = savedProps.density;
      if (savedProps.labelType) labelType = savedProps.labelType;
      if (savedProps.printTaskVersion) printTaskVersion = savedProps.printTaskVersion;
    } catch (e) {
      console.error("Props load error", e);
    }
  };

  onMount(() => {
    modal = new Modal(modalElement);
    modal.show();
    modalElement.addEventListener("hidden.bs.modal", async () => {
      endPrint();
      onClosed();
    });

    if (taskVer !== undefined) {
      console.log(`Detected print task version: ${ProtocolVersion[taskVer]}`);
      printTaskVersion = taskVer;
    }

    loadProps();

    // create image from fabric canvas to work with
    const img = new Image();
    img.onload = () => {
      previewCanvas.width = img.width;
      previewCanvas.height = img.height;
      imgContext = previewCanvas.getContext("2d")!;
      imgContext.drawImage(img, 0, 0, img.width, img.height);
      imgData = imgContext.getImageData(0, 0, img.width, img.height);
      updatePreview();

      if (printNow && !$disconnected && printState === "idle") {
        onPrint();
      }
    };
    img.src = imageCallback();
  });

  onDestroy(() => {
    if (modal) {
      modal.hide();
      modal.dispose();
    }
  });
</script>

<div
  bind:this={modalElement}
  class="modal fade"
  id="exampleModal"
  tabindex="-1"
  aria-labelledby="exampleModalLabel"
  aria-hidden="true"
>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5" id="exampleModalLabel">Print preview</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body text-center">
        <canvas class="print-start-{labelProps.printDirection}" bind:this={previewCanvas}></canvas>

        {#if printState === "sending"}
          <div>Sending...</div>
        {/if}
        {#if printProgress != 0 && printProgress != 100}
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
          <span class="input-group-text">Post-process</span>

          <select
            class="form-select"
            bind:value={postProcessType}
            on:change={() => updateSavedProp("postProcess", postProcessType, true)}
          >
            <option value="threshold">Threshold</option>
            <option value="dither">Dither (Atkinson)</option>
          </select>

          <ParamLockButton
            propName="postProcess"
            value={postProcessType}
            savedValue={savedProps.postProcess}
            onClick={toggleSavedProp}
          />
        </div>

        <div class="input-group input-group-sm">
          <span class="input-group-text">Threshold</span>

          <input
            type="range"
            id="threshold"
            class="form-range"
            min="1"
            max="255"
            bind:value={thresholdValue}
            on:change={() => updateSavedProp("threshold", thresholdValue, true)}
          />
          <span class="input-group-text">{thresholdValue}</span>

          <ParamLockButton
            propName="threshold"
            value={thresholdValue}
            savedValue={savedProps.threshold}
            onClick={toggleSavedProp}
          />
        </div>

        <div class="input-group flex-nowrap input-group-sm">
          <span class="input-group-text">Copies</span>
          <input
            class="form-control"
            type="number"
            min="1"
            bind:value={quantity}
            on:change={() => updateSavedProp("quantity", quantity)}
          />
          <ParamLockButton
            propName="quantity"
            value={quantity}
            savedValue={savedProps.quantity}
            onClick={toggleSavedProp}
          />
        </div>

        <div class="input-group flex-nowrap input-group-sm">
          <span class="input-group-text">Density</span>
          <input
            class="form-control"
            type="number"
            min="1"
            max="6"
            bind:value={density}
            on:change={() => updateSavedProp("density", density)}
          />
          <ParamLockButton propName="density" value={density} savedValue={savedProps.density} onClick={toggleSavedProp} />
        </div>

        <div class="input-group input-group-sm">
          <span class="input-group-text">Label type</span>
          <select class="form-select" bind:value={labelType} on:change={() => updateSavedProp("labelType", labelType)}>
            {#each Object.values(LabelType) as lt}
              {#if typeof lt !== "string"}
                <option value={lt}>
                  {#if $printerMeta?.paperTypes.includes(lt)}✔{/if}
                  {LabelType[lt]}
                </option>
              {/if}
            {/each}
          </select>

          <ParamLockButton
            propName="labelType"
            value={labelType}
            savedValue={savedProps.labelType}
            onClick={toggleSavedProp}
          />
        </div>

        <div class="input-group input-group-sm">
          <span class="input-group-text">Print task version</span>
          <select
            class="form-select"
            bind:value={printTaskVersion}
            on:change={() => updateSavedProp("printTaskVersion", printTaskVersion)}
          >
            <option value={ProtocolVersion.V1} disabled
              >{#if taskVer === ProtocolVersion.V1}✔{/if} V1 - NOT IMPLEMENTED</option
            >
            <option value={ProtocolVersion.V2} disabled
              >{#if taskVer === ProtocolVersion.V2}✔{/if} V2 - NOT IMPLEMENTED</option
            >
            <option value={ProtocolVersion.V3}
              >{#if taskVer === ProtocolVersion.V3}✔{/if} V3 - D110</option
            >
            <option value={ProtocolVersion.V4}
              >{#if taskVer === ProtocolVersion.V4}✔{/if} V4 - B1</option
            >
            <option value={ProtocolVersion.V5} disabled
              >{#if taskVer === ProtocolVersion.V5}✔{/if} V5 - NOT IMPLEMENTED</option
            >
          </select>

          <ParamLockButton
            propName="printTaskVersion"
            value={printTaskVersion}
            savedValue={savedProps.printTaskVersion}
            onClick={toggleSavedProp}
          />
        </div>

        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>

        {#if printState !== "idle"}
          <button type="button" class="btn btn-primary" disabled={$disconnected} on:click={endPrint}>
            Cancel print
          </button>
        {/if}

        <button type="button" class="btn btn-primary" disabled={$disconnected || printState !== "idle"} on:click={onPrint}>
          {#if $disconnected}
            Printer is not connected
          {:else}
            <FaIcon icon="print" /> Print
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  canvas {
    border: 1px solid #6d6d6d;
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
