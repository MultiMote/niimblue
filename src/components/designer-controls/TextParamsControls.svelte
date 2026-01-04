<script lang="ts">
  import * as fabric from "fabric";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import FontFamilyPicker from "$/components/designer-controls/FontFamilyPicker.svelte";

  interface Props {
    selectedText: fabric.IText;
    editRevision: number;
    valueUpdated: () => void;
  }

  let { selectedText, editRevision, valueUpdated }: Props = $props();

  let sizeMin: number = 1;
  let sizeMax: number = 999;

  const setXAlign = (align: fabric.TOriginX) => {
    selectedText.set({ textAlign: align });
    valueUpdated();
  };

  const setYAlign = (align: fabric.TOriginY) => {
    // change object origin, but keep position
    const pos = selectedText.getPointByOrigin("left", "top");
    selectedText.set({ originY: align });
    selectedText.setPositionByOrigin(pos, "left", "top");
    valueUpdated();
  };

  const toggleBold = () => {
    if (selectedText.fontWeight === "bold") {
      selectedText.fontWeight = "normal";
    } else {
      selectedText.fontWeight = "bold";
    }
    valueUpdated();
  };

  const toggleItalic = () => {
    if (selectedText.fontStyle === "italic") {
      selectedText.fontStyle = "normal";
    } else {
      selectedText.fontStyle = "italic";
    }
    valueUpdated();
  };

  const updateFontFamily = (v: string) => {
    selectedText.set({ fontFamily: v });
    valueUpdated();
  };

  const fontSizeUp = () => {
    let s = selectedText.fontSize;
    selectedText.set({ fontSize: Math.min(s > 40 ? Math.round(s * 1.1) : s + 2, sizeMax) });
    valueUpdated();
  };

  const fontSizeDown = () => {
    let s = selectedText.fontSize;
    selectedText.set({ fontSize: Math.max(s > 40 ? Math.round(s * 0.9) : s - 2, sizeMin) });
    valueUpdated();
  };

  const lineHeightChange = (v: number) => {
    v = isNaN(v) ? 1 : v;
    selectedText.set({ lineHeight: v });
    valueUpdated();
  };

  const fontSizeChange = (v: number) => {
    v = isNaN(v) ? 1 : Math.min(Math.max(v, sizeMin), sizeMax);
    selectedText.set({ fontSize: v });
    valueUpdated();
  };

  const fillChanged = (value: string) => {
    selectedText.set({ fill: value });
    valueUpdated();
  };
  const splitChanged = (value: string) => {

    if(selectedText instanceof fabric.Textbox) {
      selectedText.set({ splitByGrapheme: value === "grapheme" });
      valueUpdated();
    }
  };

  const backgroundColorChanged = (value: string) => {
    selectedText.set({ backgroundColor: value });
    valueUpdated();
  };

  const editInPopup = () => {
    const text = prompt($tr("params.text.edit.title"), selectedText.text);
    if (text !== null) {
      selectedText.set({ text });
      selectedText.isEditing = false;
      valueUpdated();
    }
  };


</script>

<!-- Fix component not updating when selectedText changes. I didn't find a better way to do this. -->
<input type="hidden" value={editRevision}>

<button
  title={$tr("params.text.align.left")}
  class="btn btn-sm {selectedText.textAlign === 'left' ? 'btn-secondary' : ''}"
  onclick={() => setXAlign("left")}><MdIcon icon="format_align_left" /></button>
<button
  title={$tr("params.text.align.center")}
  class="btn btn-sm {selectedText.textAlign === 'center' ? 'btn-secondary' : ''}"
  onclick={() => setXAlign("center")}><MdIcon icon="format_align_center" /></button>
<button
  title={$tr("params.text.align.right")}
  class="btn btn-sm {selectedText.textAlign === 'right' ? 'btn-secondary' : ''}"
  onclick={() => setXAlign("right")}><MdIcon icon="format_align_right" /></button>
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
      onclick={() => setYAlign("top")}
      title={$tr("params.text.vorigin.top")}>
      <MdIcon icon="vertical_align_top" />
    </button>
    <button
      class="btn btn-sm {selectedText.originY === 'center' ? 'btn-secondary' : ''}"
      onclick={() => setYAlign("center")}
      title={$tr("params.text.vorigin.center")}>
      <MdIcon icon="vertical_align_center" />
    </button>
    <button
      class="btn btn-sm {selectedText.originY === 'bottom' ? 'btn-secondary' : ''}"
      onclick={() => setYAlign("bottom")}
      title={$tr("params.text.vorigin.bottom")}>
      <MdIcon icon="vertical_align_bottom" />
    </button>
  </div>
</div>

<button
  class="btn btn-sm {selectedText.fontWeight === 'bold' ? 'btn-secondary' : ''}"
  title={$tr("params.text.bold")}
  onclick={toggleBold}>
  <MdIcon icon="format_bold" />
</button>

<button
  class="btn btn-sm {selectedText.fontStyle === 'italic' ? 'btn-secondary' : ''}"
  title={$tr("params.text.italic")}
  onclick={toggleItalic}>
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
      <select class="form-select" value={selectedText.fill} onchange={(e) => fillChanged(e.currentTarget.value)}>
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
        value={selectedText.backgroundColor || "transparent"}
        onchange={(e) => backgroundColorChanged(e.currentTarget.value)}>
        <option value="white">{$tr("params.color.white")}</option>
        <option value="black">{$tr("params.color.black")}</option>
        <option value="transparent">{$tr("params.color.transparent")}</option>
      </select>
    </div>
  </div>
</div>

{#if selectedText instanceof fabric.Textbox}
  <div class="dropdown">
    <button class="btn btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" title={$tr("params.params.text.split")}>
      <MdIcon icon="wrap_text" />
    </button>

    <div class="dropdown-menu arrangement p-2">
      <div class="input-group input-group-sm flex-nowrap split pb-2">
        <select class="form-select" value={selectedText.splitByGrapheme ? "grapheme" : "space"} onchange={(e) => splitChanged(e.currentTarget.value)}>
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
    oninput={(e) => fontSizeChange(e.currentTarget.valueAsNumber)} />
  <button class="btn btn-secondary" title={$tr("params.text.font_size.up")} onclick={fontSizeUp}>
    <MdIcon icon="text_increase" />
  </button>
  <button class="btn btn-secondary" title={$tr("params.text.font_size.down")} onclick={fontSizeDown}>
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
    oninput={(e) => lineHeightChange(e.currentTarget.valueAsNumber)} />
</div>

<FontFamilyPicker value={selectedText.fontFamily} valueUpdated={updateFontFamily} />

<button class="btn btn-sm btn-secondary" onclick={editInPopup} title={$tr("params.text.edit")}>
  <MdIcon icon="edit" />
</button>

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
