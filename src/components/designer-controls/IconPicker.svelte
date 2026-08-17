<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { tr } from "$/utils/i18n";
  import { iconCodepoints, type MaterialIcon } from "$/styles/mdi_icons";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { appConfig, userIcons } from "$/stores";
  import { FileUtils } from "$/utils/file_utils";
  import { Toasts } from "$/utils/toasts";

  interface Props {
    onSubmit: (i: MaterialIcon) => void;
    onSubmitSvg: (i: string) => void;
    labeled?: boolean;
  }

  let { onSubmit, onSubmitSvg, labeled = false }: Props = $props();

  let iconNames = $state<MaterialIcon[]>([]);
  let search = $state<string>("");
  let deleteMode = $state<boolean>(false);
  let dropdown: HTMLDivElement;

  const onShow = () => {
    if (iconNames.length === 0) {
      iconNames = Object.keys(iconCodepoints) as MaterialIcon[];
    }
  };

  const addOwn = async () => {
    try {
      let counter = 0;
      const xmls = await FileUtils.pickAndReadTextFile("svg", true);
      const iconsToAdd = xmls.map((xml) => ({
        name: `i_${FileUtils.timestampFloat()}_${counter++}`,
        data: xml,
      }));

      userIcons.update((prev) => [...prev, ...iconsToAdd]);
    } catch (e) {
      Toasts.error(e);
    }
  };

  const svgClicked = (name: string, data: string) => {
    if (deleteMode) {
      userIcons.update((prev) => prev.filter((e) => e.name !== name));
      return;
    }

    onSubmitSvg(data);
  };

  const iconClicked = (i: MaterialIcon) => {
    if (deleteMode) {
      return;
    }

    onSubmit(i);
  };

  onMount(() => {
    dropdown?.addEventListener("show.bs.dropdown", onShow);
  });

  onDestroy(() => {
    dropdown?.removeEventListener("show.bs.dropdown", onShow);
  });
</script>

<div class="dropdown" bind:this={dropdown}>
  <button
    class={labeled ? "tool-btn" : "btn btn-sm btn-secondary"}
    data-bs-toggle="dropdown"
    data-bs-auto-close="outside"
    title={$tr("editor.iconpicker.title")}>
    <MdIcon icon="emoji_emotions" />
    {#if labeled}
      <span class="tool-btn-label">{$tr("editor.rail.icon")}</span>
    {:else}
      <MdIcon icon="add" />
    {/if}
  </button>

  <div class="dropdown-menu icon-picker-menu">
    <h6 class="dropdown-header">{$tr("editor.iconpicker.title")}</h6>
    <div class="icon-picker-body p-3">
      <input
        disabled={$appConfig.iconListMode === "user"}
        type="text"
        class="form-control mb-1"
        placeholder={$tr("editor.iconpicker.search")}
        bind:value={search} />

      <div class="input-group input-group-sm mb-1">
        <span class="input-group-text">{$tr("editor.iconpicker.show")}</span>
        <select class="form-select form-select-sm" bind:value={$appConfig.iconListMode}>
          <option value="both">{$tr("editor.iconpicker.show.both")}</option>
          <option value="user">{$tr("editor.iconpicker.show.user")}</option>
          <option value="pack">{$tr("editor.iconpicker.show.pack")}</option>
        </select>
      </div>

      <div class="icons mb-1">
        {#if $appConfig.iconListMode === "both" || $appConfig.iconListMode === "user"}
          {#each $userIcons as { name, data } (name)}
            <button
              class="btn {deleteMode ? 'btn-danger' : 'btn-light'} me-1 mb-1 user-icon"
              onclick={() => svgClicked(name, data)}>
              <img src="data:image/svg+xml;base64,{FileUtils.base64str(data)}" alt="user-svg" />
            </button>
          {/each}
        {/if}

        {#if $appConfig.iconListMode === "both" || $appConfig.iconListMode === "pack"}
          {#each iconNames as name (name)}
            {#if !search || name.includes(search.toLowerCase())}
              <button class="btn me-1" title={name} onclick={() => iconClicked(name)}>
                <MdIcon icon={name} />
              </button>
            {/if}
          {/each}
        {/if}
      </div>

      <div class="input-group input-group-sm mb-1">
        <button class="btn btn-outline-secondary" onclick={addOwn}>
          <MdIcon icon="add" />

          {$tr("editor.iconpicker.add")}
        </button>
        <button
          class="btn {deleteMode ? 'btn-danger' : 'btn-outline-secondary'}"
          onclick={() => (deleteMode = !deleteMode)}>
          <MdIcon icon="delete" />
          {$tr("editor.iconpicker.delete_mode")}
        </button>
      </div>

      <a
        href="https://fonts.google.com/icons?icon.set=Material+Icons&icon.style=Filled"
        target="_blank"
        class="text-secondary">
        {$tr("editor.iconpicker.mdi_link_title")}
      </a>
    </div>
  </div>
</div>

<style>
  .icon-picker-menu {
    width: min(100vw - 1.5rem, 450px);
  }

  .icons {
    max-height: min(400px, 50dvh);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  :global(.dropdown-menu-sheet.icon-picker-menu) {
    width: min(calc(100vw - 1.5rem), 28rem) !important;
  }

  :global(.dropdown-menu-sheet) .icon-picker-body {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  :global(.dropdown-menu-sheet) .icons {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none;
    overflow-y: auto;
  }

  .user-icon img {
    width: 24px;
  }
</style>
