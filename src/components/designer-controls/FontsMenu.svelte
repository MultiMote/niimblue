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
    const result = await FileUtils.pickAndReadBinaryFile(selectExt);

    let fontName = result.name.split(".")[0];
    const mime = `text/${selectExt}`;

    if (overrideFamily.trim() !== "") {
      fontName = overrideFamily.trim();
    }

    if ($userFonts.some((e) => e.family == fontName)) {
      Toasts.error(`${fontName} already loaded`);
      return;
    }

    const compressed = await FileUtils.compressData(result.data);
    const b64data = await FileUtils.base64buf(compressed);

    userFonts.update((prev) => [...prev, { gzippedDataB64: b64data, family: fontName, mimeType: mime }]);

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
  class="btn btn-outline-secondary"
  onclick={() => {
    show = true;
  }}>
  <MdIcon icon="settings" />
</button>

{#if show}
  <AppModal title={$tr("fonts.title")} bind:show>
    <div class="mb-1">
      {#each $userFonts as font (font.family)}
        <div class="input-group input-group-sm mb-1">
          <span class="input-group-text fs-5" style="font-family: {font.family}">{font.family}</span>
          <button class="btn btn-sm btn-danger" onclick={() => removeFont(font.family)}>
            <MdIcon icon="delete" />
          </button>
        </div>
      {:else}
        👀
      {/each}
    </div>

    <hr />

    <div class="input-group input-group-sm">
      <span class="input-group-text">{$tr("fonts.add")}</span>

      <select class="form-select" bind:value={selectExt}>
        <option value="ttf">ttf</option>
        <option value="woff2">woff2</option>
      </select>

      <input type="text" class="form-control w-25" placeholder={$tr("fonts.title_override")} bind:value={overrideFamily} />

      <button class="btn btn-sm btn-secondary" onclick={browseFont}>{$tr("fonts.browse")}</button>
    </div>

    {#snippet footer()}
      <div class="text-secondary">
        {usedSpace}
        {$tr("params.saved_labels.kb_used")} |
        <a class="text-secondary" href="https://fonts.google.com">{$tr("fonts.gfonts")}</a>
      </div>
    {/snippet}
  </AppModal>
{/if}
