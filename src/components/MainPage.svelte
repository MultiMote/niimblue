<script lang="ts">
  import { onMount } from "svelte";
  import BrowserWarning from "$/components/basic/BrowserWarning.svelte";
  import LabelDesigner from "$/components/LabelDesigner.svelte";
  import PrinterConnector from "$/components/PrinterConnector.svelte";
  import { locale, locales, tr } from "$/utils/i18n";
  import DebugStuff from "$/components/dialogs/DebugStuff.svelte";
  import ChangelogDialog from "$/components/dialogs/ChangelogDialog.svelte";
  import { checkForUpdates, updateInfo } from "$/utils/update.svelte";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import AppPrompt from "$/components/dialogs/AppPrompt.svelte";
  import AppConfirm from "$/components/dialogs/AppConfirm.svelte";
  import LabelRfidIdentifier from "$/components/LabelRfidIdentifier.svelte";
  import PlatformBleDevicePicker from "$platform/BleDevicePicker.svelte";
  import PlatformSerialDevicePicker from "$platform/SerialDevicePicker.svelte";
  import { isStandaloneApp } from "$/utils/env";

  // eslint-disable-next-line no-undef
  const appCommit = __APP_COMMIT__;
  // eslint-disable-next-line no-undef
  const appVersion = __APP_VERSION__;
  // eslint-disable-next-line no-undef
  const buildDate = __BUILD_DATE__;

  const isStandalone = isStandaloneApp();

  let debugStuffShow = $state<boolean>(false);
  let changelogShow = $state<boolean>(false);

  onMount(() => {
    if (appVersion) {
      checkForUpdates(appVersion);
    }
  });
</script>

<div class="page-wrapper d-flex flex-column min-vh-100">
  <div class="container my-2 flex-grow-1">
    <div class="row align-items-center mb-3">
      <div class="col">
        <h1 class="title">
          <span class="niim">Niim</span><span class="blue">Blue{isStandalone ? "s" : ""}</span>
        </h1>
      </div>
      <div class="col-12 col-md-auto d-flex flex-wrap align-items-center justify-content-end gap-3">
        <LabelRfidIdentifier />
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

  <div class="footer text-end text-secondary p-3">
    <div>
      <select class="form-select form-select-sm text-secondary d-inline-block w-auto" bind:value={$locale}>
        {#each Object.entries(locales) as [key, name] (key)}
          <option value={key}>{name}</option>
        {/each}
      </select>
    </div>
    <div>
      {#if appVersion}
        <a class="text-secondary" href="https://github.com/MultiMote/niimblue/releases/tag/{appVersion}">
          {appVersion}
        </a>
        {#if updateInfo.updateAvailable}
          <button
            class="btn btn-link p-0 text-warning"
            title={$tr("main.changelog.new_version")}
            onclick={() => (changelogShow = true)}>
            <MdIcon icon="new_releases" />
          </button>
        {/if}
      {:else if appCommit}
        <a class="text-secondary" href="https://github.com/MultiMote/niimblue/commit/{appCommit}">
          {appCommit.slice(0, 6)}
        </a>
      {/if}
      {$tr("main.built")}
      {buildDate}
    </div>
    <div>
      <a class="text-secondary" href="https://github.com/MultiMote/niimblue">{$tr("main.code")}</a>
      <button class="text-secondary btn btn-link p-0" onclick={() => debugStuffShow = true}>
        <MdIcon icon="bug_report" />
      </button>
    </div>
  </div>
</div>

{#if debugStuffShow}
  <DebugStuff bind:show={debugStuffShow} />
{/if}

{#if changelogShow}
  <ChangelogDialog bind:show={changelogShow} currentVersion={appVersion} />
{/if}

<AppPrompt />

<AppConfirm />

<PlatformBleDevicePicker />

<PlatformSerialDevicePicker />

<style>
  .niim {
    color: #ff5349;
  }

  .blue {
    color: #0b7eff;
  }
</style>
