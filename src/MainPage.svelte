<script lang="ts">
  import { Utils } from "@mmote/niimbluelib";
  import BrowserWarning from "./lib/basic/BrowserWarning.svelte";
  import LabelDesigner from "./lib/LabelDesigner.svelte";
  import PrinterConnector from "./lib/PrinterConnector.svelte";
  import { locale, locales, tr } from "./utils/i18n";

  let isStandalone = Utils.getAvailableTransports().capacitorBle;
</script>

<div class="container my-2">
  <div class="row align-items-center mb-3">
    <div class="col">
      <h1 class="title">
        <span class="niim">Niim</span><span class="blue">Blue{isStandalone ? "s" : ""}</span>
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
      <LabelDesigner />
    </div>
  </div>
</div>

<!-- svelte-ignore missing-declaration -->
<div class="footer text-end text-secondary p-3">
  <div>
    <select class="form-select form-select-sm text-secondary d-inline-block w-auto" bind:value={$locale}>
      {#each Object.entries(locales) as [key, name]}
        <option value={key}>{name}</option>
      {/each}
    </select>
  </div>
  <div>
    {#if __APP_COMMIT__}
      <a class="text-secondary" href="https://github.com/MultiMote/niimblue/commit/{__APP_COMMIT__}">
        {__APP_COMMIT__.slice(0, 6)}
      </a>
    {/if}
    {$tr("main.built")}
    {__BUILD_DATE__}
  </div>
  <div>
    <a class="text-secondary" href="https://github.com/MultiMote/niimblue">{$tr("main.code")}</a>
  </div>
</div>

<style>
  .niim {
    color: #ff5349;
  }

  .blue {
    color: #0b7eff;
  }

  .footer {
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: -1;
  }

  @media only screen and (max-device-width: 540px) {
    .footer {
      position: relative !important;
      z-index: 0 !important;
    }
  }
</style>
