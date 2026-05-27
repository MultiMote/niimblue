<script lang="ts">
  import { onMount } from "svelte";
  import MainPage from "$/components/MainPage.svelte";
  import { registerPlugin, Capacitor } from "@capacitor/core";

  // Connect to the local Java plugin we just created
  const PdfIntent = registerPlugin('PdfIntent');

  let pdfImageSrc: string | null = null;

  onMount(async () => {
    if (Capacitor.getPlatform() === 'android') {
      // 1. Listen for PDFs opened while the app is already in the background
      PdfIntent.addListener('onPdfReceived', (info: any) => {
        if (info && info.image) {
          pdfImageSrc = info.image;
        }
      });

      // 2. Fetch any pending PDF that started the app (cold start)
      try {
        const result = await PdfIntent.getPending();
        if (result && result.image) {
          pdfImageSrc = result.image;
        }
      } catch (e) {
        console.error("Failed to fetch pending PDF", e);
      }
    }
  });
</script>

<MainPage />

{#if pdfImageSrc}
  <div style="position: absolute; top: 50px; left: 50px; right: 50px; z-index: 9999; background: white; padding: 20px; border: 4px solid green; box-shadow: 0 0 20px rgba(0,0,0,0.5);">
    <h3 style="color: black; margin-top: 0;">Success! PDF Received:</h3>
    <img src={pdfImageSrc} alt="PDF converted to image" style="width: 100%; border: 1px solid #ccc; margin-bottom: 15px;" />
    
    <div style="display: flex; gap: 10px;">
      <button 
        style="padding: 10px; background: red; color: white; border: none; flex: 1;" 
        onclick={() => pdfImageSrc = null}>
        Close
      </button>
    </div>
  </div>
{/if}