<script lang="ts">
  import Modal from "bootstrap/js/dist/modal";
  import { onDestroy, onMount, type Snippet } from "svelte";

  interface Props {
    show: boolean;
    title: string;
    onClose?: () => void;
    children: Snippet;
    footer?: Snippet;
  }

  let { show = $bindable(), title, onClose, children, footer }: Props = $props();

  let modalEl: HTMLElement;
  let modal: Modal;

  onMount(() => {
    modal = new Modal(modalEl);
    modal.show();
    modalEl.addEventListener("hidden.bs.modal", () => {
      if (onClose) onClose();
      show = false;
    });
  });

  onDestroy(() => {
    if (modal) {
      modal.hide();
      modal.dispose();
    }
  });

  export const hide = () => {
    if (modal) {
      modal.hide();
    }
  };
</script>

<div bind:this={modalEl} class="modal fade" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5">{title}</h1>
        <button aria-label="Dismiss" type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body">
        {@render children()}
      </div>

      {#if footer}
        <div class="modal-footer">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
</div>
