<script lang="ts">
  import Dropdown from "bootstrap/js/dist/dropdown";
  import { type LabelProps, type OjectType } from "$/types";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import ZplImportButton from "$/components/designer-controls/ZplImportButton.svelte";

  interface Props {
    onSubmit: (i: OjectType) => void;
    labelProps: LabelProps;
    zplImageReady: (img: Blob) => void;
  }

  let { onSubmit, labelProps, zplImageReady }: Props = $props();

  let dropdownBtn: HTMLButtonElement;

  const pickAndClose = (type: OjectType) => {
    onSubmit(type);
    // Close the dropdown after picking
    const dd = Dropdown.getInstance(dropdownBtn);
    dd?.hide();
  };
</script>

<div class="dropdown">
  <button bind:this={dropdownBtn} class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
    <MdIcon icon="format_shapes" />
    <MdIcon icon="add" />
  </button>

  <div class="dropdown-menu nb-modal-dropdown nb-object-picker">
    <div class="nb-picker-header">
      <h6 class="dropdown-header">{$tr("editor.objectpicker.title")}</h6>
      <button class="nb-close-btn" onclick={() => { const dd = Dropdown.getInstance(dropdownBtn); dd?.hide(); }}>
        <MdIcon icon="close" />
      </button>
    </div>
    <div class="nb-picker-grid">
      <button class="nb-picker-item" onclick={() => pickAndClose("text")}>
        <div class="nb-picker-icon" style="background:var(--nb-picker-text-bg)"><MdIcon icon="title" /></div>
        <span>{$tr("editor.objectpicker.text")}</span>
      </button>
      <button class="nb-picker-item" onclick={() => pickAndClose("line")}>
        <div class="nb-picker-icon" style="background:var(--nb-picker-line-bg)"><MdIcon icon="remove" /></div>
        <span>{$tr("editor.objectpicker.line")}</span>
      </button>
      <button class="nb-picker-item" onclick={() => pickAndClose("rectangle")}>
        <div class="nb-picker-icon" style="background:var(--nb-picker-rect-bg)"><MdIcon icon="crop_square" /></div>
        <span>{$tr("editor.objectpicker.rectangle")}</span>
      </button>
      <button class="nb-picker-item" onclick={() => pickAndClose("circle")}>
        <div class="nb-picker-icon" style="background:var(--nb-picker-circle-bg)"><MdIcon icon="radio_button_unchecked" /></div>
        <span>{$tr("editor.objectpicker.circle")}</span>
      </button>
      <button class="nb-picker-item" onclick={() => pickAndClose("image")}>
        <div class="nb-picker-icon" style="background:var(--nb-picker-image-bg)"><MdIcon icon="image" /></div>
        <span>{$tr("editor.objectpicker.image")}</span>
      </button>
      <button class="nb-picker-item" onclick={() => pickAndClose("qrcode")}>
        <div class="nb-picker-icon" style="background:var(--nb-picker-qr-bg)"><MdIcon icon="qr_code_2" /></div>
        <span>{$tr("editor.objectpicker.qrcode")}</span>
      </button>
      <button class="nb-picker-item" onclick={() => pickAndClose("barcode")}>
        <div class="nb-picker-icon" style="background:var(--nb-picker-barcode-bg)"><MdIcon icon="view_week" /></div>
        <span>{$tr("editor.objectpicker.barcode")}</span>
      </button>
      <div class="nb-picker-item">
        <div class="nb-picker-icon" style="background:var(--nb-picker-zpl-bg)"><MdIcon icon="description" /></div>
        <ZplImportButton {labelProps} onImageReady={zplImageReady} text={$tr("editor.import.zpl")} />
      </div>
    </div>
  </div>
</div>

<style>
  .nb-object-picker {
    width: 100vw;
    max-width: 450px;
  }

  .nb-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 8px;
  }

  .nb-close-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: var(--nb-text-secondary);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nb-close-btn:hover {
    background: var(--nb-surface-alt);
    color: var(--nb-text);
  }

  .nb-picker-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 0 8px 8px;
  }

  .nb-picker-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid var(--nb-border);
    background: var(--nb-surface);
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
    font-size: 13px;
    font-weight: 500;
    color: var(--nb-text);
  }

  .nb-picker-item:hover {
    border-color: var(--nb-primary);
    background: var(--nb-primary-light);
  }

  .nb-picker-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--nb-text);
  }

  .nb-picker-item :global(button) {
    background: none;
    border: none;
    padding: 0;
    color: var(--nb-text);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }
</style>
