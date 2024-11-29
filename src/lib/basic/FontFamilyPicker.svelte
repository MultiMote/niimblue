<script lang="ts">
  import { onMount } from "svelte";
  import { OBJECT_DEFAULTS_TEXT } from "../../defaults";
  import { tr } from "../../utils/i18n";
  import { Toasts } from "../../utils/toasts";
  import MdIcon from "./MdIcon.svelte";
  import { LocalStoragePersistence } from "../../utils/persistence";
  import { fontCache } from "../../stores";

  export let value: string;
  export let valueUpdated: (v: string) => void;

  let fontQuerySupported = typeof queryLocalFonts !== "undefined";

  const getSystemFonts = async () => {
    try {
      const fonts = await queryLocalFonts();
      const fontListSorted = [OBJECT_DEFAULTS_TEXT.fontFamily, ...new Set(fonts.map((f: FontData) => f.family))].sort();
      fontCache.update(() => fontListSorted);
      LocalStoragePersistence.saveCachedFonts(fontListSorted);
    } catch (e) {
      Toasts.error(e);
    }
  };

  onMount(() => {
    try {
      let stored = LocalStoragePersistence.loadCachedFonts();
      if (stored.length > 0) {
        fontCache.update(() => stored);
      }
    } catch (e) {
      Toasts.error(e);
    }
  });
</script>

<div class="input-group flex-nowrap input-group-sm font-family">
  <span class="input-group-text" title={$tr("params.text.font_family")}>
    <MdIcon icon="text_format" />
  </span>
  {#if fontQuerySupported}
    <select class="form-select" {value} on:change={(e) => valueUpdated(e.currentTarget.value)}>
      {#each $fontCache as font}
        <option value={font} style="font-family: {font}">{font}</option>
      {/each}
    </select>
    <button class="btn btn-secondary" on:click={getSystemFonts} title={$tr("params.text.fetch_fonts")}>
      <MdIcon icon="refresh" />
    </button>
  {:else}
    <input type="text" class="form-control" {value} on:input={(e) => valueUpdated(e.currentTarget.value)} />
  {/if}
</div>

<style>
  .font-family {
    width: 16em;
  }
</style>
