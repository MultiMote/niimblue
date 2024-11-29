<script context="module" lang="ts">
  export type ChangeValue = { family: string | undefined; size: number | undefined };
  export type ChangeEvent = { newValue: ChangeValue };
</script>

<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { tr } from "../../utils/i18n";
  import MdIcon from "./MdIcon.svelte";
  import { fontCache } from "../../stores";
  import type { Unsubscriber } from "svelte/motion";

  export let hasFamily: boolean = true;
  export let hasSize: boolean = true;
  export let family: string = "";
  export let size: number = 0;
  export let sizeMin: number = 1;
  export let sizeMax: number = 999;
  export let sizeStep: number = 2;

  const dispatch = createEventDispatcher<{
    change: ChangeEvent;
  }>();

  const fontQuerySupported = typeof queryLocalFonts !== "undefined";

  let loading = false;
  async function refreshFonts() {
    if (fontQuerySupported) {
      try {
        loading = true;
        fontCache.set(await queryLocalFonts());
      } finally {
        loading = false;
      }
    }
  }

  let families: Record<string, string> = {};
  function resetFamilyAndStyle() {
    if ($fontCache) {
      families = {
        "NotoSans-Regular": "Noto Sans - Regular",
        ...$fontCache.reduce(
          (pv, i) => {
            pv[i.postscriptName] = `${i.family} - ${i.style}`;
            return pv;
          },
          {} as typeof families,
        ),
      };
    } else {
      families = {
        [family]: family,
        "NotoSans-Regular": "Noto Sans - Regular",
      };
    }
  }

  function emitChange(newValue: Partial<ChangeValue>) {
    dispatch("change", {
      newValue: {
        ...{ family: family, size },
        ...newValue,
      },
    });
  }

  let unsubscriber: Unsubscriber;
  onMount(() => {
    resetFamilyAndStyle();
    unsubscriber = fontCache.subscribe(resetFamilyAndStyle);
  });
  onDestroy(() => unsubscriber());
</script>

{#if hasFamily}
  <div class="input-group flex-nowrap input-group-sm font-family">
    <span class="input-group-text" title={$tr("params.text.font_family")}>
      <MdIcon icon="text_format" />
    </span>
    {#if fontQuerySupported}
      <select class="form-select" value={family} on:change={(e) => emitChange({ family: e.currentTarget.value })}>
        {#each Object.keys(families).sort() as family}
          <option value={family} style="font-family: {family}">{families[family]}</option>
        {/each}
      </select>
      <button class="btn btn-secondary" title={$tr("params.text.fetch_fonts")} on:click={refreshFonts} disabled={loading}>
        <MdIcon icon="refresh" spin={loading} />
      </button>
    {:else}
      <input
        type="text"
        class="form-control"
        value={family}
        on:input={(e) => emitChange({ family: e.currentTarget.value })} />
    {/if}
  </div>
{/if}

{#if hasSize}
  <div class="input-group flex-nowrap input-group-sm font-size">
    <span class="input-group-text" title={$tr("params.text.font_size")}><MdIcon icon="format_size" /></span>
    <input
      type="number"
      class="form-control"
      min={sizeMin}
      max={sizeMax}
      step={sizeStep}
      value={size}
      on:input={(e) => emitChange({ size: e.currentTarget.valueAsNumber ?? 0 })} />
    <button
      class="btn btn-secondary"
      title={$tr("params.text.font_size.up")}
      on:click={() => emitChange({ size: Math.min(size > 40 ? Math.round(size * 1.1) : size + 2, sizeMax) })}>
      <MdIcon icon="text_increase" />
    </button>
    <button
      class="btn btn-secondary"
      title={$tr("params.text.font_size.down")}
      on:click={() => emitChange({ size: Math.max(size > 40 ? Math.round(size * 0.9) : size - 2, sizeMin) })}>
      <MdIcon icon="text_decrease" />
    </button>
  </div>
{/if}

<style>
  .input-group {
    width: 7em;
  }
  .font-size {
    width: 12em;
  }
  .font-family {
    width: 16em;
  }
</style>
