<script lang="ts">
  import AppModal from "$/components/basic/AppModal.svelte";
  import { tr } from "$/utils/i18n";

  let { show = $bindable() } = $props();

  const rows = [
    { keys: "Ctrl / ⌘ + Z", action: "editor.undo" },
    { keys: "Ctrl / ⌘ + Y", action: "editor.redo" },
    { keys: "Ctrl / ⌘ + D", action: "editor.clone" },
    { keys: "Ctrl / ⌘ + V", action: "ui.shortcut.paste" },
    { keys: "Del / Backspace", action: "editor.delete" },
    { keys: "↑ ↓ ← →", action: "ui.shortcut.move" },
    { keys: "Esc", action: "ui.deselect" },
    { keys: "?", action: "ui.shortcuts" },
  ] as const;
</script>

<AppModal title={$tr("ui.shortcuts.title")} bind:show>
  <div class="shortcuts-list">
    {#each rows as row (row.keys)}
      <div class="shortcuts-row">
        <span>{$tr(row.action)}</span>
        <span class="kbd">{row.keys}</span>
      </div>
    {/each}
  </div>
</AppModal>
