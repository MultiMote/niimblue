<script lang="ts">
  import AppModal from "$/components/basic/AppModal.svelte";
  import { DPI_DPMM } from "$/defaults";
  import { appConfig, printerInfo, printerMeta, labelPresets } from "$/stores/app";
  import { tr } from "$/utils/i18n";
  import { LabelPropsUtils } from "$/utils/label_props_utils";
  import { Toasts } from "$/utils/toasts";
  import { NIIMBOT_CLIENT_DEFAULTS } from "@mmote/niimbluelib";

  let { show = $bindable() } = $props();
  let fetchProcessing = $state(false);
  let barcode = $state("");

  const createPresetFromCloud = async (code: string) => {
    const dpmm = DPI_DPMM[LabelPropsUtils.getDpi($printerInfo, $printerMeta)];

    if (!code) {
      return;
    }

    fetchProcessing = true;

    try {
      const preset = await LabelPropsUtils.createFromCloud(code, dpmm);

      labelPresets.update((presets) => {
        const idx = presets.findIndex((item) => item.barcode === code);
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

  const createPresetsFromCloud = async () => {
    for (const code of barcode.split(",")) {
      await createPresetFromCloud(code.trim());
    }
  };
</script>

<AppModal title={$tr("debug.title")} bind:show>
  <div class="mb-1">
    {$tr("debug.packet_interval.help")}
  </div>

  <div class="input-group flex-nowrap input-group-sm mb-3">
    <input
      class="form-control"
      type="number"
      min="1"
      placeholder={`${NIIMBOT_CLIENT_DEFAULTS.packetIntervalMs}`}
      bind:value={$appConfig.packetIntervalMs} />
    <span class="input-group-text">ms</span>
    <button class="btn btn-secondary" onclick={() => ($appConfig.packetIntervalMs = undefined)}
      >{$tr("debug.reset")}</button>
  </div>

  <div class="mb-1">{$tr("rfid_identifier.create")}</div>

  <div class="input-group flex-nowrap input-group-sm mb-3">
    <span class="input-group-text">{$tr("params.label.barcode")}</span>
    <input class="form-control" type="test" bind:value={barcode} />
    <button class="btn btn-secondary" disabled={fetchProcessing} onclick={createPresetsFromCloud}>Run</button>
  </div>
</AppModal>
