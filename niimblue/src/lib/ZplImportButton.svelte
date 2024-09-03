<script lang="ts">
  import type { LabelProps } from "../types";
  import { FileUtils } from "../utils/file_utils";
  import FaIcon from "./FaIcon.svelte";

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
            "Accept": "image/png",
            "X-Quality": "bitonal",
          },
          body: contents,
        }
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

<button class="btn btn-secondary btn-sm" on:click={onImportClicked}
  >Import ZPL
  {#if state === "processing"}
    <FaIcon icon="sync" params={{ classes: ["fa-spin"] }}></FaIcon>
  {:else if state === "error"}
    <FaIcon icon="warning" params={{ classes: ["text-warning"] }}></FaIcon>
  {/if}
</button>
