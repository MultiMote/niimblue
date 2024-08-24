<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { derived } from "svelte/store";
  import Modal from "bootstrap/js/dist/modal";
  import { connectionState, printerClient, printerMeta } from "../stores";
  import { copyImageData, threshold, atkinson } from "../post_process";
  import { type EncodedImage, ImageEncoder, LabelType, PacketGenerator, ProtocolVersion } from "@mmote/niimbluelib";
  import type { LabelProps } from "../types";
  import FaIcon from "./FaIcon.svelte";

  export let onClosed: () => void;
  export let labelProps: LabelProps;
  export let imageCallback: () => string;

  let modalElement: HTMLElement;
  let previewCanvas: HTMLCanvasElement;
  let printState: "idle" | "sending" | "printing" = "idle";
  let modal: Modal;
  let printProgress: number = 0; // todo: more progress data
  let density: number = 3;
  let quantity: number = 1;
  let postProcessType: "threshold" | "dither";
  let thresholdValue: number = 140;
  let imgData: ImageData;
  let imgContext: CanvasRenderingContext2D;
  let printTaskVersion: ProtocolVersion = ProtocolVersion.V3;
  let labelType: LabelType = LabelType.WithGaps;
  let statusTimer: NodeJS.Timeout | undefined = undefined;
  let error: string = "";
  let taskVer = $printerClient?.getPrintTaskVersion();

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

    statusTimer = setInterval(async () => {
      try {
        const status = await $printerClient.abstraction.getPrintStatus();
        printProgress = status.pagePrintProgress;

        if (status.page === quantity && status.pagePrintProgress === 100 && status.pageFeedProgress === 100) {
          await endPrint();
        }
      } catch (e) {
        error = `${e}`;
        console.error(e);
        await endPrint();
      }
    }, 100);

    printState = "idle";
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

  onMount(() => {
    // create image from fabric canvas to work with
    const img = new Image();
    img.onload = () => {
      previewCanvas.width = img.width;
      previewCanvas.height = img.height;
      imgContext = previewCanvas.getContext("2d")!;
      imgContext.drawImage(img, 0, 0, img.width, img.height);
      imgData = imgContext.getImageData(0, 0, img.width, img.height);
      updatePreview();
    };
    img.src = imageCallback();

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

          <select class="form-select" bind:value={postProcessType} on:change={updatePreview}>
            <option value="threshold">Threshold</option>
            <option value="dither">Dither (Atkinson)</option>
          </select>

          <input
            type="range"
            id="threshold"
            class="form-range"
            min="1"
            max="255"
            bind:value={thresholdValue}
            on:change={updatePreview}
          />
        </div>

        <div class="input-group flex-nowrap input-group-sm">
          <span class="input-group-text">Copies</span>
          <input class="form-control" type="number" min="1" bind:value={quantity} />
        </div>

        <div class="input-group flex-nowrap input-group-sm">
          <span class="input-group-text">Density</span>
          <input class="form-control" type="number" min="1" max="6" bind:value={density} />
        </div>

        <div class="input-group input-group-sm">
          <span class="input-group-text">Label type</span>
          <select class="form-select" bind:value={labelType}>
            {#each Object.values(LabelType) as lt}
              {#if typeof lt !== "string"}
                <option value={lt}>
                  {#if $printerMeta?.paperTypes.includes(lt)}✔{/if}
                  {LabelType[lt]}
                </option>
              {/if}
            {/each}
          </select>
        </div>

        <div class="input-group input-group-sm">
          <span class="input-group-text">Print task version</span>
          <select class="form-select" bind:value={printTaskVersion}>
            <option value={ProtocolVersion.V1} disabled>{#if taskVer === ProtocolVersion.V1}✔{/if} V1 - NOT IMPLEMENTED</option>
            <option value={ProtocolVersion.V2} disabled>{#if taskVer === ProtocolVersion.V2}✔{/if} V2 - NOT IMPLEMENTED</option>
            <option value={ProtocolVersion.V3}>{#if taskVer === ProtocolVersion.V3}✔{/if} V3 - D110</option>
            <option value={ProtocolVersion.V4}>{#if taskVer === ProtocolVersion.V4}✔{/if} V4 - B1</option>
            <option value={ProtocolVersion.V5} disabled>{#if taskVer === ProtocolVersion.V5}✔{/if} V5 - NOT IMPLEMENTED</option>
          </select>
        </div>

        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>

        {#if printState !== "idle"}
          <button type="button" class="btn btn-primary" disabled={$disconnected} on:click={endPrint}>
            Cancel print
          </button>
        {/if}

        <button
          type="button"
          class="btn btn-primary"
          disabled={$disconnected || printState !== "idle"}
          on:click={onPrint}
        >
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
</style>
