<script lang="ts">
  import MdIcon from "$/components/basic/MdIcon.svelte";

  interface Props {
    propName: string;
    savedValue: any;
    value: any;
    onClick: (key: string, value: any) => void;
  }

  let {
    propName,
    savedValue,
    value,
    onClick
  }: Props = $props();
</script>

<button class="btn btn-sm btn-outline-secondary param-lock-btn" onclick={() => onClick(propName, value)}>
  {#if savedValue !== undefined}
    <MdIcon icon="lock" class="text-warning" />
  {:else}
    <MdIcon icon="lock_open" />
  {/if}
</button>
