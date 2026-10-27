<script lang="ts">
  import Modal from "bootstrap/js/dist/modal";
  import { onDestroy, onMount, type Snippet } from "svelte";

  interface Props {
    show?: boolean;
    title: string;
    onClose?: () => void;
    onShow?: () => void;
    children: Snippet;
    footer?: Snippet;
    noBody?: boolean;
    size?: "sm" | "lg" | "xl";
  }

  let { show = $bindable(true), title, onClose, onShow, children, footer, noBody, size }: Props = $props();

  let modalEl: HTMLElement;
  let modal: Modal | null = null;

  const handleHide = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleHidden = () => {
    show = false;
    onClose?.();
  };

  const handleShown = () => {
    onShow?.();
  };

  onMount(() => {
    modal = new Modal(modalEl);

    modalEl.addEventListener("shown.bs.modal", handleShown);
    modalEl.addEventListener("hide.bs.modal", handleHide);
    modalEl.addEventListener("hidden.bs.modal", handleHidden);

    if (show) {
      modal.show();
    }
  });

  $effect(() => {
    if (!modal) return;

    if (show) {
      modal.show();
    } else {
      modal.hide();
    }
  });

  onDestroy(() => {
    modalEl.removeEventListener("shown.bs.modal", handleShown);
    modalEl.removeEventListener("hide.bs.modal", handleHide);
    modalEl.removeEventListener("hidden.bs.modal", handleHidden);

    modal?.dispose();
    modal = null;
  });

  export function hide() {
    modal?.hide();
  }
</script>

<div
  bind:this={modalEl}
  class="modal fade"
  class:nobody={noBody}
  class:modal-sm={size === "sm"}
  class:modal-lg={size === "lg"}
  class:modal-xl={size === "xl"}
  tabindex="-1"
  aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5">{title}</h1>
        <button aria-label="Dismiss" type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>

      {#if !noBody}
        <div class="modal-body">
          {@render children()}
        </div>
      {/if}

      {#if footer}
        <div class="modal-footer">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .modal.nobody .modal-header {
    border-bottom: none;
  }

  .modal.nobody .modal-footer {
    border-top: none;
  }
</style>
