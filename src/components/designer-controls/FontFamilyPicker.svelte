<script lang="ts">
  import { onMount } from "svelte";
  import { OBJECT_DEFAULTS_TEXT } from "$/defaults";
  import { tr } from "$/utils/i18n";
  import { Toasts } from "$/utils/toasts";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import { fontCache, userFonts } from "$/stores";
  import FontsMenu from "$/components/designer-controls/FontsMenu.svelte";

  interface Props {
    editRevision?: number;
    value: string;
    valueUpdated: (v: string) => void;
  }

  let { value, valueUpdated, editRevision }: Props = $props();

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

<div class="input-group flex-nowrap input-group-sm font-family-picker">
  <span class="input-group-text" title={$tr("params.text.font_family")}>
    <MdIcon icon="text_format" />
  </span>

  <input
    type="text"
    class="form-control font-family-input"
    data-ver={editRevision}
    {value}
    oninput={(e) => valueUpdated(e.currentTarget.value)} />

  <!-- svelte-ignore a11y_consider_explicit_label -->
  <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown"></button>

  <div class="dropdown-menu">
    {#if $userFonts.length > 0}
      <h6 class="dropdown-header">{$tr("params.text.user_fonts")}</h6>
      {#each $userFonts as font (font.family)}
        <button
          class="dropdown-item"
          style="font-family: {font.family}"
          type="button"
          onclick={() => valueUpdated(font.family)}>
          {font.family}
        </button>
      {/each}
    {/if}

    {#if $fontCache.length > 0}
      <h6 class="dropdown-header">{$tr("params.text.system_fonts")}</h6>
      {#each $fontCache as family (family)}
        <button
          class="dropdown-item"
          style="font-family: {family}"
          type="button"
          onclick={() => valueUpdated(family)}>
          {family}
        </button>
      {/each}
    {/if}

    {#if fontQuerySupported}
      <div class="dropdown-divider"></div>
      <button class="dropdown-item load-system-fonts" type="button" onclick={getSystemFonts}>
        <MdIcon icon="refresh" /> {$tr("params.text.fetch_fonts")}
      </button>
    {/if}
  </div>

  <FontsMenu />
</div>

<style>
  .font-family-picker {
    width: unset;
  }

  .font-family-input {
    width: 14em;
  }

  .dropdown-menu {
    max-height: 240px;
    overflow-y: auto;
  }

  .load-system-fonts {
    color: var(--bs-primary);
  }
</style>
