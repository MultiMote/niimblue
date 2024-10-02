<script lang="ts">
  import { type OjectType } from "../types";
  import { tr } from "../utils/i18n";
  import MdIcon from "./MdIcon.svelte";

  export let onSubmit: (i: OjectType) => void;
</script>

<div class="dropdown">
  <button class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
    <MdIcon icon="format_shapes" />
    <MdIcon icon="add" />
  </button>

  <div class="dropdown-menu">
    <h6 class="dropdown-header">{$tr("editor.objectpicker.title", "Add object")}</h6>
    <div class="p-3">
      <button class="btn me-1" on:click={() => onSubmit("text")}>
        <MdIcon icon="title" />
        {$tr("editor.objectpicker.text", "Text")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("line")}>
        <MdIcon icon="remove" />
        {$tr("editor.objectpicker.line", "Line")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("rectangle")}>
        <MdIcon icon="crop_square" />
        {$tr("editor.objectpicker.rectangle", "Rectangle")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("circle")}>
        <MdIcon icon="radio_button_unchecked" />
        {$tr("editor.objectpicker.circle", "Circle")}
      </button>

      <button class="btn me-1" on:click={() => onSubmit("image")}>
        <MdIcon icon="image" />
        {$tr("editor.objectpicker.image", "Image")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("qrcode")}>
        <MdIcon icon="qr_code_2" />
        {$tr("editor.objectpicker.qrcode", "QR Code")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("barcode")}>
        <MdIcon icon="view_week" />
        {$tr("editor.objectpicker.barcode", "Barcode")}
      </button>
    </div>
  </div>
</div>

<style>
  .dropdown-menu {
    min-width: 400px;
  }
</style>
