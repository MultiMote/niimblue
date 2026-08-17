<script lang="ts">
  import type { LabelProps } from "$/types";
  import { FileUtils } from "$/utils/file_utils";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { tr } from "$/utils/i18n";
  import { Toasts } from "$/utils/toasts";
  import AppModal from "$/components/basic/AppModal.svelte";
  import { addZplObjectsToCanvas, parseZpl, renderZplToPngBlob, type ZplFidelity } from "$/utils/zpl_import";
  import { canvasToZpl } from "$/utils/zpl_export";
  import type { CustomCanvas } from "$/fabric-object/custom_canvas";

  interface Props {
    labelProps: LabelProps;
    canvas?: CustomCanvas;
    onImageReady: (img: Blob) => void;
    onObjectsImported?: () => void;
    onLabelSize?: (size: { width: number; height: number }) => void;
  }

  let { labelProps, canvas, onImageReady, onObjectsImported, onLabelSize }: Props = $props();
  let modalRef = $state<AppModal | undefined>();

  const closeModal = () => {
    modalRef?.hide();
  };
  let show = $state(false);
  let zplText = $state("");
  let warnings = $state<string[]>([]);
  let importState = $state<"idle" | "processing" | "error">("idle");

  const placeholder = `^XA
^FO20,16^A0N,28,28^FDHello NiimBlue^FS
^FO20,52^GB200,4,4^FS
^FO20,70^BQN,2,4^FDQA,https://niim.blue^FS
^XZ`;

  const openModal = () => {
    warnings = [];
    show = true;
  };

  const exportCurrent = () => {
    if (!canvas) {
      Toasts.error("Canvas is not ready");
      return "";
    }

    const result = canvasToZpl(canvas);
    warnings = result.warnings;
    zplText = result.zpl;
    if (canvas.getObjects().length === 0) {
      warnings = [$tr("editor.export.zpl.empty"), ...result.warnings];
    }
    return result.zpl;
  };

  const copyZpl = async () => {
    const source = zplText.trim() ? zplText : exportCurrent();
    if (!source.trim()) return;
    try {
      await navigator.clipboard.writeText(source);
      Toasts.message($tr("editor.export.zpl.copied"));
    } catch (e) {
      Toasts.error(e);
    }
  };

  const downloadZpl = () => {
    const source = zplText.trim() ? zplText : exportCurrent();
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
    if (!canvas) return false;
    const width = Math.max(1, Math.round(labelWidth ?? canvas.getWidth()));
    const height = Math.max(1, Math.round(labelHeight ?? canvas.getHeight()));
    if (width === canvas.getWidth() && height === canvas.getHeight()) {
      return false;
    }
    canvas.setDimensions({ width, height });
    onLabelSize?.({ width, height });
    return true;
  };

  const importAsObjects = async (fidelity: ZplFidelity) => {
    if (!canvas) {
      Toasts.error("Canvas is not ready");
      return;
    }

    const source = zplText.trim();
    if (!source) {
      warnings = [$tr("editor.import.zpl.empty")];
      return;
    }

    importState = "processing";
    try {
      const result = parseZpl(source, { fidelity });
      warnings = result.warnings;

      if (result.objects.length === 0) {
        importState = "idle";
        return;
      }

      const resized = applyParsedLabelSize(result.labelWidth, result.labelHeight);
      const created = await addZplObjectsToCanvas(canvas, result.objects);
      if (created.length === 0) {
        importState = "idle";
        return;
      }

      const overflow = created.some(
        (obj) =>
          (obj.left ?? 0) + (obj.getScaledWidth?.() ?? obj.width ?? 0) > canvas.getWidth() ||
          (obj.top ?? 0) + (obj.getScaledHeight?.() ?? obj.height ?? 0) > canvas.getHeight(),
      );
      canvas.setActiveObject(created[created.length - 1]!);
      onObjectsImported?.();
      closeModal();
      Toasts.message($tr("editor.import.zpl.success").replace("{n}", String(created.length)));
      if (resized) {
        Toasts.message(
          $tr("editor.import.zpl.resized")
            .replace("{w}", String(canvas.getWidth()))
            .replace("{h}", String(canvas.getHeight())),
        );
      } else if (overflow) {
        Toasts.message($tr("editor.import.zpl.overflow"));
      }
      importState = "idle";
    } catch (e) {
      importState = "error";
      Toasts.error(e);
    }
  };

  const importAsImage = async () => {
    const source = zplText.trim();
    if (!source) {
      warnings = [$tr("editor.import.zpl.empty")];
      return;
    }

    importState = "processing";

    try {
      const result = parseZpl(source);
      warnings = result.warnings;
      if (result.objects.length === 0) {
        importState = "error";
        warnings = [$tr("editor.import.zpl.image_error"), ...result.warnings];
        return;
      }

      const width = Math.max(1, Math.round(result.labelWidth ?? labelProps.size.width));
      const height = Math.max(1, Math.round(result.labelHeight ?? labelProps.size.height));
      applyParsedLabelSize(result.labelWidth, result.labelHeight);

      const img = await renderZplToPngBlob(result.objects, width, height);
      if (!img) {
        importState = "error";
        warnings = [$tr("editor.import.zpl.image_error"), ...result.warnings];
        return;
      }

      onImageReady(img);
      importState = "idle";
      closeModal();
    } catch (e) {
      importState = "error";
      Toasts.error(e);
    }
  };
