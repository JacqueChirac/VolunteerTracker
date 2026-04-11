<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { store } from '$lib/store.svelte';

	onMount(() => {
		store.logout();
		goto('/');
	});
</script>

<p style="padding: 40px; text-align: center;">Signing out...</p>
