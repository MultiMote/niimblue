<script lang="ts">
  import AppModal from "$/components/basic/AppModal.svelte";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { userFonts } from "$/stores";
  import { FileUtils } from "$/utils/file_utils";
  import { tr } from "$/utils/i18n";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import { Toasts } from "$/utils/toasts";

  let show = $state<boolean>(false);
  let usedSpace = $state<number>(0);
  let selectExt = $state<"ttf" | "woff2">("ttf");
  let overrideFamily = $state<string>("");

  const calcUsedSpace = () => {
    usedSpace = LocalStoragePersistence.usedSpace();
  };

  const browseFont = async () => {
    const fileList = await FileUtils.pickFileAsync(selectExt, false);
    const file: File = fileList[0];
    const ext = file.name.split(".").pop();
    const mime = `text/${selectExt}`;

    let fontName = file.name.split(".")[0];

    if (overrideFamily.trim() !== "") {
      fontName = overrideFamily.trim();
    }


    if (ext !== selectExt) {
      throw new Error(`Only ${selectExt} allowed`);
    }

    if ($userFonts.some((e) => e.family == fontName)) {
      Toasts.error(`${fontName} already loaded`);
      return;
    }
    const dataUrl = await FileUtils.blobToDataUrl(file);

    userFonts.update((prev) => [
      ...prev,
      { base64data: dataUrl.split(";base64,")[1], family: fontName, mimeType: mime },
    ]);

    calcUsedSpace();
    overrideFamily = "";
  };

  const removeFont = (family: string) => {
    userFonts.update((prev) => prev.filter((e) => e.family !== family));
    calcUsedSpace();
  };

  $effect(() => {
    if (show) calcUsedSpace();
  });
</script>

<button
  class="btn btn-secondary"
  onclick={() => {
    show = true;
  }}>
  <MdIcon icon="settings" />
</button>

{#if show}
  <AppModal title="Custom fonts" bind:show>
    <div class="mb-1">
      {usedSpace}
      {$tr("params.saved_labels.kb_used")}
    </div>
    <div class="mb-1">
      {#each $userFonts as font (font.family)}
        <div class="input-group input-group-sm">
          <span class="input-group-text fs-5" style="font-family: {font.family}">{font.family}</span>
          <button class="btn btn-sm btn-danger" onclick={() => removeFont(font.family)}>x</button>
        </div>
      {/each}
    </div>

    <div class="input-group input-group-sm">
      <span class="input-group-text">Add font</span>

      <select class="form-select" bind:value={selectExt}>
        <option value="ttf">ttf</option>
        <option value="woff2">woff2</option>
      </select>

      <input type="text" class="form-control w-50" placeholder="Override font name" bind:value={overrideFamily} />

      <button class="btn btn-sm btn-secondary" onclick={browseFont}> Browse... </button>
    </div>
  </AppModal>
{/if}
