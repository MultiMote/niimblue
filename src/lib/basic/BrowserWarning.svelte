<script lang="ts">
  import { Utils } from "@mmote/niimbluelib";
  import { tr } from "../../utils/i18n";
  import MdIcon from "./MdIcon.svelte";
  import { detectAntiFingerprinting } from "../../utils/browsers";
  let caps = Utils.getAvailableTransports();

  let antiFingerprinting = detectAntiFingerprinting();

</script>

{#if !caps.webSerial && !caps.webBluetooth && !caps.capacitorBle}
  <div class="alert alert-danger" role="alert">
    <div>
      {$tr("browser_warning.lines.first")}
      <MdIcon icon="sentiment_very_dissatisfied" />
    </div>
    <div>
      {$tr("browser_warning.lines.second")}
    </div>
  </div>
{/if}


{#if antiFingerprinting}
  <div class="alert alert-danger" role="alert">
    {$tr("browser_warning.fingerprinting")}
  </div>
{/if}


<style>
</style>
