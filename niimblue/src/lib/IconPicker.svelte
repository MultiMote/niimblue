<script lang="ts">
  import { onMount } from "svelte";
  import FaIcon from "./FaIcon.svelte";
  import { type IconName } from "@fortawesome/fontawesome-svg-core";

  export let onSubmit: (i: IconName) => void;

  let iconNames: IconName[] = [];
  let search: string = "";

  onMount(async () => {
    const { fas } = await import("@fortawesome/free-solid-svg-icons");

    iconNames = Object.values(fas)
      .map((e) => e.iconName)
      .filter((value, index, array) => array.indexOf(value) === index);
  });
</script>

<div class="dropdown">
  <button class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
    <FaIcon icon="face-laugh" />
    <FaIcon icon="plus" />
  </button>

  <div class="dropdown-menu">
    <h6 class="dropdown-header">Add icon</h6>
    <div class="p-3">
      <input type="text" class="form-control" placeholder="Search" bind:value={search} />
      <div class="icons">
        {#each iconNames as name}
          {#if !search || name.includes(search.toLowerCase())}
            <button class="btn me-1" title={name} on:click={() => onSubmit(name)}>
              <FaIcon icon={name} />
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
