<script lang="ts">
  import BrowserWarning from "./lib/BrowserWarning.svelte";
  import ImageEditor from "./lib/ImageEditor.svelte";
  import PrinterConnector from "./lib/PrinterConnector.svelte";
</script>

<div class="container my-2">
  <div class="row mb-2">
    <div class="col">
      <h1 class="title">
        <span class="niim">Niim</span><span class="blue">Blue</span>
      </h1>
    </div>
    <div class="col-md-3">
      <PrinterConnector />
    </div>
  </div>
  <div class="row">
    <div class="col">
      <BrowserWarning />
    </div>
  </div>

  <div class="row">
    <div class="col">
      <ImageEditor />
    </div>
  </div>
</div>

<!-- svelte-ignore missing-declaration -->
<div class="version text-end text-secondary">
  <div>
    {#if __APP_COMMIT__}
      <a class="text-secondary" href="https://github.com/MultiMote/niimblue/commit/{__APP_COMMIT__}"
        >{__APP_COMMIT__.slice(0, 6)}</a
      >
    {:else}
      v{__APP_VERSION__}
    {/if}
    built at {__BUILD_DATE__}
  </div>
  <div>
    <a class="text-secondary" href="https://github.com/MultiMote/niimblue">code</a>
  </div>
</div>

<style>
  .niim {
    color: #ff5349;
  }

  .blue {
    color: #0b7eff;
  }

  .version {
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: -1;
  }
</style>
