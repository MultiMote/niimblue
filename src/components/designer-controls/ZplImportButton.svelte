<script lang="ts">
  import type { LabelProps } from "$/types";
  import { FileUtils } from "$/utils/file_utils";
  import MdIcon from "$/components/basic/MdIcon.svelte";

  interface Props {
    text: string;
    labelProps: LabelProps;
    onImageReady: (img: Blob) => void;
  }

  let { text, labelProps, onImageReady }: Props = $props();
  let importState = $state<"idle" | "processing" | "error">("idle");

  const onImportClicked = async () => {
    const mmToInchCoeff = 25.4;
    const dpmm = 8; // todo: may vary, make it configurable
    const widthInches = labelProps.size.width / dpmm / mmToInchCoeff;
    const heightInches = labelProps.size.height / dpmm / mmToInchCoeff;

    const contents = await FileUtils.pickAndReadSingleTextFile("zpl");

    importState = "processing";

    try {
      const response = await fetch(
        `https://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${widthInches}x${heightInches}/0/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "image/png",
            "X-Quality": "bitonal",
          },
          body: contents,
        },
      );
      if (response.ok) {
        const img = await response.blob();
        onImageReady(img);
        importState = "idle";
      } else {
        importState = "error";
      }
    } catch (e) {
      importState = "error";
      console.error(e);
    }
  };
</script>

<button class="btn btn-sm" onclick={onImportClicked}>
  {text}
  {#if importState === "processing"}
    <MdIcon icon="hourglass_top" />
  {:else if importState === "error"}
    <MdIcon icon="warning" class="text-warning" />
  {/if}
</button>
