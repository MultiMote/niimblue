<script lang="ts">
  import { type LabelProps, type OjectType } from "../../types";
  import { tr } from "../../utils/i18n";
  import MdIcon from "../basic/MdIcon.svelte";
  import ZplImportButton from "./ZplImportButton.svelte";

  export let onSubmit: (i: OjectType) => void;
  export let labelProps: LabelProps;
  export let zplImageReady: (img: Blob) => void;
</script>

<div class="dropdown">
  <button class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
    <MdIcon icon="format_shapes" />
    <MdIcon icon="add" />
  </button>

  <div class="dropdown-menu">
    <h6 class="dropdown-header">{$tr("editor.objectpicker.title")}</h6>
    <div class="p-3">
      <button class="btn me-1" on:click={() => onSubmit("text")}>
        <MdIcon icon="title" />
        {$tr("editor.objectpicker.text")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("line")}>
        <MdIcon icon="remove" />
        {$tr("editor.objectpicker.line")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("rectangle")}>
        <MdIcon icon="crop_square" />
        {$tr("editor.objectpicker.rectangle")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("circle")}>
        <MdIcon icon="radio_button_unchecked" />
        {$tr("editor.objectpicker.circle")}
      </button>

      <button class="btn me-1" on:click={() => onSubmit("image")}>
        <MdIcon icon="image" />
        {$tr("editor.objectpicker.image")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("qrcode")}>
        <MdIcon icon="qr_code_2" />
        {$tr("editor.objectpicker.qrcode")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("barcode")}>
        <MdIcon icon="view_week" />
        {$tr("editor.objectpicker.barcode")}
      </button>

      <ZplImportButton {labelProps} onImageReady={zplImageReady} text={$tr("editor.import.zpl")} />
    </div>
  </div>
</div>

<style>
  .dropdown-menu {
    width: 100vw;
    max-width: 450px;
  }
</style>
