<script lang="ts">
  let { activeView = $bindable() } = $props();

  type Item = { id: "design" | "library" | "settings"; label: string; icon: string };

  const items: Item[] = [
    { id: "design", label: "Design", icon: "edit_note" },
    { id: "library", label: "Library", icon: "folder" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];
</script>

<nav class="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface-0 py-3">
  {#each items as item (item.id)}
    <button
      class="group flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-white {activeView === item.id ? 'bg-surface-2 text-white' : ''}"
      onclick={() => (activeView = item.id)}
      title={item.label}
    >
      <span class="material-symbols-rounded text-[20px]">{item.icon}</span>
      <span class="text-[9px] leading-none">{item.label}</span>
    </button>
  {/each}
</nav>
