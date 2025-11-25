<script lang="ts">
  import { tr } from "../../utils/i18n";
  import { onMount } from "svelte";
  import MdIcon from "../basic/MdIcon.svelte";
  import SavedLabelsBrowser from "./SavedLabelsBrowser.svelte";
  import { ExportedLabelTemplateSchema, type ExportedLabelTemplate } from "../../types";
  import { LocalStoragePersistence } from "../../utils/persistence";
  import { Toasts } from "../../utils/toasts";
  import Dropdown from "bootstrap/js/dist/dropdown";
  import { FileUtils } from "../../utils/file_utils";
  import * as fabric from "fabric";

  interface Props {
    onRequestLabelTemplate: () => ExportedLabelTemplate;
    onLoadRequested: (label: ExportedLabelTemplate) => void;
    canvas: fabric.Canvas;
  }

  let { onRequestLabelTemplate, onLoadRequested, canvas }: Props = $props();

  let dropdownRef: HTMLDivElement;
  let savedLabels: ExportedLabelTemplate[] = $state([]);
  let selectedIndex: number = $state(-1);
  let title: string = $state("");
  let usedSpace: number = $state(0);
  let customDefaultTemplate: boolean = $state(LocalStoragePersistence.hasCustomDefaultTemplate());

  const calcUsedSpace = () => {
    usedSpace = LocalStoragePersistence.usedSpace();
  };

  const onLabelSelected = (index: number) => {
    selectedIndex = index;
    title = savedLabels[index]?.title ?? "";
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
    calcUsedSpace();
  };

  const saveLabels = (labels: ExportedLabelTemplate[]) => {
    const { zodErrors, otherErrors } = LocalStoragePersistence.saveLabels(labels);
    zodErrors.forEach((e) => Toasts.zodErrors(e, "Label save error"));
    otherErrors.forEach((e) => Toasts.error(e));

    if (zodErrors.length === 0 && otherErrors.length === 0) {
      savedLabels = labels;
    }

    calcUsedSpace();
  };

  const onSaveReplaceClicked = () => {
    if (selectedIndex === -1) {
      return;
    }

    if (!confirm($tr("editor.warning.save"))) {
      return;
    }

    const label = onRequestLabelTemplate();
    label.title = title;

    const result = [...savedLabels];
    result[selectedIndex] = label;

    saveLabels(result);
  };

  const onMakeDefaultClicked = () => {
    const label = onRequestLabelTemplate();
    label.title = title;
    label.thumbnailBase64 = undefined;
    LocalStoragePersistence.saveDefaultTemplate(label);
    customDefaultTemplate = true;
    calcUsedSpace();
  };

  const onRemoveDefaultClicked = () => {
    LocalStoragePersistence.saveDefaultTemplate(undefined);
    customDefaultTemplate = false;
    calcUsedSpace();
  };

  const onSaveClicked = () => {
    const label = onRequestLabelTemplate();
    label.title = title;
    const result = [...savedLabels, label];
    saveLabels(result);
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
      const label = ExportedLabelTemplateSchema.parse(rawData);
      onLoadRequested(label);

      if (label.title) {
        title = label.title;
      }

      new Dropdown(dropdownRef).hide();
    } catch (e) {
      Toasts.zodErrors(e, "Canvas load error:");
    }
  };

  const onExportClicked = () => {
    try {
      const label = onRequestLabelTemplate();
      if (title) {
        label.title = title.replaceAll(/[\\/:*?"<>|]/g, "_");
      }
      FileUtils.saveLabelAsJson(label);
    } catch (e) {
      Toasts.zodErrors(e, "Canvas save error:");
    }
  };

  const onExportPngClicked = () => {
    try {
      FileUtils.saveCanvasAsPng(canvas);
    } catch (e) {
      Toasts.zodErrors(e, "Canvas save error:");
    }
  };

  onMount(() => {
    savedLabels = LocalStoragePersistence.loadLabels();
    calcUsedSpace();
  });
</script>

<div class="dropdown">
  <button class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
    <MdIcon icon="sd_storage" />
  </button>
  <div class="saved-labels dropdown-menu" bind:this={dropdownRef}>
    <h6 class="dropdown-header text-wrap">
      {$tr("params.saved_labels.menu_title")} - {usedSpace}
      {$tr("params.saved_labels.kb_used")}
    </h6>

    <div class="px-3">
      <div class="p-1">
        <button class="btn btn-sm btn-outline-secondary" onclick={onImportClicked}>
          <MdIcon icon="data_object" />
          {$tr("params.saved_labels.load.json")}
        </button>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" onclick={onExportClicked}>
            <MdIcon icon="data_object" />
            {$tr("params.saved_labels.save.json")}
          </button>
          <button
            type="button"
            aria-label="dropdown"
            class="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split"
            data-bs-toggle="dropdown">
          </button>
          <ul class="dropdown-menu">
            <li>
              <button class="dropdown-item" onclick={onExportPngClicked}>PNG</button>
            </li>
          </ul>
        </div>
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
        <div class="btn-group btn-group-sm make-default">
          <button class="btn text-secondary" onclick={onMakeDefaultClicked}>
            {$tr("params.saved_labels.make_default")}
          </button>
          {#if customDefaultTemplate}
            <button class="btn text-secondary" onclick={onRemoveDefaultClicked}>
              <MdIcon icon="close" />
            </button>
          {/if}
        </div>

        <button class="btn btn-sm btn-secondary" onclick={onSaveClicked}>
          <MdIcon icon="save" />
          {$tr("params.saved_labels.save.browser")}
        </button>

        {#if selectedIndex !== -1}
          <button class="btn btn-sm btn-secondary" onclick={onSaveReplaceClicked}>
            <MdIcon icon="edit_note" />
            {$tr("params.saved_labels.save.browser.replace")}
          </button>

          <button class="btn btn-sm btn-primary" onclick={onLoadClicked}>
            <MdIcon icon="folder" />
            {$tr("params.saved_labels.load.browser")}
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .saved-labels.dropdown-menu {
    width: 100vw;
    max-width: 450px;
  }
  .make-default {
    margin-right: auto;
  }
</style>
