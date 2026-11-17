<script lang="ts">
  import {
    rfidInfo,
    connectionState,
    labelPresets,
    labelPropsUpdateRequest,
    printerInfo,
    printerMeta,
    appConfig,
  } from "$/stores/app";
  import { DPI_DPMM } from "$/defaults";
  import { LabelPropsUtils } from "$/utils/label_props_utils";
  import { Toasts } from "$/utils/toasts";
  import MdIcon from "./basic/MdIcon.svelte";
  import { tr } from "$/utils/i18n";
  import { appConfirm } from "$/stores/confirm";

  let fetchProcessing = $state(false);

  let presetFound = $derived($labelPresets.find((preset) => preset.barcode === $rfidInfo.labelRfidInfo?.barCode));

  const createPresetFromCloud = async () => {
    if (!$appConfig.cloudRequestConfirmed) {
      const answer = await appConfirm({
        title: $tr("rfid_identifier.warn"),
        buttons: ["yes", "no"],
      });

      if (answer === "no") {
        return;
      }

      $appConfig.cloudRequestConfirmed = true;
    }

    const barcode = $rfidInfo.labelRfidInfo?.barCode;
    const dpmm = DPI_DPMM[LabelPropsUtils.getDpi($printerInfo, $printerMeta)];

    if (barcode === undefined) {
      return;
    }

    fetchProcessing = true;

    try {
      const preset = await LabelPropsUtils.createFromCloud(barcode, dpmm);

      labelPresets.update((presets) => {
        const idx = presets.findIndex((item) => item.barcode === barcode);
        if (idx === -1) {
          Toasts.message($tr("rfid_identifier.added").replace("{title}", preset.title ?? ""));
          return [...presets, preset];
        }
        const newPresets = [...presets];
        newPresets[idx] = preset;
        Toasts.message($tr("rfid_identifier.updated").replace("{title}", preset.title ?? ""));
        return newPresets;
      });
    } catch (e) {
      Toasts.error(e);
    }

    fetchProcessing = false;
  };

  const applyPreset = () => {
    const barCode = $rfidInfo.labelRfidInfo?.barCode;
    const preset = $labelPresets.find((item) => item.barcode === barCode);

    if (preset === undefined) {
      return;
    }

    labelPropsUpdateRequest.set(preset);
  };
</script>

{#if $connectionState === "connected" && $rfidInfo.labelRfidInfo?.tagPresent}
  <div class="input-group w-auto input-group-sm flex-nowrap justify-content-end">
    <span class="input-group-text" title={`RFID ${$rfidInfo.labelRfidInfo?.barCode}`}>
      {presetFound?.title || $rfidInfo.labelRfidInfo?.barCode}
    </span>

    {#if presetFound}
      <button class="btn btn-secondary" onclick={applyPreset} title={$tr("rfid_identifier.apply")}>
        <MdIcon icon="aspect_ratio" />
      </button>
    {:else}
      <button
        class="btn btn-secondary"
        onclick={createPresetFromCloud}
        disabled={fetchProcessing}
        title={$tr("rfid_identifier.create")}>
        <MdIcon icon={fetchProcessing ? "hourglass_top" : "cloud_download"} />
      </button>
    {/if}
  </div>
{/if}
