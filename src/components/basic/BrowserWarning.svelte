<script lang="ts">
  import { Utils } from "@mmote/niimbluelib";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { detectAntiFingerprinting, isIOSSafari } from "$/utils/browsers";
  let caps = Utils.getAvailableTransports();
  let browserWarningDismissed = $state(false);
  let fingerprintingWarningDismissed = $state(false);

  let antiFingerprinting = detectAntiFingerprinting();
</script>

{#if !browserWarningDismissed && !caps.webSerial && !caps.webBluetooth && !caps.capacitorBle}
  <div class="alert alert-danger alert-dismissible" role="alert">
    <button type="button" class="btn-close" aria-label="Dismiss warning" onclick={() => browserWarningDismissed = true}></button>
    {#if isIOSSafari()}
      <div>{$tr("browser_warning.ios_safari")}</div>
      <div>
        <a href="https://beacio.com/" target="_blank" rel="noopener noreferrer">beacio.com</a>
        — {$tr("browser_warning.ios_safari_setup")}
      </div>
    {:else}
      <div>
        {$tr("browser_warning.lines.first")}
        <MdIcon icon="sentiment_very_dissatisfied" />
      </div>
      <div>
        {$tr("browser_warning.lines.second")}
      </div>
    {/if}
  </div>
{/if}

{#if !fingerprintingWarningDismissed && antiFingerprinting}
  <div class="alert alert-danger alert-dismissible" role="alert">
    <button type="button" class="btn-close" aria-label="Dismiss warning" onclick={() => fingerprintingWarningDismissed = true}></button>
    {$tr("browser_warning.fingerprinting")}
  </div>
{/if}

<style>
</style>
