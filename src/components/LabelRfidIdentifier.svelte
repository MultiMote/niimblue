<script lang="ts">
  import { rfidInfo, connectionState, labelRfidMeta, labelRfidMetaApplyRequest } from "$/stores/app";
  import { z } from "zod";
  import { InputAreaSchema, type LabelMeta } from "$/types";
  import { Toasts } from "$/utils/toasts";
  import MdIcon from "./basic/MdIcon.svelte";

  let barcodeKnown = $derived($labelRfidMeta.some((meta) => meta.barcode === $rfidInfo.labelRfidInfo?.barCode));

  const NiimbotCloudResponse = z.object({
    data: z
      .object({
        width: z.number().positive(),
        height: z.number().positive(),
        rotate: z.number().nonnegative(),
        paperType: z.number().nonnegative(),
        inputAreas: z.array(InputAreaSchema).default([]),
      })
      .optional(),
  });

  const fetchInfo = async () => {
    const barCode = $rfidInfo.labelRfidInfo?.barCode;

    if (barCode === undefined) {
      return;
    }

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

      if (parsed.data === undefined) {
        Toasts.message(`No info for barcode ${barCode}`);
        return;
      }

      const meta: LabelMeta = {
        barcode: barCode,
        width: parsed.data.width,
        height: parsed.data.height,
        inputAreas: parsed.data.inputAreas,
        labelType: parsed.data.paperType,
        printDirection: [0, 180].includes(parsed.data.rotate) ? "top" : "left",
      };

      labelRfidMeta.update((items) => {
        const idx = items.findIndex((item) => item.barcode === barCode);

        if (idx === -1) {
          return [...items, meta];
        }

        const next = [...items];
        next[idx] = meta;

        return next;
      });
    } catch (e) {
      Toasts.error(e);
    }
  };

  const applyMeta = () => {
    const barCode = $rfidInfo.labelRfidInfo?.barCode;
    const meta = $labelRfidMeta.find((item) => item.barcode === barCode);

    if (meta === undefined) {
      return;
    }

    labelRfidMetaApplyRequest.set(meta);
  };
</script>

{#if $connectionState === "connected" && $rfidInfo.labelRfidInfo?.tagPresent}
  <div class="input-group w-auto input-group-sm flex-nowrap justify-content-end">
    <span class="input-group-text"
      >{$rfidInfo.labelRfidInfo.barCode}
      {#if !barcodeKnown}(unknown){/if}</span>
    <button class="btn btn-secondary" onclick={fetchInfo}><MdIcon icon="cloud_download"/></button>

    {#if barcodeKnown}
      <button class="btn btn-secondary" onclick={applyMeta}><MdIcon icon="check"/></button>
    {/if}
  </div>
{/if}
