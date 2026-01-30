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
  }

  let { onSubmit, onSubmitSvg }: Props = $props();

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
      const data = await FileUtils.pickAndReadTextFile("svg");
      userIcons.update((prev) => [
        ...prev,
        {
          name: `i_${FileUtils.timestampFloat()}`,
          data,
        },
      ]);
    } catch (e) {
      Toasts.error(e);
    }
  };

  const svgClicked = (name: string, data: string) => {
    if (deleteMode) {
      userIcons.update((prev) => prev.filter(e => e.name !== name));
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
  <button class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
    <MdIcon icon="emoji_emotions" />
    <MdIcon icon="add" />
  </button>

  <div class="dropdown-menu">
    <h6 class="dropdown-header">{$tr("editor.iconpicker.title")}</h6>
    <div class="p-3">
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
              class="btn {deleteMode ? 'btn-danger' : 'btn-light'} me-1 user-icon"
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
  .dropdown-menu {
    width: 100vw;
    max-width: 450px;
  }
  .icons {
    max-height: 400px;
    overflow-y: scroll;
  }
  .user-icon img {
    width: 24px;
  }
</style>
