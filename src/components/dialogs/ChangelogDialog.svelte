<script lang="ts">
  import AppModal from "$/components/basic/AppModal.svelte";
  import { fetchChangelog, openLatestReleasePage, type ChangelogSection } from "$/utils/update.svelte";
  import { tr } from "$/utils/i18n";
  import { isStandaloneApp } from "$/utils/env";

  interface Props {
    show?: boolean;
    currentVersion: string;
  }

  let { show = $bindable(false), currentVersion }: Props = $props();

  let isStandalone = isStandaloneApp();

  let loading = $state(false);
  let failed = $state(false);
  let loaded = $state(false);
  let sections = $state<ChangelogSection[]>([]);

  const load = async () => {
    loading = true;
    failed = false;

    try {
      sections = await fetchChangelog(currentVersion);
      loaded = true;
    } catch (e) {
      console.error("Unable to load changelog:", e);
      failed = true;
    }

    loading = false;
  };

  const updateToLatest = () => {
    if (isStandalone) {
      openLatestReleasePage();
    } else {
      window.location.reload();
    }
  };

  $effect(() => {
    if (show && !loaded) {
      load();
    }
  });
</script>

<AppModal title={$tr("main.changelog.title")} bind:show>
  {#if loading}
    <div class="text-secondary">{$tr("main.changelog.loading")}</div>
  {:else if failed}
    <div class="text-danger">{$tr("main.changelog.error")}</div>
  {:else}
    {#each sections as section (section.version)}
      <h5 class="mb-1">{section.version}</h5>
      <ul class="mb-3">
        {#each section.items as item, idx (idx)}
          <li>{item}</li>
        {/each}
      </ul>
    {:else}
      <div class="text-secondary">{$tr("main.changelog.empty")}</div>
    {/each}
  {/if}

  {#snippet footer()}
    <button class="btn btn-primary" onclick={updateToLatest}>{$tr("main.changelog.update")}</button>
  {/snippet}
</AppModal>
