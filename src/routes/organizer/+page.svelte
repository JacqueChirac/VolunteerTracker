<!-- organizer events dashboard -->
<!-- shows stats at the top, then upcoming and past events -->
<!-- organizers can delete events from here -->
<script lang="ts">
	import { store } from '$lib/store.svelte';

	const today = new Date().toISOString().split('T')[0];

	// all events sorted newest first, with signup counts attached
	const allEvents = $derived(
		[...store.events]
			.sort((a, b) => b.date.localeCompare(a.date))
			.map((e) => ({ ...e, signupCount: store.getEventSignupCount(e.id) }))
	);

	// split into upcoming vs past
	const upcomingEvents = $derived(allEvents.filter((e) => e.date >= today));
	const pastEvents = $derived(allEvents.filter((e) => e.date < today));

	// summary stats for the top cards
	const stats = $derived.by(() => {
		const totalVolunteers = store.users.filter((u) => u.role === 'volunteer').length;
		const totalHours = store.contributions.reduce(
			(sum, c) => sum + parseFloat(c.hours || '0'),
			0
		);
		// count how many children have met their hour requirement
		let childrenMet = 0;
		for (const child of store.children) {
			if (store.getChildTotalHours(child.id) >= store.getHoursRequired(child.status)) {
				childrenMet++;
			}
		}
		return {
			totalVolunteers,
			totalHours: Math.round(totalHours * 100) / 100,
			childrenMet,
			childrenTotal: store.children.length
		};
	});

	function handleDelete(id: number) {
		if (!confirm('Delete this event?')) return;
		store.deleteEvent(id);
	}
</script>

<h1>Events Dashboard</h1>

<!-- stat cards -->
<div style="display:flex;gap:12px;margin:16px 0 24px;flex-wrap:wrap;">
	<div class="card" style="flex:1;min-width:120px;text-align:center;">
		<p style="font-size:1.8rem;font-weight:700;">{stats.totalVolunteers}</p>
		<p style="font-size:0.8rem;color:var(--text-light);">Volunteers</p>
	</div>
	<div class="card" style="flex:1;min-width:120px;text-align:center;">
		<p style="font-size:1.8rem;font-weight:700;">{stats.totalHours}</p>
		<p style="font-size:0.8rem;color:var(--text-light);">Total Hours</p>
	</div>
	<div class="card" style="flex:1;min-width:120px;text-align:center;">
		<p style="font-size:1.8rem;font-weight:700;">
			{stats.childrenMet}/{stats.childrenTotal}
		</p>
		<p style="font-size:0.8rem;color:var(--text-light);">Kids Met Goal</p>
	</div>
</div>

{#if allEvents.length === 0}
	<div class="card">
		<p style="color:var(--text-light);">No events yet.</p>
	</div>
{:else}
	<!-- upcoming events -->
	<h2 style="margin-bottom:12px;">Upcoming Events ({upcomingEvents.length})</h2>
	{#if upcomingEvents.length === 0}
		<div class="card" style="margin-bottom:24px;">
			<p style="color:var(--text-light);">No upcoming events.</p>
		</div>
	{/if}
	{#each upcomingEvents as event (event.id)}
		<div class="card" style="margin-bottom:12px;">
			<div style="display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap;">
				<div style="flex:1;">
					<h3>{event.title}</h3>
					<p style="font-size:0.9rem;color:var(--text-light);">
						{event.date} at {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
						{#if event.location}&middot; {event.location}{/if}
					</p>
					{#if event.description}
						<p style="margin-top:4px;font-size:0.9rem;">{event.description}</p>
					{/if}
					<p style="font-size:0.85rem;color:var(--text-light);margin-top:4px;">
						{event.signupCount}{event.volunteersNeeded
							? ` / ${event.volunteersNeeded}`
							: ''} volunteers
						{#if event.importance}&middot; Priority: {event.importance}{/if}
					</p>
				</div>
				<button
					type="button"
					class="btn btn-danger"
					style="padding:4px 10px;font-size:0.8rem;"
					onclick={() => handleDelete(event.id)}
				>
					Delete
				</button>
			</div>
		</div>
	{/each}

	<!-- past events (slightly faded) -->
	<h2 style="margin-top:32px;margin-bottom:12px;">Past Events ({pastEvents.length})</h2>
	{#if pastEvents.length === 0}
		<div class="card">
			<p style="color:var(--text-light);">No past events.</p>
		</div>
	{/if}
	{#each pastEvents as event (event.id)}
		<div class="card" style="margin-bottom:12px;opacity:0.75;">
			<div style="display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap;">
				<div style="flex:1;">
					<h3>{event.title}</h3>
					<p style="font-size:0.9rem;color:var(--text-light);">
						{event.date} at {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
						{#if event.location}&middot; {event.location}{/if}
					</p>
					{#if event.description}
						<p style="margin-top:4px;font-size:0.9rem;">{event.description}</p>
					{/if}
					<p style="font-size:0.85rem;color:var(--text-light);margin-top:4px;">
						{event.signupCount}{event.volunteersNeeded
							? ` / ${event.volunteersNeeded}`
							: ''} volunteers
						{#if event.importance}&middot; Priority: {event.importance}{/if}
					</p>
				</div>
				<button
					type="button"
					class="btn btn-danger"
					style="padding:4px 10px;font-size:0.8rem;"
					onclick={() => handleDelete(event.id)}
				>
					Delete
				</button>
			</div>
		</div>
	{/each}
{/if}
