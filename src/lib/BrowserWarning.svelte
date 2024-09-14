<script lang="ts">
  import { Utils } from "@mmote/niimbluelib";
  import FaIcon from "./FaIcon.svelte";
  import { tr } from "../utils/i18n";
  let bluetooth = Utils.isBluetoothSupported();
  let serial = Utils.isSerialSupported();
</script>

{#if !bluetooth && !serial}
  <div class="alert alert-danger" role="alert">
    <div>
      {$tr("browser_warning.lines.first", "Oh no, your browser does not support bluetooth and serial communications")} <FaIcon icon="face-frown-open"/>
    </div>
    <div>
      {$tr("browser_warning.lines.second", "Anyway, you still can draw labels.")}
    </div>
  </div>
{/if}

<style>
</style>
