<script lang="ts">
  import { tr } from "$/utils/i18n";
  import { onMount } from "svelte";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import SavedLabelsBrowser from "$/components/designer-controls/SavedLabelsBrowser.svelte";
  import { ExportedLabelTemplateSchema, type ExportedLabelTemplate } from "$/types";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import { Toasts } from "$/utils/toasts";
  import Dropdown from "bootstrap/js/dist/dropdown";
  import { FileUtils } from "$/utils/file_utils";
  import * as fabric from "fabric";
  import { Utils } from "@mmote/niimbluelib";
  import { z } from "zod";

  interface Props {
    onRequestLabelTemplate: () => ExportedLabelTemplate;
    onLoadRequested: (label: ExportedLabelTemplate) => void;
    canvas: fabric.Canvas;
    csvEnabled: boolean;
  }

  let { onRequestLabelTemplate, onLoadRequested, canvas, csvEnabled }: Props = $props();

  let dropdownRef: HTMLDivElement;
  let savedLabels = $state<ExportedLabelTemplate[]>([]);
  let selectedIndex = $state<number>(-1);
  let title = $state<string>("");
  let usedSpace = $state<number>(0);
  let customDefaultTemplate = $state<boolean>(LocalStoragePersistence.hasCustomDefaultTemplate());
  let isStandalone = Utils.getAvailableTransports().capacitorBle;

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

    const label = savedLabels[selectedIndex];

    let message = $tr("editor.warning.load");

    if (label.csv) {
      message += "\n" + $tr("editor.warning.load.csv");
    }

    if (!confirm(message)) {
      return;
    }

    onLoadRequested(label);
    new Dropdown(dropdownRef).hide();
  };

  const onImportClicked = async () => {
    try {
      const contents = await FileUtils.pickAndReadSingleTextFile("json");
      const rawData = JSON.parse(contents);
      const imported = FileUtils.parseSingleOrList(rawData, ExportedLabelTemplateSchema);
      const items = imported.kind === "single" ? [imported.item] : imported.items;
      const { zodErrors, otherErrors } = LocalStoragePersistence.appendLabels(items);

      zodErrors.forEach((e) => Toasts.zodErrors(e, "Label import error:"));
      otherErrors.forEach((e) => Toasts.error(e));

      if (zodErrors.length !== 0 || otherErrors.length !== 0) {
        return;
      }

      savedLabels = LocalStoragePersistence.loadLabels();
      selectedIndex = -1;
      title = "";
      calcUsedSpace();

      Toasts.message(
        items.length === 1
          ? $tr("params.saved_labels.import.added_one")
          : $tr("params.saved_labels.import.added_many").replace("{count}", String(items.length)),
      );
    } catch (e) {
      if (e instanceof z.ZodError) {
        Toasts.zodErrors(e, "Label import error:");
      } else {
        Toasts.error(e);
      }
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

  const onExportAllClicked = () => {
    try {
      FileUtils.saveLabelsAsJson(savedLabels);
    } catch (e) {
      if (e instanceof z.ZodError) {
        Toasts.zodErrors(e, "Labels export error:");
      } else {
        Toasts.error(e);
      }
    }
  };

  const onExportPngClicked = () => {
    try {
      FileUtils.saveCanvasAsPng(canvas);
    } catch (e) {
      Toasts.zodErrors(e, "Canvas save error:");
    }
  };

  const onExportUrlClicked = async () => {
    try {
      const label = onRequestLabelTemplate();
      const url = await FileUtils.makeLabelUrl(label);

      if (url.length > 2000 && !confirm($tr("params.saved_labels.save.url.warn"))) {
        return;
      }

      navigator.clipboard.writeText(url);
      Toasts.message($tr("params.saved_labels.save.url.copied"));
    } catch (e) {
      Toasts.error(e);
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

      {#if csvEnabled}
        <div class="pt-3 text-warning">
            {$tr("params.saved_labels.save.withcsv")}
        </div>
      {/if}
    </h6>


    <div class="px-3">
      <div class="p-1">
        <button class="btn btn-sm btn-outline-secondary" onclick={onImportClicked}>
          <MdIcon icon="data_object" />
          {$tr("params.saved_labels.load.json")}
        </button>
        <div class="btn-group btn-group-sm">
          <button
            type="button"
            class="btn btn-outline-secondary dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false">
            <MdIcon icon="data_object" />
            {$tr("params.saved_labels.save.json")}
          </button>
          <ul class="dropdown-menu">
            <li><h6 class="dropdown-header">{$tr("params.saved_labels.export.current")}</h6></li>
            <li>
              <button class="dropdown-item" onclick={onExportClicked}>
                {$tr("params.saved_labels.export.json")}
              </button>
            </li>
            <li>
              <button class="dropdown-item" onclick={onExportPngClicked}>
                {$tr("params.saved_labels.export.png")}
              </button>
            </li>
            {#if !isStandalone}
              <li>
                <button class="dropdown-item" onclick={onExportUrlClicked}>
                  {$tr("params.saved_labels.save.url")}
                </button>
              </li>
            {/if}
            <li><hr class="dropdown-divider" /></li>
            <li><h6 class="dropdown-header">{$tr("params.saved_labels.export.all")}</h6></li>
            <li>
              <button class="dropdown-item" onclick={onExportAllClicked}>
                {$tr("params.saved_labels.export.json")}
              </button>
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
