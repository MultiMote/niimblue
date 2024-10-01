<script lang="ts">
  import { type LabelPreset, type LabelProps, type LabelUnit } from "../types";
  import LabelPresetsBrowser from "./LabelPresetsBrowser.svelte";
  import { printerMeta } from "../stores";
  import { tr } from "../utils/i18n";
  import { DEFAULT_LABEL_PRESETS } from "../defaults";
  import { onMount } from "svelte";
  import { Persistence } from "../utils/persistence";
  import type { PrintDirection } from "@mmote/niimbluelib";
  import MdIcon from "./MdIcon.svelte";

  export let labelProps: LabelProps;
  export let onChange: (newProps: LabelProps) => void;

  let labelPresets: LabelPreset[] = DEFAULT_LABEL_PRESETS;

  let title: string | undefined = "";
  let prevUnit: LabelUnit = "mm";
  let unit: LabelUnit = "mm";
  let dpmm = 8;
  let width = 0;
  let height = 0;
  let printDirection: PrintDirection = "left";
  let error: string = "";

  const onApply = () => {
    let newWidth = width;
    let newHeight = height;

    // mm to px
    if (unit === "mm") {
      newWidth *= dpmm;
      newHeight *= dpmm;
    }

    // limit min siz
    newWidth = newWidth < dpmm ? dpmm : newWidth;
    newHeight = newHeight < dpmm ? dpmm : newHeight;

    // width must me multiple of dpmm
    if (printDirection === "left") {
      newHeight -= newHeight % dpmm;
    } else {
      newWidth -= newWidth % dpmm;
    }

    onChange({
      printDirection: printDirection,
      size: {
        width: newWidth,
        height: newHeight,
      },
    });
  };

  const onLabelPresetSelected = (index: number) => {
    const preset = labelPresets[index];

    dpmm = preset.dpmm;
    prevUnit = preset.unit;
    unit = preset.unit;
    printDirection = preset.printDirection;
    width = preset.width;
    height = preset.height;
    title = preset.title ?? "";

    onApply();
  };

  const onLabelPresetDelete = (idx: number) => {
    const result = [...labelPresets];
    result.splice(idx, 1);
    labelPresets = result;
    Persistence.saveLabelPresets(labelPresets);
  };

  const onLabelPresetAdd = () => {
    const newPreset: LabelPreset = {
      dpmm,
      printDirection,
      unit,
      width,
      height,
      title
    };
    labelPresets = [...labelPresets, newPreset];
    Persistence.saveLabelPresets(labelPresets);
  };

  const onFlip = () => {
    let widthTmp = width;
    width = height;
    height = widthTmp;
    printDirection = printDirection === "top" ? "left" : "top";
  };

  const onUnitChange = () => {
    if (prevUnit === "mm" && unit === "px") {
      width = Math.floor(width * dpmm);
      height = Math.floor(height * dpmm);
    } else if (prevUnit === "px" && unit === "mm") {
      width = Math.floor(width / dpmm);
      height = Math.floor(height / dpmm);
    }
    prevUnit = unit;
  };

  const checkError = (props: LabelProps) => {
    error = "";

    if ($printerMeta !== undefined) {
      const headSide = props.printDirection == "left" ? props.size.height : props.size.width;

      if (headSide > $printerMeta.printheadPixels) {
        error += $tr("params.label.warning.width", "Label width is too big for your printer:") + " ";
        error += `(${headSide} > ${$printerMeta.printheadPixels})`;
        error += "\n";
      }

      if ($printerMeta.printDirection !== props.printDirection) {
        error += $tr("params.label.warning.direction", "Recommended direction for your printer:") + " ";
        if ($printerMeta.printDirection == "left") {
          error += $tr("params.label.direction.left", "Left");
        } else {
          error += $tr("params.label.direction.top", "Top");
        }
      }
    }
  };

  onMount(() => {
    const defaultPreset: LabelPreset = DEFAULT_LABEL_PRESETS[0];
    width = defaultPreset.width;
    height = defaultPreset.height;
    prevUnit = defaultPreset.unit;
    unit = defaultPreset.unit;
    printDirection = defaultPreset.printDirection;

    const savedPresets: LabelPreset[] = Persistence.loadLabelPresets();
    if (savedPresets !== null && Array.isArray(savedPresets) && savedPresets.length !== 0) {
      labelPresets = savedPresets;
    }
  });

  $: checkError(labelProps);
