<!-- root layout — wraps every page in the app -->
<!-- loads global CSS, sets the page title, and initializes our store -->
<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { store } from '$lib/store.svelte';

	let { children } = $props();

	// load saved data from localStorage on first page load
	store.init();
</script>

<svelte:head>
	<title>Volunteer Tracker</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
