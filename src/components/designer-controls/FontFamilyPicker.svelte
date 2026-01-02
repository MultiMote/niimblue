<script lang="ts">
  import { onMount } from "svelte";
  import { OBJECT_DEFAULTS_TEXT } from "$/defaults";
  import { tr } from "$/utils/i18n";
  import { Toasts } from "$/utils/toasts";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import { fontCache } from "$/stores";

  interface Props {
    value: string;
    valueUpdated: (v: string) => void;
  }

  let { value, valueUpdated }: Props = $props();

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
        const uniqueFonts = new Set([OBJECT_DEFAULTS_TEXT.fontFamily, ...stored]);
        fontCache.update(() => [...uniqueFonts].sort());
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
  {#if $fontCache.length > 1}
    <select class="form-select" {value} onchange={(e) => valueUpdated(e.currentTarget.value)}>
      {#each $fontCache as font (font)}
        <option value={font} style="font-family: {font}">{font}</option>
      {/each}
    </select>
  {:else}
    <input type="text" class="form-control" {value} oninput={(e) => valueUpdated(e.currentTarget.value)} />
  {/if}

  {#if fontQuerySupported}
    <button class="btn btn-secondary" onclick={getSystemFonts} title={$tr("params.text.fetch_fonts")}>
      <MdIcon icon="refresh" />
    </button>
  {/if}
</div>

<style>
  .font-family {
    width: 16em;
  }
</style>