</script>

<div class="dropdown">
  <button class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
    <MdIcon icon="settings" />
  </button>
  <div class="dropdown-menu">
    <h6 class="dropdown-header">{$tr("params.label.dialog_title", "Label properties")}</h6>

    <div class="p-3">
      <div class="mb-3 {error ? 'cursor-help text-warning' : 'text-secondary'}" title={error}>
        {$tr("params.label.current", "Current parameters:")}
        {labelProps.size.width}x{labelProps.size.height}
        {$tr("params.label.px", "px")}
        {#if labelProps.printDirection === "top"}
          ({$tr("params.label.direction", "Print from")} {$tr("params.label.direction.top", "Top")})
        {:else if labelProps.printDirection === "left"}
          ({$tr("params.label.direction", "Print from")} {$tr("params.label.direction.left", "Left")})
        {/if}
      </div>

      <LabelPresetsBrowser
        class="mb-1"
        presets={labelPresets}
        onItemSelected={onLabelPresetSelected}
        onItemDelete={onLabelPresetDelete}
        onItemAdd={onLabelPresetAdd}
      />

      <div class="input-group flex-nowrap input-group-sm mb-3">
        <span class="input-group-text">{$tr("params.label.size", "Size")}</span>
        <input class="form-control" type="number" min="0" step={dpmm} bind:value={width} />
        <button class="btn btn-sm btn-secondary" on:click={onFlip}><MdIcon icon="swap_horiz" /></button>
        <input class="form-control" type="number" min="0" step={dpmm} bind:value={height} />
        <select class="form-select" bind:value={unit} on:change={onUnitChange}>
          <option value="mm"> {$tr("params.label.mm", "mm")}</option>
          <option value="px"> {$tr("params.label.px", "px")}</option>
        </select>
      </div>

      <div class="input-group flex-nowrap input-group-sm mb-3">
        <span class="input-group-text">{$tr("params.label.head_density", "Pixel density")}</span>
        <input class="form-control" type="number" min="1" bind:value={dpmm} />
        <span class="input-group-text cursor-help" title={$tr("params.label.head_density.help", "Calculation: DPI / 25.4")}
          >{$tr("params.label.dpmm", "dpmm")}</span
        >
      </div>

      <div class="input-group flex-nowrap input-group-sm mb-3">
        <span class="input-group-text">{$tr("params.label.direction", "Print from")}</span>
        <select class="form-select" bind:value={printDirection}>
          <option value="left"
            >{#if $printerMeta?.printDirection === "left"}✔{/if}
            {$tr("params.label.direction.left", "Left")}</option
          >
          <option value="top"
            >{#if $printerMeta?.printDirection === "top"}✔{/if}
            {$tr("params.label.direction.top", "Top")}</option
          >
        </select>
      </div>

      <div class="input-group flex-nowrap input-group-sm mb-3">
        <span class="input-group-text">{$tr("params.label.label_title", "Custom title")}</span>
        <input class="form-control" type="text" bind:value={title} />
      </div>


      <div class="text-end">
        <button class="btn btn-sm btn-secondary" on:click={onLabelPresetAdd}>{$tr("params.label.save_template", "Save as template")}</button>
        <button class="btn btn-sm btn-primary" on:click={onApply}>{$tr("params.label.apply", "Apply")}</button>
      </div>
    </div>
  </div>
</div>

<style>
  .dropdown-menu {
    min-width: 450px;
  }

  .cursor-help {
    cursor: help;
  }
</style>
