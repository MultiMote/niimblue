<script lang="ts">
  import { tr } from "$/utils/i18n";
  import { onMount } from "svelte";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import SavedLabelsBrowser from "$/components/designer-controls/SavedLabelsBrowser.svelte";
  import { ExportedLabelTemplateSchema, type ExportedLabelTemplate } from "$/types";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import { Toasts } from "$/utils/toasts";
  import { FileUtils } from "$/utils/file_utils";
  import * as fabric from "fabric";
  import { Utils } from "@mmote/niimbluelib";
  import { z } from "zod";
  import AppModal from "$/components/basic/AppModal.svelte";
  import { appConfirm } from "$/stores/confirm";
  import { appConfig } from "$/stores/app";

  interface Props {
    onRequestLabelTemplate: () => ExportedLabelTemplate;
    onLoadRequested: (label: ExportedLabelTemplate) => void;
    onClose?: () => void;
    onSave?: () => void;
    canvas: fabric.Canvas;
    csvEnabled: boolean;
    hasUnsavedChanges: boolean;
  }

  let { onRequestLabelTemplate, onLoadRequested, canvas, csvEnabled, onClose, onSave, hasUnsavedChanges }: Props =
    $props();

  let savedLabels = $state<ExportedLabelTemplate[]>([]);
  let selectedIndex = $state<number>(-1);
  let title = $state<string>("");
  let usedSpace = $state<number>(0);
  let customDefaultTemplate = $state<boolean>(LocalStoragePersistence.hasCustomDefaultTemplate());
  let isStandalone = Utils.getAvailableTransports().capacitorBle;
  let modalRef: AppModal;
  let sortMode = $derived($appConfig.savedLabelsSortMode ?? "date_asc");

  const sortAndAssign = (labels: ExportedLabelTemplate[]) => {
    if (sortMode === "title_asc") {
      savedLabels = [...labels].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    } else if (sortMode === "title_desc") {
      savedLabels = [...labels].sort((a, b) => (b.title ?? "").localeCompare(a.title ?? ""));
    } else if (sortMode === "date_asc") {
      savedLabels = [...labels].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    } else {
      savedLabels = [...labels].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    }
  };

  const toggleSortType = () => {
    let newMode = sortMode;

    if (sortMode.startsWith("date")) {
      newMode = sortMode === "date_desc" ? "title_desc" : "title_asc";
    } else {
      newMode = sortMode === "title_desc" ? "date_desc" : "date_asc";
    }

    $appConfig.savedLabelsSortMode = newMode;

    sortAndAssign(LocalStoragePersistence.loadLabels());
    selectedIndex = -1;
    title = "";
  };

  const toggleSortDirection = () => {
    let newMode = sortMode;

    if (sortMode === "date_desc") {
      newMode = "date_asc";
    } else if (sortMode === "date_asc") {
      newMode = "date_desc";
    } else if (sortMode === "title_asc") {
      newMode = "title_desc";
    } else if (sortMode === "title_desc") {
      newMode = "title_asc";
    }

    $appConfig.savedLabelsSortMode = newMode;

    sortAndAssign(LocalStoragePersistence.loadLabels());
    selectedIndex = -1;
    title = "";
  };

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

    sortAndAssign(result);
    title = "";
    calcUsedSpace();
  };

  const saveLabels = (labels: ExportedLabelTemplate[]) => {
    const { zodErrors, otherErrors } = LocalStoragePersistence.saveLabels(labels);
    zodErrors.forEach((e) => Toasts.zodErrors(e, "Label save error"));
    otherErrors.forEach((e) => Toasts.error(e));

    if (zodErrors.length === 0 && otherErrors.length === 0) {
      sortAndAssign(labels);
    }

    calcUsedSpace();
    onSave?.();
  };

  const onSaveReplaceClicked = async () => {
    if (selectedIndex === -1) {
      return;
    }

    const confirmResult = await appConfirm({
      title: $tr("editor.warning.save"),
      buttons: ["yes", "no"],
    });

    if (confirmResult !== "yes") {
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
    onSave?.();
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

  const onLoadClicked = async () => {
    if (selectedIndex === -1) {
      return;
    }

    const label = savedLabels[selectedIndex];

    let message = "";

    if (hasUnsavedChanges) {
      message = $tr("editor.warning.load");
    }

    if (label.csv) {
      if (message) {
        message += "\n";
      }
      message += "\n" + $tr("editor.warning.load.csv");
    }

    if (message) {
      const confirmResult = await appConfirm({
        title: message,
        buttons: ["yes", "no"],
      });

      if (confirmResult !== "yes") {
        return;
      }
    }

    onLoadRequested(label);
    modalRef.hide();
  };

  const onImportClicked = async () => {
    try {
      const contents = await FileUtils.pickAndReadSingleTextFile("json");
      const rawData = JSON.parse(contents);
      const imported = FileUtils.parseSingleOrList(rawData, ExportedLabelTemplateSchema);
      const items = imported.kind === "single" ? [imported.item] : imported.items;

      if (items.length === 0) {
        return;
      }

      const { zodErrors, otherErrors } = LocalStoragePersistence.appendLabels(items);

      zodErrors.forEach((e) => Toasts.zodErrors(e, "Label import error:"));
      otherErrors.forEach((e) => Toasts.error(e));

      if (zodErrors.length !== 0 || otherErrors.length !== 0) {
        return;
      }

      sortAndAssign(LocalStoragePersistence.loadLabels());
      selectedIndex = -1;
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
      onSave?.();
    } catch (e) {
      Toasts.zodErrors(e, "Canvas save error:");
    }
  };

  const onExportAllClicked = () => {
    try {
      FileUtils.saveLabelsAsJson(savedLabels);
      onSave?.();
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

      if (url.length > 2000) {
        const confirmResult = await appConfirm({
          title: $tr("params.saved_labels.save.url.warn"),
          buttons: ["yes", "no"],
        });

        if (confirmResult !== "yes") {
          return;
        }
      }

      navigator.clipboard.writeText(url);
      Toasts.message($tr("params.saved_labels.save.url.copied"));
      onSave?.();
    } catch (e) {
      Toasts.error(e);
    }
  };

  onMount(() => {
    sortAndAssign(LocalStoragePersistence.loadLabels());
    calcUsedSpace();
  });
</script>

<AppModal title={$tr("params.saved_labels.menu_title")} {onClose} bind:this={modalRef} size="lg">
  <div class="mb-1">
    {usedSpace}
    {$tr("params.saved_labels.kb_used")}

    {#if csvEnabled}
      <div class="pt-1 text-warning">
        {$tr("params.saved_labels.save.withcsv")}
      </div>
    {/if}
  </div>

  <div class="mb-1 d-flex align-items-center gap-1">
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

    <div class="btn-group btn-group-sm ms-auto">
      <button class="btn btn-outline-secondary" onclick={toggleSortType}>
        <MdIcon icon={sortMode.startsWith("date") ? "schedule" : "sort_by_alpha"} />
      </button>
      <button class="btn btn-outline-secondary" onclick={toggleSortDirection}>
        <MdIcon icon={["date_desc", "title_desc"].includes(sortMode) ? "arrow_downward" : "arrow_upward"} />
      </button>
    </div>
  </div>

  <SavedLabelsBrowser
    class="mb-1"
    {selectedIndex}
    labels={savedLabels}
    onItemClicked={onLabelSelected}
    onItemDelete={onLabelDelete}
    onItemExport={onLabelExport} />

  <div class="input-group flex-nowrap input-group-sm">
    <span class="input-group-text">{$tr("params.saved_labels.label_title")}</span>
    <input
      class="form-control"
      type="text"
      placeholder={$tr("params.saved_labels.label_title.placeholder")}
      bind:value={title} />
  </div>

  {#snippet footer()}
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
  {/snippet}
</AppModal>

<style>
  .make-default {
    margin-right: auto;
  }
</style>
