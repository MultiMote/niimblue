<script lang="ts">
  import { appConfig } from "$/stores";
  import { tr } from "$/utils/i18n";
  import { NIIMBOT_CLIENT_DEFAULTS } from "@mmote/niimbluelib/dist/cjs/client/abstract_client";
  import Modal from "bootstrap/js/dist/modal";
  import { onMount } from "svelte";

  let { show = $bindable(false) } = $props();

  let modalElement: HTMLElement;
  let modal: Modal;
  onMount(async () => {
    modal = new Modal(modalElement);
    modal.show();
    modalElement.addEventListener("hidden.bs.modal", () => {
      show = false;
    });
  });
</script>

<div bind:this={modalElement} class="modal fade" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5">{$tr("debug.title")}</h1>
        <button aria-label="Dismiss" type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body">
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
          <input
            class="form-control"
            type="number"
            min="0"
            placeholder="0"
            bind:value={$appConfig.pageDelay} />
          <span class="input-group-text">ms</span>
          <button class="btn btn-outline-secondary" onclick={() => ($appConfig.pageDelay = undefined)}
            >{$tr("debug.reset")}</button>
        </div>
      </div>
    </div>
  </div>
</div>
