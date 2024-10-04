<script lang="ts">
  import { fabric } from "fabric";
  import { tr } from "../utils/i18n";
  import MdIcon from "./MdIcon.svelte";
  import { Toasts } from "../utils/toasts";

  export let selectedObject: fabric.Object;
  export let valueUpdated: () => void;

  const DEFAULT_FONT = "Noto Sans Variable";

  let selectedText: fabric.IText | undefined;
  let fontFamilies: string[] = [DEFAULT_FONT];

  const toggleBold = () => {
    if (selectedText!.fontWeight === "bold") {
      selectedText!.fontWeight = "normal";
    } else {
      selectedText!.fontWeight = "bold";
    }

    commit();
  };

  const invertColors = () => {
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
    commit();
  };

  const setXAlign = (align: "left" | "center" | "right") => {
    selectedText!.textAlign = align;

    // change object origin, but keep position
    const pos = selectedText!.getPointByOrigin("left", "top");
    selectedText!.originX = align;
    selectedText!.setPositionByOrigin(pos, "left", "top");

    commit();
  };

  const setYAlign = (align: "top" | "bottom" | "center") => {
    // change object origin, but keep position
    const pos = selectedText!.getPointByOrigin("left", "top");
    selectedText!.originY = align;
    selectedText!.setPositionByOrigin(pos, "left", "top");

    commit();
  };

  const fontSizeUp = () => {
    selectedText!.fontSize! += selectedText!.fontSize! > 40 ? 10 : 2;
    commit();
  };
  const fontSizeDown = () => {
    selectedText!.fontSize! -= selectedText!.fontSize! > 40 ? 10 : 2;
    commit();
  };

  const getFonts = async () => {
    try {
      const fonts = await queryLocalFonts();
      fontFamilies = [DEFAULT_FONT, ...new Set(fonts.map((f: FontData) => f.family))].sort();
      console.log(fontFamilies);
    } catch (e) {
      Toasts.error(e);
    }
  };

  const commit = () => {
    selectedText!.fontSize = Math.max(selectedText!.fontSize!, 1);
    valueUpdated();
  };

  $: {
    selectedText = selectedObject instanceof fabric.IText ? (selectedObject as fabric.IText) : undefined;
  }
</script>

{#if selectedText}
  <!-- <div class="d-flex flex-wrap gap-1"> -->
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
    <button
      class="btn btn-sm dropdown-toggle"
      type="button"
      data-bs-toggle="dropdown"
      title={$tr("params.text.vorigin")}>
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
    on:click={toggleBold}
    title={$tr("params.text.bold")}>
    <MdIcon icon="format_bold" />
  </button>
  <button
    class="btn btn-sm {selectedText.backgroundColor === 'black' ? 'btn-secondary' : ''}"
    on:click={invertColors}
    title={$tr("params.text.invert_colors")}>
    <MdIcon icon="invert_colors" />
  </button>

  <div class="input-group flex-nowrap input-group-sm font-size">
    <span class="input-group-text" title={$tr("params.text.font_size")}><MdIcon icon="format_size" /></span>
    <input
      type="number"
      min="1"
      max="999"
      step="2"
      class="form-control"
      bind:value={selectedText.fontSize}
      on:input={commit} />
    <button
      class="btn btn-secondary"
      on:click={fontSizeDown}
      title={$tr("params.text.font_size.down")}><MdIcon icon="text_decrease" /></button>
    <button class="btn btn-secondary" on:click={fontSizeUp} title={$tr("params.text.font_size.up")}>
      <MdIcon icon="text_increase" />
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
      bind:value={selectedText.lineHeight}
      on:input={commit} />
  </div>

  <div class="input-group flex-nowrap input-group-sm font-family">
    <span class="input-group-text" title={$tr("params.text.font_family")}>
      <MdIcon icon="text_format" />
    </span>
    <!-- svelte-ignore missing-declaration -->
    {#if typeof queryLocalFonts !== "undefined"}
      <select class="form-select" bind:value={selectedText.fontFamily} on:change={commit}>
        {#each fontFamilies as font}
          <option value={font}>{font}</option>
        {/each}
      </select>
      <button class="btn btn-secondary" on:click={getFonts} title={$tr("params.text.fetch_fonts")}>
        <MdIcon icon="refresh" />
      </button>
    {:else}
      <input type="text" class="form-control" bind:value={selectedText.fontFamily} on:input={commit} />
    {/if}
  </div>
  <!-- </div> -->
{/if}

<style>
  .input-group {
    width: 7em;
  }
  .font-size {
    width: 12em;
  }
  .font-family {
    width: 16em;
  }
</style>
