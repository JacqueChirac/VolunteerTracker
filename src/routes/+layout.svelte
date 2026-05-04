<!-- root layout — wraps every page in the app -->
<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Volunteer Tracker</title>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

{@render children()}
