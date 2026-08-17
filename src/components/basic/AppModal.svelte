<script lang="ts">
  import Modal from "bootstrap/js/dist/modal";
  import { onDestroy, onMount, type Snippet } from "svelte";

  interface Props {
    show: boolean;
    title: string;
    size?: "md" | "lg" | "xl";
    tall?: boolean;
    onClose?: () => void;
    children: Snippet;
    footer?: Snippet;
  }

  let { show = $bindable(), title, size = "md", tall = false, onClose, children, footer }: Props = $props();

  let modalEl: HTMLElement;
  let modal: Modal;
  let hiding = false;

  const unlockPage = () => {
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
  };

  onMount(() => {
    document.body.append(modalEl);
    modal = new Modal(modalEl);
    modal.show();

    modalEl.addEventListener("hide.bs.modal", () => {
      hiding = true;
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      unlockPage();
      if (onClose) onClose();
      show = false;
    });
  });

  onDestroy(() => {
    if (modal) {
      try {
        modal.hide();
        modal.dispose();
      } catch {
        // Modal DOM may already be gone
      }
    }
    unlockPage();
    modalEl?.remove();
  });

  export const hide = () => {
    if (modal && !hiding) {
      modal.hide();
    }
  };
</script>

<div bind:this={modalEl} class="modal fade" tabindex="-1" aria-hidden="true">
  <div
    class="modal-dialog modal-dialog-centered {tall ? 'modal-dialog-tall' : 'modal-dialog-scrollable'} {size === 'md'
      ? ''
      : `modal-${size}`}">
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
