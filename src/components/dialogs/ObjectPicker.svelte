<script lang="ts">
  import { type LabelProps, type OjectType } from "$/types";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import ZplImportButton from "$/components/designer-controls/ZplImportButton.svelte";
  import PdfImportButton from "$/components/designer-controls/PdfImportButton.svelte";
  import AppModal from "$/components/basic/AppModal.svelte";

  interface Props {
    onSubmit: (i: OjectType) => void;
    labelProps: LabelProps;
    zplImageReady: (img: Blob) => void;
    pdfImageReady: (img: HTMLCanvasElement) => void;
    onClose?: () => void;
  }

  let { onSubmit, labelProps, zplImageReady, pdfImageReady, onClose }: Props = $props();
  let modalRef: AppModal;

  const onClick = (i: OjectType) => {
    modalRef.hide();
    onSubmit(i);
  };

  const zplReady = (img: Blob) => {
    modalRef.hide();
    zplImageReady(img);
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

  <ZplImportButton {labelProps} onImageReady={zplReady} />
  <PdfImportButton {labelProps} onImageReady={pdfReady} />
</AppModal>
