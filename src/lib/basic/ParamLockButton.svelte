<script lang="ts">
  import MdIcon from "./MdIcon.svelte";
  export let propName: string;
  export let savedValue: any;
  export let value: any;
  export let onClick: (key: string, value: any) => void;
</script>

<button class="btn btn-sm btn-outline-secondary param-lock-btn" on:click={() => onClick(propName, value)}>
  {#if savedValue}
    <MdIcon icon="lock" class="text-warning" />
  {:else}
    <MdIcon icon="lock_open" />
  {/if}
</button>
