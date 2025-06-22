<script lang="ts">
  import * as fabric from "fabric";
  import { tr } from "../../utils/i18n";
  import MdIcon from "../basic/MdIcon.svelte";
  import FontFamilyPicker from "./FontFamilyPicker.svelte";

  export let selectedObject: fabric.FabricObject;
  export let valueUpdated: () => void;

  let sizeMin: number = 1;
  let sizeMax: number = 999;

  let selectedText: fabric.IText | undefined;

  const setXAlign = (align: fabric.TOriginX) => {
    selectedText!.set({ textAlign: align });
    valueUpdated();
  };

  const setYAlign = (align: fabric.TOriginY) => {
    // change object origin, but keep position
    const pos = selectedText!.getPointByOrigin("left", "top");
    selectedText!.set({ originY: align });
    selectedText!.setPositionByOrigin(pos, "left", "top");
    valueUpdated();
  };

  const toggleBold = () => {
    if (selectedText!.fontWeight === "bold") {
      selectedText!.fontWeight = "normal";
    } else {
      selectedText!.fontWeight = "bold";
    }
    valueUpdated();
  };

  const toggleInvertColors = () => {
    if (selectedText!.backgroundColor === "black") {
      selectedText!.set({
        backgroundColor: "transparent",
        fill: "black",
      });
    } else {
      selectedText!.set({
        backgroundColor: "black",
        fill: "white",
      });
    }
    valueUpdated();
  };

  const updateFontFamily = (v: string) => {
    selectedText!.set({ fontFamily: v });
    valueUpdated();
  };

  const fontSizeUp = () => {
    let s = selectedText!.fontSize;
    selectedText!.set({ fontSize: Math.min(s > 40 ? Math.round(s * 1.1) : s + 2, sizeMax) });
    valueUpdated();
  };

  const fontSizeDown = () => {
    let s = selectedText!.fontSize;
    selectedText!.set({ fontSize: Math.max(s > 40 ? Math.round(s * 0.9) : s - 2, sizeMin) });
    valueUpdated();
  };

  const lineHeightChange = (v: number) => {
    v = isNaN(v) ? 1 : v;
    selectedText?.set({ lineHeight: v });
    valueUpdated();
  };

  const fontSizeChange = (v: number) => {
    v = isNaN(v) ? 1 : Math.min(Math.max(v, sizeMin), sizeMax);
    selectedText?.set({ fontSize: v });
    valueUpdated();
  };

  const editInPopup = () => {
    const text = prompt($tr("params.text.edit.title"), selectedText!.text);
    if (text !== null) {
      selectedText!.set({ text });
      valueUpdated();
    }
  };

  $: {
    selectedText = selectedObject instanceof fabric.IText ? (selectedObject as fabric.IText) : undefined;
  }
</script>

{#if selectedText}
  <button
    title={$tr("params.text.align.left")}
    class="btn btn-sm {selectedText.textAlign === 'left' ? 'btn-secondary' : ''}"
    on:click={() => setXAlign("left")}><MdIcon icon="format_align_left" /></button>
  <button
    title={$tr("params.text.align.center")}
    class="btn btn-sm {selectedText.textAlign === 'center' ? 'btn-secondary' : ''}"
    on:click={() => setXAlign("center")}><MdIcon icon="format_align_center" /></button>
  <button
    title={$tr("params.text.align.right")}
    class="btn btn-sm {selectedText.textAlign === 'right' ? 'btn-secondary' : ''}"
    on:click={() => setXAlign("right")}><MdIcon icon="format_align_right" /></button>
  <div class="dropdown">
    <button class="btn btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" title={$tr("params.text.vorigin")}>
      {#if selectedText.originY === "top"}
        <MdIcon icon="vertical_align_top" />
      {:else if selectedText.originY === "center"}
        <MdIcon icon="vertical_align_center" />
      {:else if selectedText.originY === "bottom"}
        <MdIcon icon="vertical_align_bottom" />
      {/if}
    </button>
    <div class="dropdown-menu p-2">
      <button
        class="btn btn-sm {selectedText.originY === 'top' ? 'btn-secondary' : ''}"
        on:click={() => setYAlign("top")}
        title={$tr("params.text.vorigin.top")}>
        <MdIcon icon="vertical_align_top" />
      </button>
      <button
        class="btn btn-sm {selectedText.originY === 'center' ? 'btn-secondary' : ''}"
        on:click={() => setYAlign("center")}
        title={$tr("params.text.vorigin.center")}>
        <MdIcon icon="vertical_align_center" />
      </button>
      <button
        class="btn btn-sm {selectedText.originY === 'bottom' ? 'btn-secondary' : ''}"
        on:click={() => setYAlign("bottom")}
        title={$tr("params.text.vorigin.bottom")}>
        <MdIcon icon="vertical_align_bottom" />
      </button>
    </div>
  </div>

  <button
    class="btn btn-sm {selectedText.fontWeight === 'bold' ? 'btn-secondary' : ''}"
    title={$tr("params.text.bold")}
    on:click={toggleBold}>
    <MdIcon icon="format_bold" />
  </button>

  <button
    class="btn btn-sm {selectedText.backgroundColor === 'black' ? 'btn-secondary' : ''}"
    title={$tr("params.text.invert_colors")}
    on:click={toggleInvertColors}>
    <MdIcon icon="invert_colors" />
  </button>

  <div class="input-group flex-nowrap input-group-sm font-size">
    <span class="input-group-text" title={$tr("params.text.font_size")}><MdIcon icon="format_size" /></span>
    <input
      type="number"
      min={sizeMin}
      max={sizeMax}
      step="2"
      class="form-control"
      value={selectedText.fontSize}
      on:input={(e) => fontSizeChange(e.currentTarget.valueAsNumber)} />
    <button class="btn btn-secondary" title={$tr("params.text.font_size.up")} on:click={fontSizeUp}>
      <MdIcon icon="text_increase" />
    </button>
    <button class="btn btn-secondary" title={$tr("params.text.font_size.down")} on:click={fontSizeDown}>
      <MdIcon icon="text_decrease" />
    </button>
  </div>

  <div class="input-group flex-nowrap input-group-sm">
    <span class="input-group-text" title={$tr("params.text.line_height")}>
      <MdIcon icon="density_medium" />
    </span>
    <input
      type="number"
      min="0.1"
      step="0.1"
      max="10"
      class="form-control"
      value={selectedText.lineHeight}
      on:input={(e) => lineHeightChange(e.currentTarget.valueAsNumber)} />
  </div>

  <FontFamilyPicker value={selectedText.fontFamily} valueUpdated={updateFontFamily} />

  <button class="btn btn-sm btn-secondary" on:click={editInPopup} title={$tr("params.text.edit")}>
    <MdIcon icon="edit" />
  </button>
{/if}

<style>
  .input-group {
    width: 7em;
  }
  .font-size {
    width: 12em;
  }
</style>
