<script lang="ts">
  import { rfidInfo, connectionState } from "$/stores/app";
  import { z } from "zod";

  const NiimbotCloudResponse = z.object({
    data: z
      .object({
        width: z.number().positive(),
        height: z.number().positive(),
        rotate: z.number().nonnegative(),
        inputAreas: z.array(
          z.object({
            x: z.number().positive(),
            y: z.number().positive(),
            w: z.number().positive(),
            h: z.number().positive(),
          }),
        ).optional(),
      })
      .optional(),
  });

  const fetchInfo = async () => {
    const resp = await fetch("https://print.niimbot.com/api/template/getCloudTemplateByOneCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "niimbot-user-agent": "AppVersionName/999.0.0",
      },
      body: JSON.stringify({ oneCode: $rfidInfo.labelRfidInfo?.barCode }),
    });
    const body = await resp.json();

    console.log(body);

    const parsed = await NiimbotCloudResponse.parseAsync(body);

    console.log(parsed);
  };
</script>

{#if $connectionState === "connected" && $rfidInfo.labelRfidInfo?.tagPresent}
  <!-- <div class="input-group input-group-sm"></div> -->
  <button
    class="btn btn-sm btn-primary text-truncate barcode-button"
    title={$rfidInfo.labelRfidInfo.barCode}
    onclick={fetchInfo}>{$rfidInfo.labelRfidInfo.barCode}</button>
{/if}

<style>
  .barcode-button {
    max-width: 12rem;
  }
</style>