</script>

<button class="tool-btn tool-import-btn" onclick={openModal} title={$tr("editor.import.zpl")}>
  <MdIcon icon="code" />
  <span class="tool-btn-label">{$tr("editor.import.zpl")}</span>
</button>

{#if show}
  <AppModal title={$tr("editor.import.zpl.title")} bind:show bind:this={modalRef} size="lg" tall>
    <div class="zpl-modal-body">
      <p class="text-secondary small mb-2">{$tr("editor.import.zpl.hint")}</p>
      <textarea
        class="form-control font-monospace zpl-input"
        rows="8"
        placeholder={placeholder}
        bind:value={zplText}></textarea>

      {#if warnings.length > 0}
        <div class="alert alert-warning mt-2 mb-0" role="alert">
          {#each warnings as warning (warning)}
            <div>{warning}</div>
          {/each}
        </div>
      {/if}
    </div>

    {#snippet footer()}
      <div class="zpl-footer-actions">
        <div class="zpl-footer-group">
          <button class="btn btn-sm btn-secondary" type="button" onclick={loadFromFile} title={$tr("editor.import.zpl.file")}>
            <MdIcon icon="folder_open" />
            {$tr("editor.import.zpl.file")}
          </button>
          <button class="btn btn-sm btn-secondary" type="button" onclick={exportCurrent} title={$tr("editor.export.zpl.current")}>
            <MdIcon icon="ios_share" />
            {$tr("editor.export.zpl.current")}
          </button>
          <button class="btn btn-sm btn-secondary" type="button" onclick={copyZpl} title={$tr("editor.export.zpl.copy")}>
            <MdIcon icon="content_copy" />
            {$tr("editor.export.zpl.copy")}
          </button>
          <button class="btn btn-sm btn-secondary" type="button" onclick={downloadZpl} title={$tr("editor.export.zpl.download")}>
            <MdIcon icon="download" />
            {$tr("editor.export.zpl.download")}
          </button>
        </div>
        <div class="zpl-footer-group zpl-footer-import">
          <button
            class="btn btn-sm btn-secondary"
            type="button"
            disabled={importState === "processing"}
            onclick={importAsImage}
            title={$tr("editor.import.zpl.image")}>
            <MdIcon icon="image" />
            {#if importState === "processing"}
              <MdIcon icon="hourglass_top" />
            {/if}
            {$tr("editor.import.zpl.image")}
          </button>
          <button
            class="btn btn-sm btn-secondary"
            type="button"
            disabled={importState === "processing"}
            onclick={() => importAsObjects("simplified")}
            title={$tr("editor.import.zpl.objects.simplified")}>
            <MdIcon icon="layers" />
            {$tr("editor.import.zpl.objects.simplified")}
          </button>
          <button
            class="btn btn-sm btn-primary"
            type="button"
            disabled={importState === "processing"}
            onclick={() => importAsObjects("exact")}
            title={$tr("editor.import.zpl.objects.exact")}>
            <MdIcon icon="layers" />
            {$tr("editor.import.zpl.objects.exact")}
          </button>
        </div>
      </div>
    {/snippet}
  </AppModal>
{/if}

<style>
  .zpl-modal-body {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1 1 auto;
    height: 100%;
  }

  .zpl-input {
    font-size: 0.82rem;
    flex: 1 1 auto;
    min-height: 8rem;
    height: auto;
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
