<script lang="ts">
  import {
    LabelPresetSchema,
    type LabelPreset,
    type LabelProps,
    type LabelShape,
    type LabelSplit,
    type LabelUnit,
    type MirrorType,
    type TailPosition,
  } from "../types";
  import LabelPresetsBrowser from "./LabelPresetsBrowser.svelte";
  import { printerMeta } from "../stores";
  import { tr } from "../utils/i18n";
  import { DEFAULT_LABEL_PRESETS } from "../defaults";
  import { onMount, tick } from "svelte";
  import { LocalStoragePersistence } from "../utils/persistence";
  import type { PrintDirection } from "@mmote/niimbluelib";
  import MdIcon from "./basic/MdIcon.svelte";
  import { Toasts } from "../utils/toasts";
  import { FileUtils } from "../utils/file_utils";
  import { z } from "zod";
  import DpiSelector from "./basic/DpiSelector.svelte";

  export let labelProps: LabelProps;
  export let onChange: (newProps: LabelProps) => void;

  const tailPositions: TailPosition[] = ["right", "bottom", "left", "top"];
  const printDirections: PrintDirection[] = ["left", "top"];
  const labelShapes: LabelShape[] = ["rect", "rounded_rect", "circle"];
  const labelSplits: LabelSplit[] = ["none", "vertical", "horizontal"];
  const mirrorTypes: MirrorType[] = ["none", "flip", "copy"];

  let labelPresets: LabelPreset[] = DEFAULT_LABEL_PRESETS;

  let title: string | undefined = "";
  let prevUnit: LabelUnit = "mm";
  let unit: LabelUnit = "mm";
  let dpmm = 8;
  let width = 0;
  let height = 0;
  let printDirection: PrintDirection = "left";
  let shape: LabelShape = "rect";
  let split: LabelSplit = "none";
  let splitParts: number = 2;
  let tailLength: number = 0;
  let tailPos: TailPosition = "right";
  let mirror: MirrorType = "none";
  let error: string = "";

  const onApply = () => {
    let newWidth = width;
    let newHeight = height;
    let newTailLength = tailLength;

    // mm to px
    if (unit === "mm") {
      newWidth *= dpmm;
      newHeight *= dpmm;
      newTailLength *= dpmm;
    }

    // limit min size
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
        width: Math.floor(newWidth),
        height: Math.floor(newHeight),
      },
      shape,
      split,
      splitParts,
      tailPos,
      tailLength: Math.floor(newTailLength),
      mirror,
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
    shape = preset.shape ?? "rect";
    split = preset.split ?? "none";
    splitParts = preset.splitParts ?? 2;
    tailPos = preset.tailPos ?? "right";
    tailLength = preset.tailLength ?? 0;
    mirror = preset.mirror ?? "none";

    onApply();
  };

  const onLabelPresetDelete = (idx: number) => {
    const result = [...labelPresets];
    result.splice(idx, 1);
    labelPresets = result;
    LocalStoragePersistence.saveLabelPresets(labelPresets);
  };

  const onLabelPresetAdd = () => {
    const newPreset: LabelPreset = {
      dpmm,
      printDirection,
      unit,
      width,
      height,
      title,
      shape,
      split,
      splitParts,
      tailPos,
      tailLength,
      mirror,
    };
    const newPresets = [...labelPresets, newPreset];
    try {
      LocalStoragePersistence.saveLabelPresets(newPresets);
      labelPresets = newPresets;
    } catch (e) {
      Toasts.zodErrors(e, "Presets save error:");
    }
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
      tailLength = Math.floor(tailLength * dpmm);
    } else if (prevUnit === "px" && unit === "mm") {
      width = Math.floor(width / dpmm);
      height = Math.floor(height / dpmm);
      tailLength = Math.floor(tailLength / dpmm);
    }
    prevUnit = unit;
  };

  const checkError = (props: LabelProps) => {
    error = "";

    if ($printerMeta !== undefined) {
      const headSize = props.printDirection == "left" ? props.size.height : props.size.width;

      if (headSize > $printerMeta.printheadPixels) {
        error += $tr("params.label.warning.width") + " ";
        error += `(${headSize} > ${$printerMeta.printheadPixels})`;
        error += "\n";
      }

      if ($printerMeta.printDirection !== props.printDirection) {
        error += $tr("params.label.warning.direction") + " ";
        if ($printerMeta.printDirection == "left") {
          error += $tr("params.label.direction.left");
        } else {
          error += $tr("params.label.direction.top");
        }
      }
    }
  };

  const fillWithCurrentParams = () => {
    prevUnit = "px";
    width = labelProps.size.width;
    height = labelProps.size.height;
    printDirection = labelProps.printDirection;
    shape = labelProps.shape ?? "rect";
    split = labelProps.split ?? "none";
    splitParts = labelProps.splitParts ?? 2;
    tailPos = labelProps.tailPos ?? "right";
    tailLength = labelProps.tailLength ?? 0;
    mirror = labelProps.mirror ?? "none";
    onUnitChange();
  };

  const onImportClicked = async () => {
    const contents = await FileUtils.pickAndReadTextFile("json");
    const rawData = JSON.parse(contents);

    if (!confirm($tr("params.label.warning.import"))) {
      return;
    }

    try {
      const presets = z.array(LabelPresetSchema).parse(rawData);
      LocalStoragePersistence.saveLabelPresets(presets);
      labelPresets = presets;
    } catch (e) {
      Toasts.zodErrors(e, "Presets load error:");
    }
  };

  const onExportClicked = () => {
    try {
      FileUtils.saveLabelPresetsAsJson(labelPresets);
    } catch (e) {
      Toasts.zodErrors(e, "Presets save error:");
    }
  };

  onMount(() => {
    const defaultPreset: LabelPreset = DEFAULT_LABEL_PRESETS[0];
    width = defaultPreset.width;
    height = defaultPreset.height;
    prevUnit = defaultPreset.unit;
    unit = defaultPreset.unit;
    printDirection = defaultPreset.printDirection;
    shape = defaultPreset.shape ?? "rect";
    split = defaultPreset.split ?? "none";
    tailPos = defaultPreset.tailPos ?? "right";
    tailLength = defaultPreset.tailLength ?? 0;
    mirror = defaultPreset.mirror ?? "none";

    try {
      const savedPresets: LabelPreset[] | null = LocalStoragePersistence.loadLabelPresets();
      if (savedPresets !== null) {
        labelPresets = savedPresets;
      }
    } catch (e) {
      Toasts.zodErrors(e, "Presets load error:");
    }

    tick().then(() => fillWithCurrentParams());
  });

  $: checkError(labelProps);
  $: if (shape === "circle" && split !== "none") split = "none";
  $: if (split === "none") tailLength = 0;
  $: if (mirror === "flip" && splitParts !== 2) mirror = "copy";
  $: if (tailLength < 0) tailLength = 0;
