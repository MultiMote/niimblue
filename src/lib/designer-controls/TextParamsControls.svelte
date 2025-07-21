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

  const toggleItalic = () => {
    if (selectedText!.fontStyle === "italic") {
      selectedText!.fontStyle = "normal";
    } else {
      selectedText!.fontStyle = "italic";
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

  const fillChanged = (value: string) => {
    selectedObject!.set({ fill: value });
    valueUpdated();
  };
  const splitChanged = (value: string) => {

    if(selectedObject instanceof fabric.Textbox) {
      selectedObject!.set({ splitByGrapheme: value === "grapheme" });
      valueUpdated();
    }
  };

  const backgroundColorChanged = (value: string) => {
    selectedObject!.set({ backgroundColor: value });
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
    class="btn btn-sm {selectedText.fontStyle === 'italic' ? 'btn-secondary' : ''}"
    title={$tr("params.text.italic")}
    on:click={toggleItalic}>
    <MdIcon icon="format_italic" />
  </button>

  <div class="dropdown">
    <button class="btn btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" title={$tr("params.color")}>
      <MdIcon icon="format_color_fill" />
    </button>

    <div class="dropdown-menu arrangement p-2">
      <div class="input-group input-group-sm flex-nowrap color pb-2">
        <span class="input-group-text">
          <MdIcon icon="format_color_text" />
        </span>
        <select class="form-select" value={selectedObject.fill} on:change={(e) => fillChanged(e.currentTarget.value)}>
          <option value="white">{$tr("params.color.white")}</option>
          <option value="black">{$tr("params.color.black")}</option>
        </select>
      </div>
      <div class="input-group input-group-sm flex-nowrap color pb-2">
        <span class="input-group-text">
          <MdIcon icon="format_color_fill" />
        </span>
        <select
          class="form-select"
          value={selectedObject.backgroundColor || "transparent"}
          on:change={(e) => backgroundColorChanged(e.currentTarget.value)}>
          <option value="white">{$tr("params.color.white")}</option>
          <option value="black">{$tr("params.color.black")}</option>
          <option value="transparent">{$tr("params.color.transparent")}</option>
        </select>
      </div>
    </div>
  </div>

  {#if selectedText instanceof fabric.Textbox }
    <div class="dropdown">
      <button class="btn btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" title={$tr("params.params.text.split")}>
        <MdIcon icon="wrap_text" />
      </button>

      <div class="dropdown-menu arrangement p-2">
        <div class="input-group input-group-sm flex-nowrap split pb-2">
          <select class="form-select" value={selectedText.splitByGrapheme ? "grapheme" : "space"} on:change={(e) => splitChanged(e.currentTarget.value)}>
            <option value="space">{$tr("params.params.text.split.spaces")}</option>
            <option value="grapheme">{$tr("params.params.text.split.grapheme")}</option>
          </select>
        </div>
      </div>
    </div>
  {/if}


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
  .input-group.color {
    width: 12em;
  }
  .input-group.split {
    width: 14em;
  }
</style>
