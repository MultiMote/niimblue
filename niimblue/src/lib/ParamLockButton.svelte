<script lang="ts">
  import FaIcon from "./FaIcon.svelte";
  export let propName: string;
  export let savedValue: any;
  export let value: any;
  export let onClick: (key: string, value: any) => void;
</script>

<button class="btn btn-sm btn-outline-secondary" on:click={() => onClick(propName, value)}>
  {#if savedValue }
    <FaIcon icon="lock" params={{classes: "text-warning"}} />
  {:else}
    <FaIcon icon="lock-open" />
  {/if}
</button>

