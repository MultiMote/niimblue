<script lang="ts">
  import { fabric } from "fabric";
  import FaIcon from "./FaIcon.svelte";

  export let selectedObject: fabric.Object;
  export let valueUpdated: () => void;

  const DEFAULT_FONT = "Noto Sans Variable";

  let selectedText: fabric.IText | undefined;
  let fontFamilies: string[] = [DEFAULT_FONT];

  const toggleBold = () => {
    if (selectedText!.fontWeight === "bold") {
      selectedText!.fontWeight = "normal";
    } else {
      selectedText!.fontWeight = "bold";
    }

    commit();
  };

  const setAlign = (align: "left" | "center" | "right") => {
    selectedText!.textAlign = align;
    commit();
  };

  const fontSizeUp = () => {
    selectedText!.fontSize! += selectedText!.fontSize! > 40 ? 10 : 2;
    commit();
  };
  const fontSizeDown = () => {
    selectedText!.fontSize! -= selectedText!.fontSize! > 40 ? 10 : 2;
    commit();
  };

  const getFonts = async () => {
    try {
      const fonts = await queryLocalFonts();
      fontFamilies = [DEFAULT_FONT, ...new Set(fonts.map((f: FontData) => f.family))].sort();
      console.log(fontFamilies);
    } catch (e) {
      alert(e);
    }
  };

  const commit = () => {
    selectedText!.fontSize = Math.max(selectedText!.fontSize!, 1);
    valueUpdated();
  };

  $: {
    selectedText = selectedObject instanceof fabric.IText ? (selectedObject as fabric.IText) : undefined;
  }
</script>

{#if selectedText}
  <!-- <div class="d-flex flex-wrap gap-1"> -->
    <button
      title="Align text: Left"
      class="btn btn-sm {selectedText.textAlign === 'left' ? 'btn-secondary' : ''}"
      on:click={() => setAlign("left")}><FaIcon icon="align-left" /></button
    >
    <button
      title="Align text: Center"
      class="btn btn-sm {selectedText.textAlign === 'center' ? 'btn-secondary' : ''}"
      on:click={() => setAlign("center")}><FaIcon icon="align-center" /></button
    >
    <button
      title="Align text: Right"
      class="btn btn-sm {selectedText.textAlign === 'right' ? 'btn-secondary' : ''}"
      on:click={() => setAlign("right")}><FaIcon icon="align-right" /></button
    >
    <button class="btn btn-sm {selectedText.fontWeight === 'bold' ? 'btn-secondary' : ''}" on:click={toggleBold}>
      <FaIcon icon="bold" />
    </button>

    <div class="input-group flex-nowrap input-group-sm font-size">
      <span class="input-group-text" title="Font size"><FaIcon icon="text-height" /></span>
      <input
        type="number"
        min="1"
        max="999"
        step="2"
        class="form-control"
        bind:value={selectedText.fontSize}
        on:input={commit}
      />
      <button class="btn btn-secondary" on:click={fontSizeUp}
        ><span class="fa-layers">
          <FaIcon icon="font" />
          <FaIcon icon="caret-up" params={{ transform: { x: 10, y: -5, size: 12 } }} />
        </span></button
      >
      <button class="btn btn-secondary" on:click={fontSizeDown}
        ><span class="fa-layers">
          <FaIcon icon="font" />
          <FaIcon icon="caret-down" params={{ transform: { x: 10, y: -5, size: 12 } }} />
        </span></button
      >
    </div>

    <div class="input-group flex-nowrap input-group-sm">
      <span class="input-group-text" title="Line height"
        ><FaIcon icon="arrows-left-right-to-line" params={{ transform: { rotate: 90 } }} /></span
      >
      <input
        type="number"
        min="0.1"
        step="0.1"
        max="10"
        class="form-control"
        bind:value={selectedText.lineHeight}
        on:input={commit}
      />
    </div>

    <div class="input-group flex-nowrap input-group-sm font-family">
      <span class="input-group-text" title="Font family"><FaIcon icon="font" /></span>
      <!-- svelte-ignore missing-declaration -->
      {#if typeof queryLocalFonts !== "undefined"}
        <select class="form-select" bind:value={selectedText.fontFamily} on:change={commit}>
          {#each fontFamilies as font}
            <option value={font}>{font}</option>
          {/each}
        </select>
        <button class="btn btn-secondary" on:click={getFonts}>
          <FaIcon icon="rotate" />
        </button>
      {:else}
        <input type="text" class="form-control" bind:value={selectedText.fontFamily} on:input={commit} />
      {/if}
    </div>
  <!-- </div> -->
{/if}

<style>
  .input-group {
    width: 7em;
  }
  .font-size {
    width: 10em;
  }
  .font-family {
    width: 16em;
  }
</style>
