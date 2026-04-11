<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { store } from '$lib/store.svelte';

	let { children } = $props();

	// Hydrate the paper-prototype store from localStorage on first mount.
	store.init();
</script>

<svelte:head>
	<title>Volunteer Tracker</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
