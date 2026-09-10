<script lang="ts">
  import PrinterBar from "./components/PrinterBar.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import ToastStack from "./components/ToastStack.svelte";
  import EditorCanvas from "./components/EditorCanvas.svelte";

  let activeView = $state<"design" | "library" | "settings">("design");
</script>

<div class="flex h-full w-full flex-col">
  <PrinterBar />

  <div class="flex min-h-0 flex-1">
    <Sidebar bind:activeView />

    <main class="min-w-0 flex-1 overflow-hidden bg-surface-1">
      {#if activeView === "design"}
        <EditorCanvas />
      {:else if activeView === "library"}
        <div class="flex h-full items-center justify-center text-muted">
          Library browser lands in phase 4.
        </div>
      {:else}
        <div class="flex h-full items-center justify-center text-muted">
          Settings land in phase 7.
        </div>
      {/if}
    </main>
  </div>
</div>

<ToastStack />
