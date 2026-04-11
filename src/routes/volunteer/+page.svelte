<script lang="ts">
	import { store } from '$lib/store.svelte';

	const user = $derived(store.currentUser);
</script>

{#if user}
	<h1>Welcome, {user.firstName}!</h1>
	<p style="color:var(--text-light);margin-bottom:24px;">
		Use the links below to get started.
	</p>

	<div class="card" style="display:flex;flex-direction:column;gap:12px;max-width:420px;">
		<a href="/volunteer/events" class="btn btn-primary" style="text-align:center;">View Events</a>
		<a href="/volunteer/log" class="btn btn-accent" style="text-align:center;">Log Hours</a>
		<a href="/volunteer/account" class="btn btn-outline" style="text-align:center;"
			>My Account & Children</a
		>
		<a href="/volunteer/tutorial" class="btn btn-outline" style="text-align:center;"
			>How to Use This Site</a
		>
	</div>
{/if}
