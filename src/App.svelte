<script lang="ts">
  import MainPage from "$routes/dashboard.svelte";
  import { config as FabricConfig } from "fabric";

  FabricConfig.disableStyleCopyPaste = true;
</script>

<MainPage />
