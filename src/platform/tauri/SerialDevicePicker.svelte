<script lang="ts">
  import AppModal from "$/components/basic/AppModal.svelte";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { SerialPort, type PortInfo } from "tauri-plugin-serialplugin-api";
  import { tr } from "$/utils/i18n";
  import { closeSerialPicker, serialPickerState, type SerialPortPick } from "./picker";

  let ports = $state<{ path: string; info: PortInfo }[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let selectedPath = $state<string | null>(null);

  const unknownToUndefined = (value: string): string | undefined => (value === "Unknown" ? undefined : value);

  const describePort = (info: PortInfo): string => {
    const parts: string[] = [];

    const product = unknownToUndefined(info.product);
    const manufacturer = unknownToUndefined(info.manufacturer);

    if (product !== undefined) {
      parts.push(product);
    } else if (manufacturer !== undefined) {
      parts.push(manufacturer);
    }

    const vid = unknownToUndefined(info.vid);
    const pid = unknownToUndefined(info.pid);

    if (vid !== undefined || pid !== undefined) {
      parts.push(`VID:${vid ?? "?"} PID:${pid ?? "?"}`);
    }

    return parts.join(" · ");
  };

  const portName = (pick: { path: string; info: PortInfo }): string => {
    const description = describePort(pick.info);
    return description.length > 0 ? description : pick.path;
  };

  const loadPorts = async () => {
    loading = true;
    error = null;
    selectedPath = null;

    try {
      const available = await SerialPort.available_ports();

      ports = Object.entries(available)
        .map(([path, info]) => ({ path, info }))
        .sort((a, b) => a.path.localeCompare(b.path));
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  };

  const confirm = (index?: number) => {
    if (index === undefined && selectedPath === null) {
      return;
    }

    const target = index !== undefined ? ports[index] : ports.find((port) => port.path === selectedPath);

    if (target === undefined) {
      return;
    }

    const pick: SerialPortPick = { path: target.path, name: portName(target) };
    closeSerialPicker(pick);
  };

  const cancel = () => {
    if ($serialPickerState.resolve === null) {
      return;
    }

    closeSerialPicker(null);
  };

  $effect(() => {
    if (!$serialPickerState.show) {
      return;
    }

    void loadPorts();
  });
</script>

<AppModal show={$serialPickerState.show} title={$tr("serial.picker.title")} onClose={cancel} size="lg">
  <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
    <button class="btn btn-sm btn-primary text-nowrap" disabled={loading} onclick={() => void loadPorts()}>
      <MdIcon icon="refresh" />
      {$tr("serial.picker.refresh")}
    </button>

    {#if loading}
      <span class="text-secondary small">{$tr("serial.picker.loading")}</span>
    {/if}
  </div>

  {#if error}
    <div class="alert alert-danger py-2 px-3 mb-2">{error}</div>
  {/if}

  {#if ports.length === 0}
    <div class="text-secondary text-center py-4">
      {loading ? $tr("serial.picker.loading") : $tr("serial.picker.no_ports")}
    </div>
  {:else}
    <div class="device-list border rounded">
      {#each ports as port, index (port.path)}
        <button
          type="button"
          class="device-row"
          class:selected={port.path === selectedPath}
          onclick={() => (selectedPath = port.path)}
          ondblclick={() => confirm(index)}>
          <MdIcon icon="usb" />
          <span class="flex-grow-1 text-start text-truncate">
            <span class="d-block text-truncate">{port.path}</span>
            {#if describePort(port.info).length > 0}
              <span class="d-block small text-secondary text-truncate">{describePort(port.info)}</span>
            {/if}
          </span>
        </button>
      {/each}
    </div>
  {/if}

  {#snippet footer()}
    <button class="btn btn-secondary" onclick={cancel}>{$tr("dialog.cancel")}</button>
    <button class="btn btn-primary" disabled={selectedPath === null} onclick={() => confirm()}>
      <MdIcon icon="usb" />
      {$tr("serial.picker.connect")}
    </button>
  {/snippet}
</AppModal>

<style>
  .device-list {
    max-height: 50vh;
    overflow-y: auto;
  }

  .device-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 0;
    border-bottom: 1px solid var(--bs-border-color);
    background: transparent;
    color: inherit;
    text-align: left;
  }

  .device-row:last-child {
    border-bottom: 0;
  }

  .device-row:hover,
  .device-row.selected {
    background: var(--bs-tertiary-bg);
  }
</style>
