<script lang="ts">
  import type { LabelPreset } from "../types";

  export let onItemSelected: (preset: LabelPreset) => void;

  // <option value=""></option>
  // <option value="L:1:240x96">D# 30x15mm | 8dpmm (203dpi) | Left</option>
  // <option value="L:1:320x96">D# 40x15mm | 8dpmm (203dpi) | Left</option>
  // <option value="T:1:96x320">D# 40x15mm | 8dpmm (203dpi) | Top</option>
  // <option value="T:8:30x20">B# 30x20mm | 8dpmm (203dpi) | Top</option>
  // <option value="T:8:40x30">B# 40x30mm | 8dpmm (203dpi) | Top</option>
  // <option value="T:8:40x70">B# 40x70mm | 8dpmm (203dpi) | Top</option>
  // <option value="T:8:43x25">B# 43x25mm | 8dpmm (203dpi) | Top</option>
  // <option value="T:8:50x30">B# 50x30mm | 8dpmm (203dpi) | Top</option>
  // <option value="T:8:50x40">B# 50x40mm | 8dpmm (203dpi) | Top</option>

  const presets: LabelPreset[] = [
    { width: 30, height: 12, unit: "mm", dpmm: 8, printDirection: "left" },
    { width: 40, height: 12, unit: "mm", dpmm: 8, printDirection: "left" },
    { width: 12, height: 40, unit: "mm", dpmm: 8, printDirection: "top" },
    { width: 30, height: 20, unit: "mm", dpmm: 8, printDirection: "top" },
    { width: 40, height: 30, unit: "mm", dpmm: 8, printDirection: "top" },
    { width: 40, height: 70, unit: "mm", dpmm: 8, printDirection: "top" },
    { width: 43, height: 25, unit: "mm", dpmm: 8, printDirection: "top" },
    { width: 50, height: 30, unit: "mm", dpmm: 8, printDirection: "top" },
    { width: 50, height: 40, unit: "mm", dpmm: 8, printDirection: "top" },
  ];

  const scaleDimensions = (preset: LabelPreset): { width: number; height: number } => {
    const scaleFactor = Math.min(100 / preset.width, 100 / preset.height);
    return {
      width: Math.round(preset.width * scaleFactor),
      height: Math.round(preset.height * scaleFactor),
    };
  };
</script>

<div class="preset-browser overflow-y-auto border d-flex gap-1 flex-wrap {$$props.class}">
  {#each presets as item}
    <button
      class="btn p-0 card-wrapper d-flex justify-content-center align-items-center"
      on:click={() => onItemSelected(item)}
    >
      <div
        class="card print-start-{item.printDirection} d-flex justify-content-center align-items-center"
        style="width: {scaleDimensions(item).width}%; height: {scaleDimensions(item).height}%;"
      >
        <span class="label p-1">
          {item.width}x{item.height}{item.unit}
        </span>
      </div>
    </button>
  {/each}
</div>

<style>
  .preset-browser {
    max-height: 200px;
    max-width: 100%;
  }

  .card-wrapper {
    width: 96px;
    height: 96px;
  }

  .card {
    background-color: white;
  }
  .card > .label {
    background-color: rgba(255, 255, 255, 0.8);
    color: black;
    border-radius: 8px;
  }

  .card.print-start-left {
    border-left: 2px solid #ff4646;
  }
  .card.print-start-top {
    border-top: 2px solid #ff4646;
  }
</style>
