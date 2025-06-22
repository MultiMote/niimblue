<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { tr } from "../../utils/i18n";
  import { iconCodepoints, type MaterialIcon } from "../../mdi_icons";
  import MdIcon from "../basic/MdIcon.svelte";

  export let onSubmit: (i: MaterialIcon) => void;

  let iconNames: MaterialIcon[] = [];
  let search: string = "";
  let dropdown: Element;

  const onShow = () => {
    if (iconNames.length === 0) {
      iconNames = Object.keys(iconCodepoints) as MaterialIcon[];
    }
  };

  onMount(() => {
    dropdown.addEventListener("show.bs.dropdown", onShow);
  });

  onDestroy(() => {
    dropdown.removeEventListener("show.bs.dropdown", onShow);
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
      <input type="text" class="form-control" placeholder={$tr("editor.iconpicker.search")} bind:value={search} />
      <div class="icons">
        {#each iconNames as name}
          {#if !search || name.includes(search.toLowerCase())}
            <button class="btn me-1" title={name} on:click={() => onSubmit(name)}>
              <MdIcon icon={name} />
            </button>
          {/if}
        {/each}
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
</style>
