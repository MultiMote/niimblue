<script lang="ts">
  import { onMount } from "svelte";
  import { OBJECT_DEFAULTS_TEXT } from "$/defaults";
  import { tr } from "$/utils/i18n";
  import { Toasts } from "$/utils/toasts";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import { fontCache } from "$/stores";
  import { bundledFonts, bundledFontFamilies, type BundledFont } from "$/styles/bundled-fonts";

  interface Props {
    value: string;
    valueUpdated: (v: string) => void;
  }

  let { value, valueUpdated }: Props = $props();

  let fontQuerySupported = typeof queryLocalFonts !== "undefined";
  let isOpen = $state(false);
  let search = $state("");
  let pickerRef: HTMLDivElement;

  // Track displayed value locally to ensure reactivity
  let displayValue = $derived(value);

  const categoryLabels: Record<string, string> = {
    "sans-serif": "Sans Serif",
    "serif": "Serif",
    "monospace": "Monospace",
    "display": "Display",
    "handwriting": "Handwriting",
    "system": "System",
  };

  // Build a lookup map for bundled font categories
  const bundledMap = new Map<string, BundledFont>();
  bundledFonts.forEach(f => bundledMap.set(f.family, f));

  const getCategory = (font: string): string => {
    return bundledMap.get(font)?.category ?? "system";
  };

  const hasCyrillic = (font: string): boolean => {
    return bundledMap.get(font)?.cyrillic === true;
  };

  const filteredFonts = $derived(() => {
    const q = search.toLowerCase().trim();
    const list = $fontCache.length > 1 ? $fontCache : [];
    if (!q) return list;
    return list.filter(f => f.toLowerCase().includes(q));
  });

  const groupedFonts = $derived(() => {
    const fonts = filteredFonts();
    const groups: Record<string, string[]> = {};
    for (const font of fonts) {
      const cat = getCategory(font);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(font);
    }
    return groups;
  });

  const selectFont = (font: string) => {
    valueUpdated(font);
    isOpen = false;
    search = "";
  };

  const toggle = () => {
    isOpen = !isOpen;
    if (isOpen) search = "";
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (pickerRef && !pickerRef.contains(e.target as Node)) {
      isOpen = false;
      search = "";
    }
  };

  const getSystemFonts = async () => {
    try {
      const fonts = await queryLocalFonts();
      const systemFonts = new Set(fonts.map((f: FontData) => f.family));
      const allFonts = new Set([OBJECT_DEFAULTS_TEXT.fontFamily, ...bundledFontFamilies, ...systemFonts]);
      const fontListSorted = [...allFonts].sort();
      fontCache.update(() => fontListSorted);
      LocalStoragePersistence.saveCachedFonts(fontListSorted);
    } catch (e) {
      Toasts.error(e);
    }
  };

  onMount(() => {
    const allFonts = new Set([OBJECT_DEFAULTS_TEXT.fontFamily, ...bundledFontFamilies]);
    try {
      let stored = LocalStoragePersistence.loadCachedFonts();
      if (stored.length > 0) {
        stored.forEach(f => allFonts.add(f));
      }
    } catch (e) {
      Toasts.error(e);
    }
    fontCache.update(() => [...allFonts].sort());

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  });
</script>

<div class="nb-font-picker" bind:this={pickerRef}>
  <button class="nb-font-trigger" onclick={toggle} title={$tr("params.text.font_family")}>
    <MdIcon icon="text_format" />
    <span class="nb-font-current" style="font-family: '{displayValue}'">{displayValue}</span>
    <MdIcon icon={isOpen ? "expand_less" : "expand_more"} />
  </button>

  {#if isOpen}
    <div class="nb-font-dropdown">
      <div class="nb-font-search-row">
        <!-- svelte-ignore a11y_autofocus -->
        <input
          type="text"
          class="nb-font-search"
          placeholder="Cerca font..."
          bind:value={search}
          autofocus />
        {#if fontQuerySupported}
          <button class="nb-font-refresh" onclick={getSystemFonts} title={$tr("params.text.fetch_fonts")}>
            <MdIcon icon="refresh" />
          </button>
        {/if}
      </div>
      <div class="nb-font-list">
        {#each Object.entries(groupedFonts()) as [category, fonts] (category)}
          <div class="nb-font-category">{categoryLabels[category] ?? category}</div>
          {#each fonts as font (font)}
            <button
              class="nb-font-item"
              class:active={font === displayValue}
              onclick={() => selectFont(font)}>
              <span class="nb-font-preview" style="font-family: '{font}'">{font}</span>
              <span class="nb-font-badges">
                {#if hasCyrillic(font)}
                  <span class="nb-font-badge cyrillic">кир</span>
                {/if}
                {#if font === displayValue}
                  <MdIcon icon="check" />
                {/if}
              </span>
            </button>
          {/each}
        {/each}
        {#if filteredFonts().length === 0}
          <div class="nb-font-empty">Nessun font trovato</div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .nb-font-picker {
    position: relative;
    flex: 1;
    min-width: 120px;
  }

  .nb-font-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 4px 8px;
    background: var(--nb-surface-alt);
    border: 1px solid var(--nb-border);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--nb-text);
    transition: border-color 0.15s;
  }

  .nb-font-trigger:hover {
    border-color: var(--nb-primary);
  }

  .nb-font-current {
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
  }

  .nb-font-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: var(--nb-surface-raised);
    border: 1px solid var(--nb-border);
    border-radius: 10px;
    box-shadow: var(--nb-shadow-lg);
    z-index: 1060;
    overflow: hidden;
    min-width: 250px;
  }

  .nb-font-search-row {
    display: flex;
    gap: 4px;
    padding: 8px;
    border-bottom: 1px solid var(--nb-border);
  }

  .nb-font-search {
    flex: 1;
    border: 1px solid var(--nb-border);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
    outline: none;
    background: var(--nb-surface);
    color: var(--nb-text);
  }

  .nb-font-search:focus {
    border-color: var(--nb-primary);
  }

  .nb-font-refresh {
    background: none;
    border: 1px solid var(--nb-border);
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    color: var(--nb-text-secondary);
  }

  .nb-font-list {
    max-height: 300px;
    overflow-y: auto;
    padding: 4px;
  }

  .nb-font-category {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--nb-text-tertiary);
    padding: 8px 10px 4px;
  }

  .nb-font-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 10px;
    border: none;
    background: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.1s;
    color: var(--nb-text);
  }

  .nb-font-item:hover {
    background: var(--nb-primary-light);
  }

  .nb-font-item.active {
    background: var(--nb-primary-light);
    color: var(--nb-primary);
  }

  .nb-font-badges {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .nb-font-badge {
    font-size: 9px;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .nb-font-badge.cyrillic {
    background: rgba(139, 92, 246, 0.15);
    color: #A78BFA;
  }

  .nb-font-preview {
    font-size: 15px;
    line-height: 1.3;
  }

  .nb-font-empty {
    padding: 16px;
    text-align: center;
    color: var(--nb-text-tertiary);
    font-size: 13px;
  }
</style>
