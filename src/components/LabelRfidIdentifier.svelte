<script lang="ts">
  import {
    rfidInfo,
    connectionState,
    labelPresets,
    labelPropsUpdateRequest,
    printerInfo,
    printerMeta,
  } from "$/stores/app";
  import { z } from "zod";
  import { InputAreaSchema, type LabelProps } from "$/types";
  import { DPI_DPMM } from "$/defaults";
  import { LabelPropsUtils } from "$/utils/label_props_utils";
  import { Toasts } from "$/utils/toasts";
  import MdIcon from "./basic/MdIcon.svelte";

  let processing = $state(false);

  let barcodeName = $derived(
    $labelPresets.find((preset) => preset.barcode === $rfidInfo.labelRfidInfo?.barCode)?.title,
  );

  const NiimbotCloudResponse = z.object({
    data: z
      .object({
        width: z.number().positive(),
        height: z.number().positive(),
        rotate: z.number().nonnegative(),
        paperType: z.number().nonnegative(),
        inputAreas: z.array(InputAreaSchema).default([]),
        labelNames: z.array(
          z.object({
            name: z.string(),
            languageCode: z.string(),
          }),
        ),
      })
      .optional(),
  });

  const fetchInfo = async () => {
    const barCode = $rfidInfo.labelRfidInfo?.barCode;

    if (barCode === undefined) {
      return;
    }
    processing = true;

    try {
      const resp = await fetch("https://print.niimbot.com/api/template/getCloudTemplateByOneCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "niimbot-user-agent": "AppVersionName/999.0.0",
        },
        body: JSON.stringify({ oneCode: barCode }),
      });
      const body = await resp.json();
      const parsed = await NiimbotCloudResponse.parseAsync(body);

      processing = false;


      if (parsed.data === undefined) {
        Toasts.message(`No info for barcode ${barCode}`);
        return;
      }

      const title = parsed.data.labelNames.find((o) => o.languageCode === "en")?.name ?? "";

      const preset: LabelProps = {
        barcode: barCode,
        labelType: parsed.data.paperType,
        width: parsed.data.width,
        height: parsed.data.height,
        unit: "mm",
        dpmm: DPI_DPMM[LabelPropsUtils.getDpi($printerInfo, $printerMeta)],
        inputAreas: parsed.data.inputAreas,
        printDirection: [0, 180].includes(parsed.data.rotate) ? "top" : "left",
        title,
      };

      labelPresets.update((presets) => {
        const idx = presets.findIndex((item) => item.barcode === barCode);

        if (idx === -1) {
          return [...presets, preset];
        }

        const next = [...presets];
        next[idx] = preset;

        return next;
      });
    } catch (e) {
      Toasts.error(e);
    }
    processing = false;

  };

  const applyMeta = () => {
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
    <span class="input-group-text" title={$rfidInfo.labelRfidInfo?.barCode}>
      {barcodeName ?? $rfidInfo.labelRfidInfo?.barCode}
      {#if !barcodeName}(unknown){/if}</span>
    <button class="btn btn-secondary" onclick={fetchInfo} disabled={processing}>
      <MdIcon icon={processing ? "hourglass_top" : "cloud_download"} />
    </button>

    {#if barcodeName}
      <button class="btn btn-secondary" onclick={applyMeta}><MdIcon icon="check" /></button>
    {/if}
  </div>
{/if}
