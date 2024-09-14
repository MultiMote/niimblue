<script lang="ts">
  import { onMount } from "svelte";
  import MainPage from "./MainPage.svelte";
  import { library } from "@fortawesome/fontawesome-svg-core";

  let loading: boolean = true;

  onMount(() => {
    import("@fortawesome/free-solid-svg-icons").then((o) => {
      library.add(o.fas);
      loading = false;
    });
  });
</script>

{#if loading}
  <div class="container my-2">Loading resources...</div>
{:else}
  <MainPage />
{/if}
