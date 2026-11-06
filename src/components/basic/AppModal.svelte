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
    noCloseButton?: boolean;
    size?: "sm" | "lg" | "xl";
    tall?: boolean;
  }

  let { show = $bindable(true), title, onClose, onShow, children, footer, noBody, size, noCloseButton, tall = false }: Props = $props();

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
  <div class="modal-dialog modal-dialog-centered" class:modal-dialog-tall={tall}>
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5">{title}</h1>
        {#if !noCloseButton}
          <button aria-label="Dismiss" type="button" class="btn-close" data-bs-dismiss="modal"></button>
        {/if}
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

  .modal-dialog.modal-dialog-tall {
    width: min(72rem, calc(100vw - 1rem));
    max-width: min(72rem, calc(100vw - 1rem));
    height: calc(100dvh - 1rem);
    max-height: calc(100dvh - 1rem);
    margin: 0.5rem auto;
  }

  .modal-dialog.modal-dialog-tall .modal-content {
    height: 100%;
    max-height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .modal-dialog.modal-dialog-tall .modal-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-dialog.modal-dialog-tall .modal-footer {
    flex: 0 0 auto;
  }

  @media (max-width: 576px) {
    .modal-dialog.modal-dialog-tall {
      width: 100vw;
      max-width: 100vw;
      height: 100dvh;
      max-height: 100dvh;
      margin: 0;
    }
  }
</style>
