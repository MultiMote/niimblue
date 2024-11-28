<script lang="ts">
  import * as fabric from "fabric";
  import { tr } from "../utils/i18n";
  import MdIcon from "./basic/MdIcon.svelte";
  import { Toasts } from "../utils/toasts";
  import { OBJECT_DEFAULTS_TEXT } from "../defaults";

  export let selectedObject: fabric.FabricObject;
  export let valueUpdated: () => void;


  let selectedText: fabric.IText | undefined;
  let fontQuerySupported = typeof queryLocalFonts !== "undefined";
  let fontFamilies: string[] = [OBJECT_DEFAULTS_TEXT.fontFamily];

  const setXAlign = (align: "left" | "center" | "right") => {
    selectedText!.set("textAlign", align);
    commit();
  };

  const setYAlign = (align: "top" | "bottom" | "center") => {
    // change object origin, but keep position
    const pos = selectedText!.getPointByOrigin("left", "top");
    selectedText!.set("originY", align);
    selectedText!.setPositionByOrigin(pos, "left", "top");
    commit();
  };

  const editInPopup = () => {
    const text = prompt($tr("params.text.edit.title"), selectedText!.text);
    if (text !== null) {
      selectedText!.set({ text });
      commit();
    }
  };

  const getFonts = async () => {
    try {
      const fonts = await queryLocalFonts();
      fontFamilies = [OBJECT_DEFAULTS_TEXT.fontFamily, ...new Set(fonts.map((f: FontData) => f.family))].sort();
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
    class="btn btn-sm {selectedText.fontWeight === 'bold' ? 'btn-secondary' : ''}" title={$tr("params.text.bold")} on:click={() => {
      if (!selectedText) return;
      if (selectedText.fontWeight === "bold") {
        selectedText.fontWeight = "normal";
      } else {
        selectedText.fontWeight = "bold";
      }
      commit();
    }}>
    <MdIcon icon="format_bold" />
  </button>
  <button
    class="btn btn-sm {selectedText.backgroundColor === 'black' ? 'btn-secondary' : ''}" title={$tr("params.text.invert_colors")} on:click={() => {
    if (!selectedText) return;
    if (selectedText.backgroundColor === "black") {
      selectedText.set({
        backgroundColor: "transparent",
        fill: "black",
      });
    } else {
      selectedText.set({
        backgroundColor: "black",
        fill: "white",
      });
    }
    commit();
    }}>
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
      value={selectedText.fontSize}
      on:input={(e) => {
        selectedText?.set('fontSize', e.currentTarget.valueAsNumber ?? 1)
        commit();
      }} />
    <button class="btn btn-secondary" title={$tr("params.text.font_size.up")} on:click={() => {
      selectedText?.set('fontSize', selectedText.fontSize + (selectedText.fontSize > 40 ? 10 : 2))
      commit();
    }}>
      <MdIcon icon="text_increase" />
    </button>
    <button class="btn btn-secondary" title={$tr("params.text.font_size.down")} on:click={() => {
      selectedText?.set('fontSize', selectedText.fontSize - (selectedText.fontSize > 40 ? 10 : 2))
      commit();
    }}>
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
      on:input={(e) => {
        selectedText?.set('lineHeight', e.currentTarget.valueAsNumber ?? 1)
        commit();
      }} />
  </div>

  <div class="input-group flex-nowrap input-group-sm font-family">
    <span class="input-group-text" title={$tr("params.text.font_family")}>
      <MdIcon icon="text_format" />
    </span>
    {#if fontQuerySupported }
      <select class="form-select" value={selectedText.fontFamily} on:change={(e) => {
        selectedText?.set('fontFamily', e.currentTarget.value)
        commit();
      }}>
        {#each fontFamilies as font}
          <option value={font} style="font-family: {font}">{font}</option>
        {/each}
      </select>
      <button class="btn btn-secondary" on:click={getFonts} title={$tr("params.text.fetch_fonts")}>
        <MdIcon icon="refresh" />
      </button>
    {:else}
      <input type="text" class="form-control" value={selectedText.fontFamily} on:input={(e) => {
        selectedText?.set('fontFamily', e.currentTarget.value)
        commit();
      }} />
    {/if}
  </div>

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
  .font-family {
    width: 16em;
  }
</style>
