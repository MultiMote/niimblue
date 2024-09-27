<script lang="ts">
  import { iconCodepoints, type MaterialIcon } from "../mdi_icons";
  export let icon: MaterialIcon;
  export let rotate90: boolean = false;
</script>

<span class="material-icons{rotate90 ? 'r-90' : ''}">
  {String.fromCodePoint(iconCodepoints[icon])}
</span>
