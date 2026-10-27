<script lang="ts">
  import AppModal from "$/components/basic/AppModal.svelte";
  import { confirmState, type ConfirmButton } from "$/stores/confirm";
  import { tr } from "$/utils/i18n";

  let modalRef = $state<AppModal>();

  const close = (result: ConfirmButton | null) => {
    const resolve = $confirmState.resolve;

    confirmState.update((state) => ({
      ...state,
      resolve: null,
    }));

    resolve?.(result);
    modalRef?.hide();
  };

  const label = (button: ConfirmButton): string => {
    switch (button) {
      case "ok":
        return $tr("dialog.ok");
      case "yes":
        return $tr("dialog.yes");
      case "no":
        return $tr("dialog.no");
      case "cancel":
        return $tr("dialog.cancel");
    }
  };
</script>

{#if $confirmState.show}
  <!-- fixme: modal over modal -->
  <AppModal
    bind:this={modalRef}
    bind:show={$confirmState.show}
    title={$confirmState.title}
    noBody={!$confirmState.message}
    onClose={() => close(null)}
    size="sm">

    {#if $confirmState.message}
      <p class="mb-2">{$confirmState.message}</p>
    {/if}

    {#snippet footer()}
      {#each $confirmState.buttons ?? ["ok"] as btn}
        <button
          class="btn"
          class:btn-primary={btn === $confirmState.defaultButton}
          class:btn-secondary={btn !== $confirmState.defaultButton}
          onclick={() => close(btn as ConfirmButton)}>
          {label(btn as ConfirmButton)}
        </button>
      {/each}
    {/snippet}
  </AppModal>
{/if}
