<script lang="ts">
  import { type LabelProps, type OjectType } from "$/types";
  import { tr, type TranslationKey } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import ZplImportButton from "$/components/designer-controls/ZplImportButton.svelte";
  import PdfImportButton from "$/components/designer-controls/PdfImportButton.svelte";
  import type { MaterialIcon } from "$/styles/mdi_icons";
  import type { CustomCanvas } from "$/fabric-object/custom_canvas";

  interface Props {
    onSubmit: (i: OjectType) => void;
    labelProps: LabelProps;
    zplImageReady: (img: Blob) => void;
    pdfImageReady: (img: HTMLCanvasElement) => void;
    variant?: "dropdown" | "rail";
    canvas?: CustomCanvas;
    onZplObjectsImported?: () => void;
    onZplLabelSize?: (size: { width: number; height: number }) => void;
  }

  let { onSubmit, labelProps, zplImageReady, pdfImageReady, variant = "dropdown", canvas, onZplObjectsImported, onZplLabelSize }: Props =
    $props();

  const tools: { type: OjectType; icon: MaterialIcon; key: TranslationKey }[] = [
    { type: "text", icon: "title", key: "editor.objectpicker.text" },
    { type: "line", icon: "remove", key: "editor.objectpicker.line" },
    { type: "rectangle", icon: "crop_square", key: "editor.objectpicker.rectangle" },
    { type: "circle", icon: "radio_button_unchecked", key: "editor.objectpicker.circle" },
    { type: "image", icon: "image", key: "editor.objectpicker.image" },
    { type: "qrcode", icon: "qr_code_2", key: "editor.objectpicker.qrcode" },
    { type: "barcode", icon: "view_week", key: "editor.objectpicker.barcode" },
    { type: "aruco", icon: "grid_on", key: "editor.objectpicker.aruco" },
  ];
</script>

{#if variant === "rail"}
  {#each tools as tool (tool.type)}
    <button class="tool-btn" type="button" title={$tr(tool.key)} onclick={() => onSubmit(tool.type)}>
      <MdIcon icon={tool.icon} />
      <span class="tool-btn-label">
        {#if tool.type === "rectangle"}
          {$tr("editor.rail.rectangle")}
        {:else if tool.type === "qrcode"}
          {$tr("editor.rail.qrcode")}
        {:else}
          {$tr(tool.key)}
        {/if}
      </span>
    </button>
  {/each}
  <div class="tool-imports">
    <ZplImportButton {labelProps} {canvas} onImageReady={zplImageReady} onObjectsImported={onZplObjectsImported} onLabelSize={onZplLabelSize} />
    <PdfImportButton {labelProps} onImageReady={pdfImageReady} />
  </div>
{:else}
  <div class="dropdown">
    <button class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
      <MdIcon icon="format_shapes" />
      <MdIcon icon="add" />
    </button>

    <div class="dropdown-menu">
      <h6 class="dropdown-header">{$tr("editor.objectpicker.title")}</h6>
      <div class="p-3">
        {#each tools as tool (tool.type)}
          <button class="btn me-1" onclick={() => onSubmit(tool.type)}>
            <MdIcon icon={tool.icon} />
            {$tr(tool.key)}
          </button>
        {/each}

        <ZplImportButton {labelProps} {canvas} onImageReady={zplImageReady} onObjectsImported={onZplObjectsImported} onLabelSize={onZplLabelSize} />

        <PdfImportButton {labelProps} onImageReady={pdfImageReady} />
      </div>
    </div>
  </div>
{/if}

<style>
  .dropdown-menu {
    width: 100vw;
    max-width: 450px;
  }

  .tool-imports {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-top: 0.25rem;
  }

  @media (max-width: 960px) {
    .tool-imports {
      flex-direction: row;
      padding-top: 0;
      gap: 0.1rem;
    }
  }
</style>
