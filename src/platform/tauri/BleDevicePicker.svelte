<script lang="ts">
  import AppModal from "$/components/basic/AppModal.svelte";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { modelsLibrary } from "@mmote/niimbluelib";
  import { getAdapterState, getScanningUpdates, startScan, stopScan, type BleDevice } from "@mnlphlp/plugin-blec";
  import { onMount } from "svelte";
  import { tr } from "$/utils/i18n";
  import { blePickerState, closeBlePicker } from "./picker";

  const SERVICE_UUID = "e7810a71-73ae-499d-8c15-faa9aef0c3f2";
  const namePrefixes = [...new Set(modelsLibrary.map((model) => model.model[0]))];
  const SCAN_TIMEOUT_MS = 15_000;

  let devices = $state<BleDevice[]>([]);
  let scanning = $state(false);
  let error = $state<string | null>(null);
  let showAll = $state(false);
  let selectedAddress = $state<string | null>(null);

  /** Incremented to ignore results of a cancelled scan. */
  let scanGeneration = 0;

  const isNiimbotDevice = (device: BleDevice): boolean =>
    device.services.some((uuid) => uuid.toLowerCase() === SERVICE_UUID) ||
    (device.name || "").toUpperCase().includes("NIIMBOT") ||
    namePrefixes.some((prefix) => (device.name || "").startsWith(prefix));

  const visibleDevices = $derived(
    [...devices]
      .filter((device) => showAll || isNiimbotDevice(device))
      .sort(
        (a, b) =>
          Number(b.isConnected) - Number(a.isConnected) || (a.name || a.address).localeCompare(b.name || b.address),
      ),
  );

  const selectedDevice = $derived(visibleDevices.find((device) => device.address === selectedAddress));

  const runScan = async () => {
    const generation = ++scanGeneration;

    devices = [];
    error = null;

    try {
      const adapterState = await getAdapterState();

      if (adapterState === "Off") {
        throw new Error($tr("ble.picker.adapter_off"));
      }

      if (adapterState === "Unknown") {
        throw new Error($tr("ble.picker.adapter_missing"));
      }

      scanning = true;

      await startScan(
        (found) => {
          if (generation !== scanGeneration) {
            return;
          }

          const byAddress = Object.fromEntries(devices.map((device) => [device.address, device]));
          found.forEach((device) => (byAddress[device.address] = device));
          devices = Object.values(byAddress);
        },
        SCAN_TIMEOUT_MS,
      );
    } catch (e) {
      if (generation === scanGeneration) {
        error = e instanceof Error ? e.message : String(e);
        scanning = false;
      }
    }
  };

  const stop = async () => {
    scanGeneration++;
    scanning = false;

    try {
      await stopScan();
    } catch (e) {
      console.warn("Unable to stop BLE scan:", e);
    }
  };

  const rescan = async () => {
    await stop();
    await runScan();
  };

  const confirm = async (device?: BleDevice) => {
    const target = device ?? selectedDevice;

    if (target === undefined) {
      return;
    }

    // The scan has to be over before the client connects to the device.
    await stop();
    closeBlePicker(target);
  };

  const cancel = () => {
    if ($blePickerState.resolve === null) {
      return;
    }

    closeBlePicker(null);
    void stop();
  };

  $effect(() => {
    if (!$blePickerState.show) {
      return;
    }

    selectedAddress = null;
    showAll = false;
    void runScan();
  });

  onMount(() => {
    getScanningUpdates((value) => (scanning = value)).catch((e) =>
      console.warn("Unable to watch BLE scanning state:", e),
    );
  });
</script>

<AppModal show={$blePickerState.show} title={$tr("ble.picker.title")} onClose={cancel} size="lg">
  <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
    <button class="btn btn-sm btn-primary text-nowrap" disabled={scanning} onclick={() => void rescan()}>
      <MdIcon icon="refresh" />
      {$tr("ble.picker.rescan")}
    </button>

    {#if scanning}
      <button class="btn btn-sm btn-secondary text-nowrap" onclick={() => void stop()}>
        <MdIcon icon="stop" />
        {$tr("ble.picker.stop")}
      </button>
      <span class="text-secondary small">{$tr("ble.picker.scanning")}</span>
    {/if}

    <div class="form-check form-switch ms-auto mb-0">
      <input class="form-check-input" type="checkbox" role="switch" id="ble-show-all" bind:checked={showAll} />
      <label class="form-check-label" for="ble-show-all">{$tr("ble.picker.show_all")}</label>
    </div>
  </div>

  {#if error}
    <div class="alert alert-danger py-2 px-3 mb-2">{error}</div>
  {/if}

  {#if visibleDevices.length === 0}
    <div class="text-secondary text-center py-4">
      {scanning ? $tr("ble.picker.scanning") : $tr("ble.picker.no_devices")}
    </div>
  {:else}
    <div class="device-list border rounded">
      {#each visibleDevices as device (device.address)}
        <button
          type="button"
          class="device-row"
          class:selected={device.address === selectedAddress}
          onclick={() => (selectedAddress = device.address)}
          ondblclick={() => confirm(device)}>
          <MdIcon icon="bluetooth" />
          <span class="flex-grow-1 text-start text-truncate">
            <span class="d-block text-truncate">{device.name || device.address}</span>
            <span class="d-block small text-secondary text-truncate">
              {device.address}
              {#if device.isConnected}
                · {$tr("ble.picker.connected")}
              {/if}
            </span>
          </span>
          {#if device.rssi != null}
            <span class="small text-secondary text-nowrap">{device.rssi} dBm</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}

  {#snippet footer()}
    <button class="btn btn-secondary" onclick={cancel}>{$tr("dialog.cancel")}</button>
    <button class="btn btn-primary" disabled={selectedDevice === undefined} onclick={() => confirm()}>
      <MdIcon icon="bluetooth_connected" />
      {$tr("ble.picker.connect")}
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
