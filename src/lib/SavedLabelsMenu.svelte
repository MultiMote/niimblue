<script lang="ts">
  import { tr } from "../utils/i18n";
  import { onMount } from "svelte";
  import MdIcon from "./MdIcon.svelte";
  import SavedLabelsBrowser from "./SavedLabelsBrowser.svelte";
  import { ExportedLabelTemplateSchema, type ExportedLabelTemplate } from "../types";
  import { LocalStoragePersistence } from "../utils/persistence";
  import { Toasts } from "../utils/toasts";
  import Dropdown from "bootstrap/js/dist/dropdown";
  import { FileUtils } from "../utils/file_utils";

  export let onRequestCurrentCanvas: () => ExportedLabelTemplate;
  export let onLoadRequested: (label: ExportedLabelTemplate) => void;

  let dropdownRef: Element;
  let savedLabels: ExportedLabelTemplate[] = [];
  let selectedIndex: number = -1;
  let title: string = "";

  const onLabelSelected = (index: number) => {
    selectedIndex = index;
    title = savedLabels[index].title ?? "";
  };

  const onLabelExport = (idx: number) => {
    try {
      FileUtils.saveLabelAsJson(savedLabels[idx]);
    } catch (e) {
      Toasts.zodErrors(e, "Canvas save error:");
    }
  };

  const onLabelDelete = (idx: number) => {
    selectedIndex = -1;
    const result = [...savedLabels];
    result.splice(idx, 1);
    LocalStoragePersistence.saveLabels(result);

    savedLabels = result;
    title = "";
  };

  const onSaveReplaceClicked = () => {
    if (selectedIndex === -1) {
      return;
    }

    if (!confirm($tr("editor.warning.save"))) {
      return;
    }

    const label = onRequestCurrentCanvas();
    label.title = title;

    const result = [...savedLabels];
    result[selectedIndex] = label;

    const errors = LocalStoragePersistence.saveLabels(result);
    errors.forEach((e) => Toasts.zodErrors(e, "Label save error"));

    if (errors.length === 0) {
      savedLabels = result;
    }
  };

  const onSaveClicked = () => {
    const label = onRequestCurrentCanvas();
    label.title = title;
    const result = [...savedLabels, label];
    console.log(result);

    const errors = LocalStoragePersistence.saveLabels(result);
    errors.forEach((e) => Toasts.zodErrors(e, "Label save error"));

    if (errors.length === 0) {
      savedLabels = result;
    }
  };

  const onLoadClicked = () => {
    if (selectedIndex === -1) {
      return;
    }

    if (!confirm($tr("editor.warning.load"))) {
      return;
    }

    onLoadRequested(savedLabels[selectedIndex]);
    new Dropdown(dropdownRef).hide();
  };

  const onImportClicked = async () => {
    const contents = await FileUtils.pickAndReadTextFile("json");
    const rawData = JSON.parse(contents);

    if (!confirm($tr("editor.warning.load"))) {
      return;
    }

    try {
      onLoadRequested(ExportedLabelTemplateSchema.parse(rawData));
      new Dropdown(dropdownRef).hide();
    } catch (e) {
      Toasts.zodErrors(e, "Canvas load error:");
    }
  };

  const onExportClicked = () => {
    try {
      FileUtils.saveLabelAsJson(onRequestCurrentCanvas());
    } catch (e) {
      Toasts.zodErrors(e, "Canvas save error:");
    }
  };

  const reload = () => {
    savedLabels = LocalStoragePersistence.loadLabels();
  };

  onMount(() => {
    reload();
  });
</script>

<div class="dropdown">
  <button class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
    <MdIcon icon="sd_storage" />
  </button>
  <div class="dropdown-menu" bind:this={dropdownRef}>
    <h6 class="dropdown-header">{$tr("params.saved_labels.menu_title")}</h6>

    <div class="px-3">
      <div class="p-1">
        <button class="btn btn-sm btn-outline-secondary" on:click={onImportClicked}>
          <MdIcon icon="data_object" />
          {$tr("params.saved_labels.load.json")}
        </button>
        <button class="btn btn-sm btn-outline-secondary" on:click={onExportClicked}>
          <MdIcon icon="data_object" />
          {$tr("params.saved_labels.save.json")}
        </button>
      </div>

      <SavedLabelsBrowser
        class="mb-1"
        {selectedIndex}
        labels={savedLabels}
        onItemClicked={onLabelSelected}
        onItemDelete={onLabelDelete}
        onItemExport={onLabelExport} />

      <div class="input-group flex-nowrap input-group-sm mb-3">
        <span class="input-group-text">{$tr("params.saved_labels.label_title")}</span>
        <input
          class="form-control"
          type="text"
          placeholder={$tr("params.saved_labels.label_title.placeholder")}
          bind:value={title} />
      </div>

      <div class="d-flex gap-1 flex-wrap justify-content-end">
        <button class="btn btn-sm btn-secondary" on:click={onSaveClicked}>
          <MdIcon icon="save" />
          {$tr("params.saved_labels.save.browser")}
        </button>

        {#if selectedIndex !== -1}
          <button class="btn btn-sm btn-secondary" on:click={onSaveReplaceClicked}>
            <MdIcon icon="edit_note" />
            {$tr("params.saved_labels.save.browser.replace")}
          </button>

          <button class="btn btn-sm btn-primary" on:click={onLoadClicked}>
            <MdIcon icon="folder" />
            {$tr("params.saved_labels.load.browser")}
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .dropdown-menu {
    min-width: 450px;
  }
</style>
