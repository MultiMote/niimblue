<script lang="ts">
  import { onMount } from "svelte";
  import MainPage from "$/components/MainPage.svelte";

  // This variable will hold our rendered PDF image
  let pdfImageSrc: string | null = null;

  onMount(() => {
    // Listen for the custom event sent from our Java code!
    window.addEventListener('pdfReceived', (event: any) => {
      console.log("PDF intercept triggered in Svelte!");
      
      // Grab the Base64 image string from the event detail
      pdfImageSrc = event.detail;
    });
  });
</script>

<!-- The main NiimBlue application -->
<MainPage />

<!-- TEST UI: If we receive a PDF, show it in a massive box so we know it worked! -->
{#if pdfImageSrc}
  <div style="position: absolute; top: 50px; left: 50px; right: 50px; z-index: 9999; background: white; padding: 20px; border: 4px solid green; box-shadow: 0 0 20px rgba(0,0,0,0.5);">
    <h3 style="color: black; margin-top: 0;">Success! PDF Received:</h3>
    <img src={pdfImageSrc} alt="PDF converted to image" style="width: 100%; border: 1px solid #ccc; margin-bottom: 15px;" />
    
    <div style="display: flex; gap: 10px;">
      <button 
        style="padding: 10px; background: red; color: white; border: none; flex: 1;" 
        on:click={() => pdfImageSrc = null}>
        Close
      </button>
    </div>
  </div>
{/if}