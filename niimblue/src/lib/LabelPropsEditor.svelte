<script lang="ts">
  import FaIcon from "./FaIcon.svelte";
  import { type LabelPreset, type LabelProps } from "../types";
  import LabelPresetsBrowser from "./LabelPresetsBrowser.svelte";
  import { icon } from "@fortawesome/fontawesome-svg-core";
  import { printerMeta } from "../stores";
  import { tr } from "../utils/i18n";

  export let labelProps: LabelProps;
  export let onChange: () => void;
  let dpmm = 8;
  let sizeMm: { width?: number; height?: number; dpmm: number } = { width: undefined, height: undefined, dpmm: 8 };

  const onChangePre = () => {
    labelProps.size.width = labelProps.size.width < dpmm ? dpmm : labelProps.size.width;
    labelProps.size.height = labelProps.size.height < dpmm ? dpmm : labelProps.size.height;

    if (labelProps.printDirection === "left") {
      labelProps.size.height -= labelProps.size.height % dpmm;
    } else {
      labelProps.size.width -= labelProps.size.width % dpmm;
    }
    onChange();
  };

  const onLabelPresetSelected = (preset: LabelPreset) => {
    labelProps.printDirection = preset.printDirection;
    labelProps.size.width = preset.width * preset.dpmm;
    labelProps.size.height = preset.height * preset.dpmm;

    onChangePre();
  };

  const onCalcSize = () => {
    if (sizeMm.height && sizeMm.width) {
      labelProps.size.width = sizeMm.width * sizeMm.dpmm;
      labelProps.size.height = sizeMm.height * sizeMm.dpmm;
    }
    onChangePre();
  };

  const onFlip = () => {
    let width = labelProps.size.width;
    labelProps.size.width = labelProps.size.height;
    labelProps.size.height = width;
    labelProps.printDirection = labelProps.printDirection === "top" ? "left" : "top";
    onChangePre();
  };
</script>

<div class="dropdown">
  <button class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
    <FaIcon icon="gear" />
  </button>
  <div class="dropdown-menu">
    <h6 class="dropdown-header">{$tr("params.label.title", "Label properties")}</h6>
    <div class="p-3">
      <LabelPresetsBrowser class="mb-1" onItemSelected={onLabelPresetSelected} />

      <div class="input-group flex-nowrap input-group-sm mb-3">
        <span class="input-group-text">{$tr("params.label.size", "Size")}</span>
        <input class="form-control" type="number" min="0" bind:value={sizeMm.width} on:change={onChangePre} />
        <span class="input-group-text">x</span>
        <input class="form-control" type="number" min="0" bind:value={sizeMm.height} on:change={onChangePre} />
        <span class="input-group-text">{$tr("params.label.mm", "mm")}</span>
        <input class="form-control" type="number" min="0" bind:value={sizeMm.dpmm} on:change={onChangePre} />
        <span class="input-group-text">{$tr("params.label.dpmm", "dpmm")}</span>
        <button class="btn btn-sm btn-primary" on:click={onCalcSize}>{$tr("params.label.calc", "Calc")}</button>
      </div>

      <div class="input-group flex-nowrap input-group-sm mb-3">
        <span class="input-group-text">{$tr("params.label.size", "Size")}</span>
        <input
          class="form-control"
          type="number"
          min="0"
          step={dpmm}
          bind:value={labelProps.size.width}
          on:change={onChangePre}
        />
        <button class="btn btn-sm btn-secondary" on:click={onFlip}><FaIcon icon="repeat" /></button>
        <input
          class="form-control"
          type="number"
          min="0"
          step={dpmm}
          bind:value={labelProps.size.height}
          on:change={onChangePre}
        />
        <span class="input-group-text">{$tr("params.label.px", "px")}</span>

        {#if $printerMeta !== undefined}
          {@const headSide = labelProps.printDirection == "left" ? labelProps.size.height : labelProps.size.width}
          {#if headSide > $printerMeta.printheadPixels}
            <span class="input-group-text text-warning" title="Label size is too big for your printer ({headSide} > {$printerMeta.printheadPixels})">
              <FaIcon icon="warning" />
            </span>
          {/if}
        {/if}
      </div>

      <div class="input-group flex-nowrap input-group-sm mb-3">
        <span class="input-group-text">{$tr("params.label.direction", "Print from")}</span>
        <select class="form-select" bind:value={labelProps.printDirection} on:change={onChangePre}>
          <option value="left"
            >{#if $printerMeta?.printDirection === "left"}✔{/if} {$tr("params.label.direction.left", "Left")}</option
          >
          <option value="top"
            >{#if $printerMeta?.printDirection === "top"}✔{/if} {$tr("params.label.direction.top", "Top")}</option
          >
        </select>
        {#if $printerMeta !== undefined && $printerMeta.printDirection !== labelProps.printDirection}
          <span
            class="input-group-text text-warning"
            title="Recommended direction for your printer is {labelProps.printDirection}"
          >
            <FaIcon icon="warning" />
          </span>
        {/if}
      </div>
      <!-- <button class="btn btn-sm btn-primary" on:click={onSubmit}>Update</button> -->
    </div>
  </div>
</div>

<style>
  .dropdown-menu {
    min-width: 450px;
  }
</style>