</script>

<div class="dropdown">
  <button class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
    <MdIcon icon="settings" />
  </button>
  <div class="dropdown-menu">
    <h6 class="dropdown-header">{$tr("params.label.menu_title")}</h6>

    <div class="px-3">
      <div class="p-1">
        <button class="btn btn-sm btn-outline-secondary" on:click={onImportClicked}>
          <MdIcon icon="data_object" />
          {$tr("params.label.import")}
        </button>
        <button class="btn btn-sm btn-outline-secondary" on:click={onExportClicked}>
          <MdIcon icon="data_object" />
          {$tr("params.label.export")}
        </button>
      </div>
      <div class="mb-3 {error ? 'cursor-help text-warning' : 'text-secondary'}" title={error}>
        {$tr("params.label.current")}
        {labelProps.size.width}x{labelProps.size.height}
        {$tr("params.label.px")}
        {#if labelProps.printDirection === "top"}
          ({$tr("params.label.direction")} {$tr("params.label.direction.top")})
        {:else if labelProps.printDirection === "left"}
          ({$tr("params.label.direction")} {$tr("params.label.direction.left")})
        {/if}
        <button class="btn btn-sm" on:click={fillWithCurrentParams}><MdIcon icon="arrow_downward" /></button>
      </div>

      <LabelPresetsBrowser
        class="mb-1"
        presets={labelPresets}
        onItemSelected={onLabelPresetSelected}
        onItemDelete={onLabelPresetDelete} />

      <div class="input-group flex-nowrap input-group-sm mb-2">
        <span class="input-group-text">{$tr("params.label.size")}</span>
        <input class="form-control" type="number" min="1" step={dpmm} bind:value={width} />
        <button class="btn btn-sm btn-secondary" on:click={onFlip}><MdIcon icon="swap_horiz" /></button>
        <input class="form-control" type="number" min="1" step={dpmm} bind:value={height} />
        <select class="form-select" bind:value={unit} on:change={onUnitChange}>
          <option value="mm"> {$tr("params.label.mm")}</option>
          <option value="px"> {$tr("params.label.px")}</option>
        </select>
      </div>

      {#if unit !== "px"}
        <DpiSelector bind:value={dpmm} />
      {/if}

      <div class="input-group flex-nowrap input-group-sm print-dir-switch mb-2" role="group">
        <span class="input-group-text w-100">{$tr("params.label.direction")}</span>
        {#each printDirections as v}
          <input
            type="radio"
            class="btn-check"
            name="print-dir"
            id="print-dir-{v}"
            autocomplete="off"
            bind:group={printDirection}
            value={v} />
          <label class="btn btn-outline-secondary px-3" for="print-dir-{v}">
            <div class="svg-icon"></div>
          </label>
        {/each}
      </div>

      <div class="input-group flex-nowrap input-group-sm label-shape-switch mb-2" role="group">
        <span class="input-group-text w-100">{$tr("params.label.shape")}</span>
        {#each labelShapes as v}
          <input
            type="radio"
            class="btn-check"
            name="label-shape"
            id="label-shape-{v}"
            autocomplete="off"
            bind:group={shape}
            value={v} />
          <label class="btn btn-outline-secondary px-3" for="label-shape-{v}">
            <div class="svg-icon"></div>
          </label>
        {/each}
      </div>

      {#if shape !== "circle"}
        <div class="input-group flex-nowrap input-group-sm label-split-switch mb-2" role="group">
          <span class="input-group-text w-100">{$tr("params.label.split")}</span>
          {#each labelSplits as v}
            <input
              type="radio"
              class="btn-check"
              name="label-split"
              id="label-split-{v}"
              autocomplete="off"
              bind:group={split}
              value={v} />
            <label class="btn btn-outline-secondary px-3" for="label-split-{v}">
              <div class="svg-icon"></div>
            </label>
          {/each}
        </div>

        {#if split !== "none"}
          <div class="input-group flex-nowrap input-group-sm mb-2">
            <span class="input-group-text">{$tr("params.label.split.count")}</span>
            <input class="form-control" type="number" min="1" bind:value={splitParts} />
          </div>
        {/if}
      {/if}

      {#if split !== "none"}
        <div class="input-group flex-nowrap input-group-sm mirror-switch mb-2" role="group">
          <span class="input-group-text w-100">{$tr("params.label.mirror")}</span>
          {#each mirrorTypes as v}
            <input
              type="radio"
              class="btn-check"
              name="mirror"
              id="mirror-{v}"
              autocomplete="off"
              bind:group={mirror}
              value={v} />
            <label class="btn btn-outline-secondary px-3" for="mirror-{v}">
              <div class="svg-icon"></div>
            </label>
          {/each}
        </div>

        <div class="input-group flex-nowrap input-group-sm tail-pos-switch mb-2" role="group">
          <span class="input-group-text w-100">{$tr("params.label.tail.position")}</span>
          {#each tailPositions as v}
            <input
              type="radio"
              class="btn-check"
              name="tail-pos"
              id="tail-{v}"
              autocomplete="off"
              bind:group={tailPos}
              value={v} />
            <label class="btn btn-outline-secondary px-3" for="tail-{v}">
              <div class="svg-icon"></div>
            </label>
          {/each}
        </div>

        <div class="input-group flex-nowrap input-group-sm mb-2">
          <span class="input-group-text">{$tr("params.label.tail.length")}</span>
          <input class="form-control" type="number" min="1" bind:value={tailLength} />
          <span class="input-group-text">
            {#if unit === "mm"}{$tr("params.label.mm")}{/if}
            {#if unit === "px"}{$tr("params.label.px")}{/if}
          </span>
        </div>
      {/if}

      <div class="input-group flex-nowrap input-group-sm mb-2">
        <span class="input-group-text">{$tr("params.label.label_title")}</span>
        <input class="form-control" type="text" bind:value={title} />
      </div>

      <div class="text-end">
        <button class="btn btn-sm btn-secondary" on:click={onLabelPresetAdd}>
          {$tr("params.label.save_template")}
        </button>
        <button class="btn btn-sm btn-primary" on:click={onApply}>{$tr("params.label.apply")}</button>
      </div>
    </div>
  </div>
</div>

<style>
  .dropdown-menu {
    width: 100vw;
    max-width: 450px;
  }

  .cursor-help {
    cursor: help;
  }

  .svg-icon {
    height: 1.5em;
    width: 1.5em;
    background-size: cover;
  }

  .tail-pos-switch .svg-icon {
    background-image: url("./assets/tail-pos.svg");
  }
  .tail-pos-switch label[for="tail-bottom"] .svg-icon {
    transform: rotate(90deg);
  }
  .tail-pos-switch label[for="tail-bottom"] .svg-icon {
    transform: rotate(90deg);
  }
  .tail-pos-switch label[for="tail-left"] .svg-icon {
    transform: rotate(180deg);
  }
  .tail-pos-switch label[for="tail-top"] .svg-icon {
    transform: rotate(270deg);
  }
  .print-dir-switch .svg-icon {
    background-image: url("./assets/print-dir.svg");
  }
  .print-dir-switch label[for="print-dir-top"] .svg-icon {
    transform: rotate(90deg);
  }

  .label-shape-switch label[for="label-shape-rect"] .svg-icon {
    background-image: url("./assets/shape-rect.svg");
  }
  .label-shape-switch label[for="label-shape-rounded_rect"] .svg-icon {
    background-image: url("./assets/shape-rrect.svg");
  }
  .label-shape-switch label[for="label-shape-circle"] .svg-icon {
    background-image: url("./assets/shape-circle.svg");
  }

  .label-split-switch label[for="label-split-none"] .svg-icon {
    background-image: url("./assets/shape-rrect.svg");
  }
  .label-split-switch label[for="label-split-vertical"] .svg-icon {
    background-image: url("./assets/split-vertical.svg");
    transform: rotate(90deg);
  }
  .label-split-switch label[for="label-split-horizontal"] .svg-icon {
    background-image: url("./assets/split-vertical.svg");
  }

  .mirror-switch label[for="mirror-none"] .svg-icon {
    background-image: url("./assets/mirror-none.svg");
  }
  .mirror-switch label[for="mirror-copy"] .svg-icon {
    background-image: url("./assets/mirror-copy.svg");
  }
  .mirror-switch label[for="mirror-flip"] .svg-icon {
    background-image: url("./assets/mirror-flip.svg");
  }
</style>
