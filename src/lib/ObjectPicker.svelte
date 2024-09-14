<script lang="ts">
  import FaIcon from "./FaIcon.svelte";
  import { type OjectType } from "../types";
  import { tr } from "../utils/i18n";

  export let onSubmit: (i: OjectType) => void;
</script>

<div class="dropdown">
  <button class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
    <FaIcon icon="vector-square" />
    <FaIcon icon="plus" />
  </button>

  <div class="dropdown-menu">
    <h6 class="dropdown-header">{$tr("editor.objectpicker.title", "Add object")}</h6>
    <div class="p-3">
      <button class="btn me-1" on:click={() => onSubmit("text")}>
        <FaIcon icon="font" /> {$tr("editor.objectpicker.text", "Text")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("line")}>
        <FaIcon icon="minus" /> {$tr("editor.objectpicker.line", "Line")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("rectangle")}>
        <FaIcon icon="vector-square" /> {$tr("editor.objectpicker.rectangle", "Rectangle")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("circle")}>
        <FaIcon icon="circle-dot" /> {$tr("editor.objectpicker.circle", "Circle")}
      </button>

      <button class="btn me-1" on:click={() => onSubmit("image")}>
        <FaIcon icon="image" /> {$tr("editor.objectpicker.image", "Image")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("qrcode")}>
        <FaIcon icon="qrcode" /> {$tr("editor.objectpicker.qrcode", "QR Code")}
      </button>
      <button class="btn me-1" on:click={() => onSubmit("barcode")}>
        <FaIcon icon="barcode" /> {$tr("editor.objectpicker.barcode", "Barcode")}
      </button>
    </div>
  </div>
</div>

<style>
  .dropdown-menu {
    min-width: 400px;
  }
</style>
