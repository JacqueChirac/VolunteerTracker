<script lang="ts">
	import { page } from '$app/state';
	import { store } from '$lib/store.svelte';

	const eventId = $derived(Number(page.params.id));
	const event = $derived(store.events.find((e) => e.id === eventId));
	const volunteers = $derived(event ? store.getEventVolunteers(event.id) : []);
	const isSignedUp = $derived(event ? store.isCurrentUserSignedUp(event.id) : false);

	let error = $state<string | null>(null);

	function handleSignup() {
		if (!event) return;
		error = null;
		const result = store.signupForEvent(event.id);
		if (!result.ok) error = result.error;
	}

	function handleCancel() {
		if (!event) return;
		error = null;
		store.cancelSignup(event.id);
	}
</script>

<a href="/volunteer/events" style="font-size:0.9rem;">&larr; Back to Events</a>

{#if !event}
	<div class="card" style="margin-top:12px;">
		<p style="color:var(--text-light);">Event not found.</p>
	</div>
{:else}
	<div class="card" style="margin-top:12px;">
		<h1>{event.title}</h1>
		<p style="color:var(--text-light);margin-top:4px;">
			{event.date} at {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
		</p>
		{#if event.location}
			<p style="margin-top:4px;">Location: <strong>{event.location}</strong></p>
		{/if}
		{#if event.description}
			<p style="margin-top:12px;">{event.description}</p>
		{/if}

		<div style="display:flex;gap:16px;margin-top:16px;flex-wrap:wrap;">
			{#if event.volunteersNeeded}
				<div style="padding:8px 16px;background:var(--bg);border-radius:6px;">
					<strong>{volunteers.length} / {event.volunteersNeeded}</strong>
					<span style="color:var(--text-light);font-size:0.85rem;"> volunteers</span>
				</div>
			{/if}
			{#if event.importance}
				<div style="padding:8px 16px;background:var(--bg);border-radius:6px;">
					Priority: <strong>{event.importance}</strong>
				</div>
			{/if}
		</div>

		{#if error}
			<p class="error" style="margin-top:12px;">{error}</p>
		{/if}

		<div style="margin-top:20px;">
			{#if isSignedUp}
				<button type="button" class="btn btn-danger" onclick={handleCancel}>Cancel Sign Up</button>
			{:else}
				<button type="button" class="btn btn-accent" onclick={handleSignup}>
					Sign Up for This Event
				</button>
			{/if}
		</div>
	</div>

	<h2 style="margin-top:24px;margin-bottom:12px;">
		Signed Up Volunteers ({volunteers.length})
	</h2>
	{#if volunteers.length === 0}
		<div class="card">
			<p style="color:var(--text-light);">No one has signed up yet. Be the first!</p>
		</div>
	{:else}
		<div style="display:flex;flex-direction:column;gap:8px;">
			{#each volunteers as v}
				<div class="card" style="padding:12px 16px;">
					{v.firstName}
					{v.lastName}
				</div>
			{/each}
		</div>
	{/if}
{/if}
