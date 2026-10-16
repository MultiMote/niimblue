<script lang="ts">
  import AppModal from "$/components/basic/AppModal.svelte";
  import { promptState } from "$/stores/prompt";
  import { tr } from "$/utils/i18n";

  let value = $state("");
  let modalRef = $state<AppModal>();
  let inputRef = $state<HTMLInputElement>();
  let textareaRef = $state<HTMLTextAreaElement>();

  $effect(() => {
    if ($promptState.show) {
      value = $promptState.defaultValue ?? "";
    }
  });

  const onShow = () => {
    if ($promptState.multiline) {
      textareaRef?.focus();
    } else {
      inputRef?.focus();
    }
  };

  const close = (result: string | null) => {
    const resolve = $promptState.resolve;

    promptState.update((state) => ({
      ...state,
      resolve: null,
    }));

    resolve?.(result);
    modalRef?.hide();
  };
</script>

{#if $promptState.show}
  <AppModal
    bind:this={modalRef}
    bind:show={$promptState.show}
    title={$promptState.title}
    {onShow}
    onClose={() => close(null)}>
    {#if $promptState.message}
      <p class="mb-2">{$promptState.message}</p>
    {/if}

    {#if $promptState.multiline}
      <textarea rows="3" bind:this={textareaRef} class="form-control" bind:value></textarea>
    {:else}
      <input
        bind:this={inputRef}
        class="form-control"
        bind:value
        onkeydown={(e) => e.key === "Enter" && close(value)} />
    {/if}

    {#snippet footer()}
      <button class="btn btn-secondary" onclick={() => close(null)}>{$tr("dialog.cancel")}</button>
      <button class="btn btn-primary" onclick={() => close(value)}>{$tr("dialog.ok")}</button>
    {/snippet}
  </AppModal>
{/if}
