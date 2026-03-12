<script lang="ts">
  import type { LabelProps } from "$/types";
  import { FileUtils } from "$/utils/file_utils";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { Toasts } from "$/utils/toasts";
  import { tr } from "$/utils/i18n";

  interface Props {
    labelProps: LabelProps;
    onImageReady: (img: HTMLCanvasElement) => void;
  }

  let { labelProps, onImageReady }: Props = $props();
  let importState = $state<"idle" | "processing" | "error">("idle");

  const onImportClicked = async () => {
    const files = await FileUtils.pickFileAsync("pdf", false);
    const file = files[0];

    importState = "processing";

    try {
      const url = await FileUtils.blobToDataUrl(file);

      // Dynamic pdfjs import to avoid loading it unnecessarily, as it's quite large and only used for PDF import
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).href;

      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const el: HTMLCanvasElement = document.createElement("canvas");
      el.width = labelProps.size.width;
      el.height = labelProps.size.height;

      const pdfScale = labelProps.size.width / page.getViewport({ scale: 1 }).width;

      const viewport = page.getViewport({ scale: pdfScale });
      el.height = viewport.height;

      const renderTask = page.render({
        canvas: el,
        viewport,
      });

      await renderTask.promise;

      onImageReady(el);

      importState = "idle";
    } catch (e) {
      importState = "error";
      Toasts.error(e);
    }
  };
</script>

<button class="btn btn-sm" onclick={onImportClicked}>
  <MdIcon icon="receipt_long" />

  {$tr("editor.import.pdf")}

  {#if importState === "processing"}
    <MdIcon icon="hourglass_top" />
  {:else if importState === "error"}
    <MdIcon icon="warning" class="text-warning" />
  {/if}
</button>
