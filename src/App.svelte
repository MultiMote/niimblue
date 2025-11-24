<script lang="ts">
  import MainPage from "$/components/MainPage.svelte";
  import { config as FabricConfig } from "fabric";

  FabricConfig.disableStyleCopyPaste = true;
</script>

<MainPage />
