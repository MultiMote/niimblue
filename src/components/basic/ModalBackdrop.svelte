<script lang="ts">
  interface Props {
    onClicked?: () => void;
  }

  let { onClicked }: Props = $props();
</script>

<button type="button" class="modal-backdrop" aria-label="Close menu" onclick={onClicked}> </button>

<style>
  .modal-backdrop {
    position: absolute;
    inset: 0;
    padding: 0;
    border: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(1px);
    pointer-events: auto;
    z-index: 0;
  }
</style>
