<script lang="ts">
  import { Utils } from "@mmote/niimbluelib";
  import BrowserWarning from "$/components/basic/BrowserWarning.svelte";
  import LabelDesigner from "$/components/LabelDesigner.svelte";
  import PrinterConnector from "$/components/PrinterConnector.svelte";
  import { locale, locales, tr } from "$/utils/i18n";

  // eslint-disable-next-line no-undef
  const appCommit = __APP_COMMIT__;
  // eslint-disable-next-line no-undef
  const buildDate = __BUILD_DATE__;

  let isStandalone = Utils.getAvailableTransports().capacitorBle;
</script>

<div class="nb-app">
  <div class="nb-header">
    <h1 class="nb-title">
      <span class="niim">Niim</span><span class="blue">Blue{isStandalone ? "s" : ""}</span>
    </h1>
    <PrinterConnector />
  </div>

  <div class="nb-content">
    <BrowserWarning />
    <LabelDesigner />
    <div class="nb-lang-row">
      <select class="form-select form-select-sm nb-lang-select" bind:value={$locale}>
        {#each Object.entries(locales) as [key, name] (key)}
          <option value={key}>{name}</option>
        {/each}
      </select>
    </div>
  </div>
</div>

<div class="nb-footer">
  <div class="nb-footer-info">
    {#if appCommit}
      <a class="nb-footer-link" href="https://github.com/MultiMote/niimblue/commit/{appCommit}">
        {appCommit.slice(0, 6)}
      </a>
    {/if}
    {$tr("main.built")}
    {buildDate}
  </div>
  <div>
    <a class="nb-footer-link" href="https://github.com/MultiMote/niimblue">{$tr("main.code")}</a>
  </div>
</div>

<style>
  .nb-app {
    max-width: 100%;
    padding: 0 16px;
    padding-top: max(12px, env(safe-area-inset-top, 12px));
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }

  .nb-header {
    display: flex;
    flex-direction: column;
    padding: 12px 0 12px;
    gap: 8px;
  }

  .nb-title {
    font-size: 26px !important;
    font-weight: 800 !important;
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin: 0 !important;
  }

  .niim {
    color: #EF4444;
  }

  .blue {
    color: #2563EB;
  }

  .nb-content {
    flex: 1;
  }

  .nb-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 16px;
    flex-wrap: wrap;
    color: var(--nb-text-tertiary);
    font-size: 12px;
  }

  .nb-footer-link {
    color: var(--nb-text-tertiary);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .nb-footer-link:hover {
    color: var(--nb-primary);
  }

  .nb-footer-info {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .nb-lang-row {
    display: flex;
    justify-content: center;
    margin-top: 8px;
  }

  .nb-lang-select {
    width: auto !important;
    display: inline-block;
    font-size: 11px !important;
    padding: 4px 28px 4px 8px !important;
    border-radius: 8px !important;
    background-color: var(--nb-surface) !important;
    border-color: var(--nb-border) !important;
  }

  @media (min-width: 768px) {
    .nb-app {
      max-width: 960px;
      margin: 0 auto;
      padding: 0 24px;
    }
  }
</style>
