<script lang="ts">
  import { Utils } from "@mmote/niimbluelib";
  import { tr } from "../utils/i18n";
  import MdIcon from "./MdIcon.svelte";
  let caps = Utils.getAvailableTransports();
</script>

{#if !caps.webSerial && !caps.webBluetooth && !caps.capacitorBle }
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

<style>
</style>
