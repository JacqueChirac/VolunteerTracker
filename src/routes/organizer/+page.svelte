<!-- organizer events dashboard — stats + event list with add/delete -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let showAddEvent = $state(false);

	const today = new Date().toISOString().split('T')[0];
	let upcomingEvents = $derived(data.events.filter((e: typeof data.events[0]) => e.date >= today));
	let pastEvents = $derived(data.events.filter((e: typeof data.events[0]) => e.date < today));
</script>

<h1>Events Dashboard</h1>

<!-- stat cards -->
<div style="display:flex;gap:12px;margin:16px 0 24px;flex-wrap:wrap;">
	<div class="card" style="flex:1;min-width:120px;text-align:center;">
		<p style="font-size:1.8rem;font-weight:700;">{data.stats.totalVolunteers}</p>
		<p style="font-size:0.8rem;color:var(--text-light);">Volunteers</p>
	</div>
	<div class="card" style="flex:1;min-width:120px;text-align:center;">
		<p style="font-size:1.8rem;font-weight:700;">{data.stats.totalHours}</p>
		<p style="font-size:0.8rem;color:var(--text-light);">Total Hours</p>
	</div>
	<div class="card" style="flex:1;min-width:120px;text-align:center;">
		<p style="font-size:1.8rem;font-weight:700;">{data.stats.childrenMet}/{data.stats.childrenTotal}</p>
		<p style="font-size:0.8rem;color:var(--text-light);">Kids Met Goal</p>
	</div>
</div>

{#if form?.success}
	<div class="card" style="background:#d4edda;border:1px solid #c3e6cb;margin-bottom:16px;">
		<p style="color:#155724;">Event saved successfully.</p>
	</div>
{/if}

<button class="btn btn-accent" style="margin-bottom:16px;" onclick={() => showAddEvent = !showAddEvent}>
	{showAddEvent ? 'Cancel' : '+ Add New Event'}
</button>

{#if showAddEvent}
	<div class="card" style="margin-bottom:20px;">
		<h2>Add New Event</h2>
		{#if form?.error}<p class="error">{form.error}</p>{/if}
		<form method="POST" action="?/addEvent" use:enhance style="margin-top:12px;">
			<div class="grid-2">
				<div class="form-group"><label for="add_title">Title</label><input id="add_title" name="title" type="text" required /></div>
				<div class="form-group"><label for="add_date">Date</label><input id="add_date" name="date" type="date" required /></div>
				<div class="form-group"><label for="add_start">Start Time</label><input id="add_start" name="startTime" type="time" required /></div>
				<div class="form-group"><label for="add_end">End Time</label><input id="add_end" name="endTime" type="time" /></div>
				<div class="form-group"><label for="add_loc">Location</label><input id="add_loc" name="location" type="text" /></div>
				<div class="form-group"><label for="add_type">Event Type</label>
					<select id="add_type" name="type">
							<option value="other" selected>Other</option>
							{#each data.activityTypes as at}
								<option value={at.name}>{at.name}</option>
							{/each}
						</select>
				</div>
			</div>
			<div class="form-group"><label for="add_desc">Description</label><textarea id="add_desc" name="description" rows="3"></textarea></div>
			<button type="submit" class="btn btn-primary">Create Event</button>
		</form>
	</div>
{/if}

{#if data.events.length === 0}
	<div class="card"><p style="color:var(--text-light);">No events yet. Create one above.</p></div>
{:else}
	<h2 style="margin-bottom:12px;">Upcoming Events ({upcomingEvents.length})</h2>
	{#each upcomingEvents as event (event.id)}
		<div class="card" style="margin-bottom:12px;">
			<div style="display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap;">
				<div style="flex:1;">
					<h3>{event.title}</h3>
					<p style="font-size:0.9rem;color:var(--text-light);">{event.date} at {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}{#if event.location} &middot; {event.location}{/if}</p>
					{#if event.description}<p style="margin-top:4px;font-size:0.9rem;">{event.description}</p>{/if}
					<p style="font-size:0.85rem;color:var(--text-light);margin-top:4px;">{event.signupCount} volunteers{#if event.type} &middot; {event.type}{/if}</p>
				</div>
				<form method="POST" action="?/deleteEvent" use:enhance style="display:inline;">
					<input type="hidden" name="eventId" value={event.id} />
					<button type="submit" class="btn btn-danger" style="padding:4px 10px;font-size:0.8rem;" onclick={(e) => { if (!confirm('Delete this event?')) e.preventDefault(); }}>Delete</button>
				</form>
			</div>
		</div>
	{/each}

	<h2 style="margin-top:32px;margin-bottom:12px;">Past Events ({pastEvents.length})</h2>
	{#each pastEvents as event (event.id)}
		<div class="card" style="margin-bottom:12px;opacity:0.75;">
			<div style="display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap;">
				<div style="flex:1;">
					<h3>{event.title}</h3>
					<p style="font-size:0.9rem;color:var(--text-light);">{event.date} at {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}{#if event.location} &middot; {event.location}{/if}</p>
					{#if event.description}<p style="margin-top:4px;font-size:0.9rem;">{event.description}</p>{/if}
					<p style="font-size:0.85rem;color:var(--text-light);margin-top:4px;">{event.signupCount} volunteers{#if event.type} &middot; {event.type}{/if}</p>
				</div>
				<form method="POST" action="?/deleteEvent" use:enhance style="display:inline;">
					<input type="hidden" name="eventId" value={event.id} />
					<button type="submit" class="btn btn-danger" style="padding:4px 10px;font-size:0.8rem;" onclick={(e) => { if (!confirm('Delete?')) e.preventDefault(); }}>Delete</button>
				</form>
			</div>
		</div>
	{/each}
{/if}
