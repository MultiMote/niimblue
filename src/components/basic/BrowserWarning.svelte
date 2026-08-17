<script lang="ts">
  import { Utils } from "@mmote/niimbluelib";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { detectAntiFingerprinting } from "$/utils/browsers";
  let caps = Utils.getAvailableTransports();

  let antiFingerprinting = detectAntiFingerprinting();
  let insecureRemote =
    typeof window !== "undefined" &&
    !window.isSecureContext &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";

  let hideTransportWarning = $state(false);
  let hideFingerprintWarning = $state(false);

  const showTransportWarning = $derived(
    !hideTransportWarning && (insecureRemote || (!caps.webSerial && !caps.webBluetooth && !caps.capacitorBle)),
  );
</script>

{#if showTransportWarning}
  {#if insecureRemote}
    <div class="alert alert-warning alert-dismissible" role="alert">
      {$tr("browser_warning.https")}
      <button type="button" class="btn-close" aria-label="Dismiss" onclick={() => (hideTransportWarning = true)}
      ></button>
    </div>
  {:else}
    <div class="alert alert-danger alert-dismissible" role="alert">
      <div>
        {$tr("browser_warning.lines.first")}
        <MdIcon icon="sentiment_very_dissatisfied" />
      </div>
      <div>
        {$tr("browser_warning.lines.second")}
      </div>
      <button type="button" class="btn-close" aria-label="Dismiss" onclick={() => (hideTransportWarning = true)}
      ></button>
    </div>
  {/if}
{/if}

{#if antiFingerprinting && !hideFingerprintWarning}
  <div class="alert alert-danger alert-dismissible" role="alert">
    {$tr("browser_warning.fingerprinting")}
    <button type="button" class="btn-close" aria-label="Dismiss" onclick={() => (hideFingerprintWarning = true)}
    ></button>
  </div>
{/if}

<style>
</style>
