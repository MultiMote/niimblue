<script lang="ts">
  import { onMount } from "svelte";
  import { type IconName, type IconParams, icon as faIcon, parse as faParse } from "@fortawesome/fontawesome-svg-core";

  export let icon: IconName;
  export let params: IconParams | undefined = undefined;

  let iconRef: HTMLElement;

  onMount(() => {
    const lookup = faParse.icon(icon);
    const iconData = faIcon(lookup, params);

    if (iconData === undefined) {
      iconRef.innerHTML = "err";
      return;
    }

    Array.from(iconData.node).forEach((el: Element) => {
      iconRef.appendChild(el);
    });
  });
</script>

<i class="icon" bind:this={iconRef}></i>
