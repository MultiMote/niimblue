<script lang="ts">
  import { FileUtils } from "$/utils/file_utils";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { tr } from "$/utils/i18n";
  import { Toasts } from "$/utils/toasts";
  import AppModal from "$/components/basic/AppModal.svelte";
  import { addZplObjectsToCanvas, parseZpl } from "$/utils/zpl/zpl_import";
  import { canvasToZpl } from "$/utils/zpl/zpl_export";
  import type { CustomCanvas } from "$/fabric-object/custom_canvas";
  import type { FabricObject } from "fabric";

  interface Props {
    canvas: CustomCanvas;
    onObjectsImported?: () => void;
    onLabelSize?: (size: { width: number; height: number }) => void;
    onClose?: () => void;
  }

  let example = `^XA
^PW240
^LL160
^FO20,16^A0N,28,28^FDHello NiimBlue^FS
^FO20,52^GB200,4,4^FS
^FO20,70^BQN,2,4^FDQA,https://niim.blue^FS
^XZ`;

  const placeholder = "^XA\n^XZ";

  let { canvas, onObjectsImported, onLabelSize, onClose }: Props = $props();
  let modalRef: AppModal;
  let zplText = $state("");
  let warnings = $state<string[]>([]);
  let importInProgress = $state(false);

  const exportCurrent = (): string => {
    const result = canvasToZpl(canvas);
    warnings =
      canvas.getObjects().length === 0 ? [$tr("editor.export.zpl.empty"), ...result.warnings] : result.warnings;
    zplText = result.zpl;
    return result.zpl;
  };

  const resolveSource = (): string => (zplText.trim() ? zplText : exportCurrent());

  const copyZpl = async () => {
    const source = resolveSource();
    if (!source.trim()) return;
    try {
      await navigator.clipboard.writeText(source);
      Toasts.message($tr("editor.export.zpl.copied"));
    } catch (e) {
      Toasts.error(e);
    }
  };

  const downloadZpl = () => {
    const source = resolveSource();
    if (!source.trim()) return;
    FileUtils.saveTextFile(`label_${FileUtils.timestamp()}.zpl`, source);
  };

  const loadFromFile = async () => {
    try {
      zplText = await FileUtils.pickAndReadSingleTextFile("zpl");
    } catch (e) {
      Toasts.error(e);
    }
  };

  const applyParsedLabelSize = (labelWidth?: number, labelHeight?: number): boolean => {
    const width = Math.max(1, Math.round(labelWidth ?? canvas.getWidth()));
    const height = Math.max(1, Math.round(labelHeight ?? canvas.getHeight()));
    if (width === canvas.getWidth() && height === canvas.getHeight()) {
      return false;
    }
    canvas.setDimensions({ width, height });
    onLabelSize?.({ width, height });
    return true;
  };

  const isOutsideLabel = (obj: FabricObject): boolean =>
    (obj.left ?? 0) + obj.getScaledWidth() > canvas.getWidth() ||
    (obj.top ?? 0) + obj.getScaledHeight() > canvas.getHeight();

  const importAsObjects = async () => {
    const source = zplText.trim();

    if (!source) {
      warnings = [$tr("editor.import.zpl.empty")];
      return;
    }

    importInProgress = true;

    try {
      const result = parseZpl(source, { fidelity: "exact" });
      warnings = result.warnings;

      if (result.objects.length === 0) {
        return;
      }

      canvas.clear();

      const resized = applyParsedLabelSize(result.labelWidth, result.labelHeight);
      const created = await addZplObjectsToCanvas(canvas, result.objects);

      if (created.length === 0) {
        return;
      }

      canvas.setActiveObject(created[created.length - 1]!);
      onObjectsImported?.();
      modalRef.hide();
      Toasts.message($tr("editor.import.zpl.success").replace("{n}", String(created.length)));
      if (resized) {
        Toasts.message(
          $tr("editor.import.zpl.resized")
            .replace("{w}", String(canvas.getWidth()))
            .replace("{h}", String(canvas.getHeight())),
        );
      } else if (created.some(isOutsideLabel)) {
        Toasts.message($tr("editor.import.zpl.overflow"));
      }
    } catch (e) {
      Toasts.error(e);
    } finally {
      importInProgress = false;
    }
  };
</script>

<AppModal title={$tr("editor.import.zpl.title")} {onClose} bind:this={modalRef} size="lg" tall>
  <textarea class="form-control font-monospace zpl-input" {placeholder} rows="8" bind:value={zplText}></textarea>

  <div>
    <button class="btn btn-sm p-0 text-muted" onclick={() => (zplText = example)}
      >{$tr("editor.import.zpl.example")}</button>
  </div>

  {#if warnings.length > 0}
    <div class="alert alert-warning mt-2 mb-0" role="alert">
      {#each warnings as warning (warning)}
        <div>{warning}</div>
      {/each}
    </div>
  {/if}

  {#snippet footer()}
    <div class="zpl-footer-actions">
      <div class="zpl-footer-group">
        <button class="btn btn-sm btn-secondary" type="button" onclick={loadFromFile}>
          <MdIcon icon="folder_open" />
          {$tr("editor.import.zpl.file")}
        </button>
        <button class="btn btn-sm btn-secondary" type="button" onclick={exportCurrent}>
          <MdIcon icon="ios_share" />
          {$tr("editor.export.zpl.current")}
        </button>
        <button class="btn btn-sm btn-secondary" type="button" onclick={copyZpl}>
          <MdIcon icon="content_copy" />
          {$tr("editor.export.zpl.copy")}
        </button>
        <button class="btn btn-sm btn-secondary" type="button" onclick={downloadZpl}>
          <MdIcon icon="download" />
          {$tr("editor.export.zpl.download")}
        </button>
      </div>
      <div class="zpl-footer-group zpl-footer-import">
        <button class="btn btn-sm btn-primary" type="button" disabled={importInProgress} onclick={importAsObjects}>
          <MdIcon icon="layers" />
          {$tr("editor.import.zpl.objects")}
        </button>
      </div>
    </div>
  {/snippet}
</AppModal>

<style>
  .zpl-input {
    font-size: 0.82rem;
    height: 100%;
    resize: none;
  }

  .zpl-footer-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    width: 100%;
    justify-content: space-between;
    align-items: center;
  }

  .zpl-footer-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: center;
  }
</style>
