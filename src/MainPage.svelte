<script lang="ts">
  import { Utils } from "@mmote/niimbluelib";
  import BrowserWarning from "./lib/BrowserWarning.svelte";
  import ImageEditor from "./lib/ImageEditor.svelte";
  import PrinterConnector from "./lib/PrinterConnector.svelte";

  let isStandalone = Utils.getAvailableTransports().capacitorBle;
</script>

<div class="container my-2">
  <div class="row align-items-center mb-2">
    <div class="col-sm-12">
      <h1 class="title text-center">        
        <span class="niim">Niim</span><span class="blue">Blue{isStandalone ? "s" : ""}</span>
      </h1>
    </div>
    <div class="col-sm-12">
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

<style>
  .niim {
    color: #ff5349;
  }

  .blue {
    color: #0b7eff;
  }

  @media only screen and (max-device-width: 540px) {
    .version {
      position: relative !important;
      z-index: 0 !important;
    }
  }
</style>
