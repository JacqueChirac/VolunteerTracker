<!-- events list — volunteers can see upcoming events and sign up / cancel -->
<script lang="ts">
	import { store } from '$lib/store.svelte';

	const today = new Date().toISOString().split('T')[0];

	// upcoming events sorted soonest first, with signup info attached
	const upcomingEvents = $derived(
		[...store.events]
			.filter((e) => e.date >= today)
			.sort((a, b) => a.date.localeCompare(b.date))
			.map((e) => ({
				...e,
				signupCount: store.getEventSignupCount(e.id),
				signedUp: store.isCurrentUserSignedUp(e.id)
			}))
	);

	let error = $state<string | null>(null);

	function handleSignup(eventId: number) {
		error = null;
		const result = store.signupForEvent(eventId);
		if (!result.ok) error = result.error;
	}

	function handleCancel(eventId: number) {
		error = null;
		store.cancelSignup(eventId);
	}
</script>

<h1>Upcoming Events</h1>
<p style="color:var(--text-light);margin-bottom:24px;">
	Sign up to volunteer for upcoming events.
</p>

{#if error}
	<p class="error" style="margin-bottom:16px;">{error}</p>
{/if}

{#if upcomingEvents.length === 0}
	<div class="card">
		<p style="color:var(--text-light);">No upcoming events at this time.</p>
	</div>
{:else}
	<div style="display:flex;flex-direction:column;gap:12px;">
		{#each upcomingEvents as event}
			<div class="card">
				<div style="display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap;">
					<div style="flex:1;">
						<h3><a href="/volunteer/events/{event.id}">{event.title}</a></h3>
						<p style="font-size:0.9rem;color:var(--text-light);">
							{event.date} at {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
							{#if event.location}&middot; {event.location}{/if}
						</p>
						{#if event.description}
							<p style="margin-top:8px;">{event.description}</p>
						{/if}
						<p style="font-size:0.85rem;color:var(--text-light);margin-top:4px;">
							{event.signupCount}{event.volunteersNeeded
								? ` / ${event.volunteersNeeded}`
								: ''} volunteers signed up
							{#if event.importance}
								&middot; Priority: {event.importance}
							{/if}
						</p>
					</div>
					<!-- sign up or cancel button -->
					<div>
						{#if event.signedUp}
							<button type="button" class="btn btn-danger" onclick={() => handleCancel(event.id)}>
								Cancel Sign Up
							</button>
						{:else}
							<button type="button" class="btn btn-accent" onclick={() => handleSignup(event.id)}>
								Sign Up
							</button>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
