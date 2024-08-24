<script lang="ts">
  import FaIcon from "./FaIcon.svelte";
  import { type OjectType } from "../types";

  export let onSubmit: (i: OjectType) => void;
</script>

<div class="dropdown">
  <button class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" data-bs-auto-close="outside">
    <FaIcon icon="vector-square" />
    <FaIcon icon="plus" />
  </button>

  <div class="dropdown-menu">
    <h6 class="dropdown-header">Add object</h6>
    <div class="p-3">
      <button class="btn me-1" on:click={() => onSubmit("text")}>
        <FaIcon icon="font" /> Text
      </button>
      <button class="btn me-1" on:click={() => onSubmit("line")}>
        <FaIcon icon="minus" /> Line
      </button>
      <button class="btn me-1" on:click={() => onSubmit("rectangle")}>
        <FaIcon icon="vector-square" /> Rectangle
      </button>
      <button class="btn me-1" on:click={() => onSubmit("circle")}>
        <FaIcon icon="circle-dot" /> Circle
      </button>

      <button class="btn me-1" on:click={() => onSubmit("image")}>
        <FaIcon icon="image" /> Image
      </button>
    </div>
  </div>
</div>

<style>
  .dropdown-menu {
    min-width: 400px;
  }
</style>
