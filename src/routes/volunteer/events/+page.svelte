<!-- events list — sign up / cancel for upcoming events -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<h1>Upcoming Events</h1>
<p style="color:var(--text-light);margin-bottom:24px;">Sign up to volunteer for upcoming events.</p>

{#if form?.error}<p class="error" style="margin-bottom:16px;">{form.error}</p>{/if}

{#if data.events.length === 0}
	<div class="card"><p style="color:var(--text-light);">No upcoming events at this time.</p></div>
{:else}
	<div style="display:flex;flex-direction:column;gap:12px;">
		{#each data.events as event (event.id)}
			<div class="card">
				<div style="display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap;">
					<div style="flex:1;">
						<h3><a href="/volunteer/events/{event.id}">{event.title}</a></h3>
						<p style="font-size:0.9rem;color:var(--text-light);">{event.date} at {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}{#if event.location} &middot; {event.location}{/if}</p>
						{#if event.description}<p style="margin-top:8px;">{event.description}</p>{/if}
						<p style="font-size:0.85rem;color:var(--text-light);margin-top:4px;">{event.signupCount} volunteers signed up{#if event.importance} &middot; {event.importance}{/if}</p>
					</div>
					<div>
						{#if event.signedUp}
							<form method="POST" action="?/cancel" use:enhance><input type="hidden" name="eventId" value={event.id} /><button type="submit" class="btn btn-danger">Cancel Sign Up</button></form>
						{:else}
							<form method="POST" action="?/signup" use:enhance><input type="hidden" name="eventId" value={event.id} /><button type="submit" class="btn btn-accent">Sign Up</button></form>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
