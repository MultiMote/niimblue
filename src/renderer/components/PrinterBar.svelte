<script lang="ts">
  import {
    connectionState,
    connectedPrinterName,
    printerMeta,
    heartbeatData,
    connect,
    disconnect,
    fetchPrinterInfo,
    type ConnectionState,
  } from "$lib/printer";

  let busy = $state(false);

  const onConnect = async () => {
    busy = true;
    await connect();
    busy = false;
  };

  const batteryIcon = (v: number): string => {
    if (v > 4) v = Math.min(4, Math.max(1, Math.ceil(v / 25)));
    if (v === 4) return "battery_full";
    if (v === 3) return "battery_5_bar";
    if (v === 2) return "battery_3_bar";
    if (v === 1) return "battery_2_bar";
    return "battery_0_bar";
  };

  const stateText: Record<ConnectionState, string> = {
    disconnected: "Disconnected",
    connecting: "Connecting...",
    connected: "Connected",
  };
</script>

<header
  class="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-surface-0 px-4"
>
  <div class="flex items-center gap-2 font-semibold tracking-tight">
    <span class="text-[#ff5349]">Niim</span><span class="text-[#3b82f6]">blue</span>
    <span class="ml-1 rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-normal text-muted">studio</span>
  </div>

  <div class="ml-auto flex items-center gap-2 text-sm">
    {#if $connectionState === "connected"}
      <span class="text-muted">{$printerMeta?.model ?? $connectedPrinterName}</span>
      {#if $heartbeatData?.chargeLevel}
        <span class="material-symbols-rounded text-base text-muted">{batteryIcon($heartbeatData.chargeLevel)}</span>
      {/if}
      <span class="h-2 w-2 rounded-full bg-success"></span>
      <span class="text-muted">{stateText[$connectionState]}</span>
      <button class="btn-secondary" onclick={fetchPrinterInfo} title="Refresh info">refresh</button>
      <button class="btn-danger" onclick={disconnect} title="Disconnect">Disconnect</button>
    {:else}
      <span class="h-2 w-2 rounded-full bg-muted"></span>
      <span class="text-muted">{stateText[$connectionState]}</span>
      <button class="btn-primary" onclick={onConnect} disabled={busy}>
        {busy ? "..." : "Connect"}
      </button>
    {/if}
  </div>
</header>

<style>
  .btn-primary,
  .btn-secondary,
  .btn-danger {
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 13px;
    border: 1px solid var(--color-border);
    cursor: pointer;
  }
  .btn-primary {
    background: var(--color-accent);
    color: var(--color-accent-fg);
    border-color: transparent;
  }
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .btn-secondary {
    background: var(--color-surface-2);
    color: inherit;
  }
  .btn-danger {
    background: var(--color-danger);
    color: #fff;
    border-color: transparent;
  }
  .btn-secondary:hover {
    background: var(--color-surface-3);
  }
</style>
