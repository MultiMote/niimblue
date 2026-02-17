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

  const calcUsedSpace = () => {
    usedSpace = LocalStoragePersistence.usedSpace();
  };

  const reloadFonts = () => {
    FileUtils.loadFonts($userFonts);
  };

  const browseFont = async () => {
    const fileList = await FileUtils.pickFileAsync(selectExt, false);
    const file: File = fileList[0];
    const ext = file.name.split(".").pop();
    const basename = file.name.split(".")[0];
    const mime = `text/${selectExt}`;

    if (ext !== selectExt) {
      throw new Error(`Only ${selectExt} allowed`);
    }

    if ($userFonts.some((e) => e.family == basename)) {
      Toasts.error(`${basename} already loaded`);
      return;
    }
    const dataUrl = await FileUtils.blobToDataUrl(file);

    userFonts.update((prev) => [
      ...prev,
      { base64data: dataUrl.split(";base64,")[1], family: basename, mimeType: mime },
    ]);
  };

  const removeFont = (family: string) => {
    userFonts.update((prev) => prev.filter(e => e.family !== family));
  }

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
    <div>
      {usedSpace}
      {$tr("params.saved_labels.kb_used")}
    </div>
    <div>
      {#each $userFonts as font (font.family)}
        <div>
          <span style="font-family: {font.family}">{font.family}</span>
          <button class="btn btn-sm btn-danger" onclick={ () => removeFont(font.family)}>x</button>
        </div>
      {/each}
    </div>
    <div>
      <select bind:value={selectExt}>
        <option value="ttf">ttf</option>
        <option value="woff2">woff2</option>
      </select>

      <button class="btn btn-sm btn-secondary" onclick={browseFont}> Browse... </button>
    </div>
    <div>
      <button class="btn btn-primary" onclick={reloadFonts}>Reload fonts</button>
    </div>
  </AppModal>
{/if}
