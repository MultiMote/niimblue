<script lang="ts">
  import { onMount } from "svelte";
  import FaIcon from "./FaIcon.svelte";
  import { type IconName } from "@fortawesome/fontawesome-svg-core";
  import { tr } from "../utils/i18n";
  import type { MaterialIcon } from "material-icons";
  import { icons } from "../mdi_icons";

  export let onSubmit: (i: IconName) => void;

  let iconNames: MaterialIcon[] = [];
  let search: string = "";

  onMount(async () => {
    iconNames = Object.keys(icons) as MaterialIcon [];

    // iconNames = Object.values(fas)
    //   .map((e) => e.iconName)
    //   .filter((value, index, array) => array.indexOf(value) === index);
  });
</script>

<div class="dropdown">
  <button class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
    <FaIcon icon="face-laugh" />
    <FaIcon icon="plus" />
  </button>

  <div class="dropdown-menu">
    <h6 class="dropdown-header">{$tr("editor.iconpicker.title", "Add icon")}</h6>
    <div class="p-3">
      <input type="text" class="form-control" placeholder={$tr("editor.iconpicker.search", "Search")} bind:value={search} />
      <div class="icons">
        {#each iconNames as name}
          {#if !search || name.includes(search.toLowerCase())}
            <button class="btn me-1" title={name}>
              <!-- <FaIcon icon={name} /> -->
              <span class="material-icons">
                {String.fromCodePoint(icons[name])}
              </span>
            </button>
          {/if}
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .dropdown-menu {
    min-width: 400px;
  }
  .icons {
    max-height: 400px;
    overflow-y: scroll;
  }
</style>
