<script lang="ts">
  import type { LabelProps } from "../../types";
  import { FileUtils } from "../../utils/file_utils";
  import MdIcon from "../basic/MdIcon.svelte";

  export let text: string;
  export let labelProps: LabelProps;
  export let onImageReady: (img: Blob) => void;
  let state: "idle" | "processing" | "error" = "idle";

  const onImportClicked = async () => {
    const mmToInchCoeff = 25.4;
    const dpmm = 8; // todo: may vary, make it configurable
    const widthInches = labelProps.size.width / dpmm / mmToInchCoeff;
    const heightInches = labelProps.size.height / dpmm / mmToInchCoeff;

    const contents = await FileUtils.pickAndReadTextFile("zpl");

    state = "processing";

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
        state = "idle";
      } else {
        state = "error";
      }
    } catch (e) {
      state = "error";
      console.error(e);
    }
  };
</script>

<button class="btn btn-sm" on:click={onImportClicked}>
  <MdIcon icon="receipt_long" />
  {text}
  {#if state === "processing"}
    <MdIcon icon="hourglass_top" />
  {:else if state === "error"}
    <MdIcon icon="warning" class="text-warning" />
  {/if}
</button>
