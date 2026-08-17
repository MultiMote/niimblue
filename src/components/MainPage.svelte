<script lang="ts">
  import { Utils } from "@mmote/niimbluelib";
  import BrowserWarning from "$/components/basic/BrowserWarning.svelte";
  import LabelDesigner from "$/components/LabelDesigner.svelte";
  import PrinterConnector from "$/components/PrinterConnector.svelte";
  import { locale, locales, tr } from "$/utils/i18n";
  import DebugStuff from "$/components/DebugStuff.svelte";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import ShortcutsHelp from "$/components/ShortcutsHelp.svelte";
  import { initMobileDropdownSheets } from "$/utils/mobile_dropdown_sheet";
  import { onDestroy, onMount } from "svelte";

  // eslint-disable-next-line no-undef
  const appCommit = __APP_COMMIT__;
  // eslint-disable-next-line no-undef
  const buildDate = __BUILD_DATE__;

  let isStandalone = Utils.getAvailableTransports().capacitorBle || "__TAURI__" in window;

  let debugStuffShow = $state<boolean>(false);
  let shortcutsShow = $state<boolean>(false);
  let stopDropdownSheets: (() => void) | undefined;

  onMount(() => {
    stopDropdownSheets = initMobileDropdownSheets();
  });

  onDestroy(() => {
    stopDropdownSheets?.();
  });
</script>

<div class="app-shell">
  <header class="app-header">
    <h1 class="title">
      <span class="brand-niim">Niim</span><span class="brand-blue">Blue{isStandalone ? "s" : ""}</span>
    </h1>

    <div class="header-spacer"></div>

    <div class="header-actions">
      <PrinterConnector />
    </div>
  </header>

  <main class="app-main">
    <div class="px-2">
      <BrowserWarning />
    </div>
    <LabelDesigner />
  </main>

  <footer class="app-footer">
    <div class="d-flex align-items-center gap-2 flex-nowrap">
      <select class="form-select form-select-sm text-secondary d-inline-block w-auto" bind:value={$locale}>
        {#each Object.entries(locales) as [key, name] (key)}
          <option value={key}>{name}</option>
        {/each}
      </select>
      <button
        class="btn btn-sm btn-secondary icon-btn d-none d-lg-inline-flex"
        onclick={() => (shortcutsShow = true)}
        title={$tr("ui.shortcuts")}>
        <MdIcon icon="help_outline" />
        <span class="d-none d-sm-inline">{$tr("ui.shortcuts")}</span>
      </button>
    </div>

    <div class="d-none d-lg-flex align-items-center gap-2 flex-nowrap justify-content-end footer-meta">
      {#if appCommit}
        <a class="ghost-link" href="https://github.com/MultiMote/niimblue/commit/{appCommit}">
          {appCommit.slice(0, 6)}
        </a>
      {/if}
      <span>{$tr("main.built")} {buildDate}</span>
      <a class="ghost-link" href="https://github.com/MultiMote/niimblue">{$tr("main.code")}</a>
      <button class="btn btn-sm btn-link p-0 text-secondary" onclick={() => (debugStuffShow = true)} title={$tr("debug.title")}>
        <MdIcon icon="bug_report" />
      </button>
    </div>
  </footer>
</div>

{#if debugStuffShow}
  <DebugStuff bind:show={debugStuffShow} />
{/if}

{#if shortcutsShow}
  <ShortcutsHelp bind:show={shortcutsShow} />
{/if}
