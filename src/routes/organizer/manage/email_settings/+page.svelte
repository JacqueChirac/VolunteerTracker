<script lang="ts">
  import { json } from '@sveltejs/kit';

let {data} = $props();
let lastUpdate = data.lastUpdate;
</script>

<h1>Work in progress</h1>

<pre>{JSON.stringify(data, null, 2)}</pre>