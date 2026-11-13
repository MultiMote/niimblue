<script lang="ts">
  import { type LabelUnit, type LabelProps, type OjectType } from "$/types";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import ZplDialog from "$/components/dialogs/ZplDialog.svelte";
  import PdfImportButton from "$/components/designer-controls/PdfImportButton.svelte";
  import AppModal from "$/components/basic/AppModal.svelte";
  import type { CustomCanvas } from "$/fabric-object/custom_canvas";

  interface Props {
    canvas: CustomCanvas;
    labelProps: LabelProps;
    onSubmit: (i: OjectType) => void;
    pdfImageReady: (img: HTMLCanvasElement) => void;
    onZplObjectsImported?: () => void;
    onZplLabelSize?: (size: { width: number; height: number, unit: LabelUnit }) => void;
    onClose?: () => void;
  }

  let { onSubmit, labelProps, pdfImageReady, canvas, onZplObjectsImported, onZplLabelSize, onClose }: Props = $props();
  let modalRef: AppModal;
  let zplDialogOpen = $state(false);

  const onClick = (i: OjectType) => {
    modalRef.hide();
    onSubmit(i);
  };

  const pdfReady = (img: HTMLCanvasElement) => {
    modalRef.hide();
    pdfImageReady(img);
  };
</script>

<AppModal title={$tr("editor.objectpicker.title")} {onClose} bind:this={modalRef}>
  <button class="btn me-1" onclick={() => onClick("text")}>
    <MdIcon icon="title" />
    {$tr("editor.objectpicker.text")}
  </button>
  <button class="btn me-1" onclick={() => onClick("line")}>
    <MdIcon icon="remove" />
    {$tr("editor.objectpicker.line")}
  </button>
  <button class="btn me-1" onclick={() => onClick("rectangle")}>
    <MdIcon icon="crop_square" />
    {$tr("editor.objectpicker.rectangle")}
  </button>
  <button class="btn me-1" onclick={() => onClick("circle")}>
    <MdIcon icon="radio_button_unchecked" />
    {$tr("editor.objectpicker.circle")}
  </button>

  <button class="btn me-1" onclick={() => onClick("image")}>
    <MdIcon icon="image" />
    {$tr("editor.objectpicker.image")}
  </button>
  <button class="btn me-1" onclick={() => onClick("qrcode")}>
    <MdIcon icon="qr_code_2" />
    {$tr("editor.objectpicker.qrcode")}
  </button>
  <button class="btn me-1" onclick={() => onClick("aruco")}>
    <MdIcon icon="grid_on" />
    {$tr("editor.objectpicker.aruco")}
  </button>
  <button class="btn me-1" onclick={() => onClick("barcode")}>
    <MdIcon icon="view_week" />
    {$tr("editor.objectpicker.barcode")}
  </button>

  <button class="btn me-1" type="button" onclick={() => (zplDialogOpen = true)} title={$tr("editor.import.zpl")}>
    <MdIcon icon="code" />
    {$tr("editor.import.zpl")}
  </button>
  <PdfImportButton {labelProps} onImageReady={pdfReady} />
</AppModal>

{#if zplDialogOpen}
  <ZplDialog
    {canvas}
    onObjectsImported={onZplObjectsImported}
    onLabelSize={onZplLabelSize}
    onClose={() => (zplDialogOpen = false)} />
{/if}
