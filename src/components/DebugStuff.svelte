<script lang="ts">
  import AppModal from "$/components/basic/AppModal.svelte";
  import { appConfig } from "$/stores";
  import { tr } from "$/utils/i18n";
  import { NIIMBOT_CLIENT_DEFAULTS } from "@mmote/niimbluelib";

  let { show = $bindable() } = $props();
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
    <button class="btn btn-outline-secondary" onclick={() => ($appConfig.packetIntervalMs = undefined)}
      >{$tr("debug.reset")}</button>
  </div>

  <div class="mb-1">
    {$tr("debug.page_delay.help")}
  </div>

  <div class="input-group flex-nowrap input-group-sm mb-3" role="group">
    <input class="form-control" type="number" min="0" placeholder="0" bind:value={$appConfig.pageDelay} />
    <span class="input-group-text">ms</span>
    <button class="btn btn-outline-secondary" onclick={() => ($appConfig.pageDelay = undefined)}
      >{$tr("debug.reset")}</button>
  </div>
</AppModal>
