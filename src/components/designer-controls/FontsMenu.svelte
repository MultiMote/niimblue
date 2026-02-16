<script lang="ts">
  import AppModal from "$/components/basic/AppModal.svelte";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { userFonts } from "$/stores";
  import { tr } from "$/utils/i18n";
  import { LocalStoragePersistence } from "$/utils/persistence";

  let show = $state<boolean>(false);
  let usedSpace = $state<number>(0);
  const calcUsedSpace = () => {
    usedSpace = LocalStoragePersistence.usedSpace();
  };

  $effect(() => {
    if (show) calcUsedSpace();
  });
</script>

<button
  class="btn btn-secondary"
  onclick={() => {
    show = true;
  }}>
  <MdIcon icon="settings" />
</button>

{#if show}
  <AppModal title="Custom fonts" bind:show>
    <div>
      {usedSpace}
      {$tr("params.saved_labels.kb_used")}
    </div>
    <div>
      <ul>
        {#each $userFonts as font (font.name)}
          <li>{font.name}</li>
        {/each}
      </ul>
    </div>
  </AppModal>
{/if}
