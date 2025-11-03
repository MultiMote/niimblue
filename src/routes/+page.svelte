<script lang="ts">
  import MainPage from "./MainPage.svelte";
  import { config as FabricConfig } from "fabric";

  FabricConfig.disableStyleCopyPaste = true;
</script>

<svelte:head>
  <title>NiimBlue</title>
</svelte:head>

<MainPage />
