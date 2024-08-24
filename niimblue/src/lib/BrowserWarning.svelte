<script lang="ts">
  import { Utils } from "@mmote/niimbluelib";
  import FaIcon from "./FaIcon.svelte";
  let bluetooth = Utils.isBluetoothSupported();
  let serial = Utils.isSerialSupported();
</script>

{#if !bluetooth && !serial}
  <div class="alert alert-danger" role="alert">
    <div>
      Oh no, your browser does not support bluetooth and serial communications <FaIcon icon="face-frown-open"/>
    </div>
    <div>
      Anyway, you still can draw labels.
    </div>
  </div>
{/if}

<style>
</style>
