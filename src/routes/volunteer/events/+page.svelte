<!-- events list — sign up / cancel for upcoming events -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const today = new Date().toISOString().split('T')[0];
	let upcomingEvents = $derived(data.events.filter((e: typeof data.events[0]) => e.date >= today));
	let pastEvents = $derived(data.events.filter((e: typeof data.events[0]) => e.date < today));
</script>

<h1>{t[$lang].upcomingEventsTitle}</h1>
<p style="color:var(--text-light);margin-bottom:24px;">{t[$lang].upcomingEventsSubtitle}</p>

<!-- Display errors if there's one -->
{#if form?.error}<p class="error" style="margin-bottom:16px;">{form.error}</p>{/if}

{#if upcomingEvents.length === 0}
	<div class="card"><p style="color:var(--text-light);">{t[$lang].noUpcomingEvents}</p></div>
{:else}
	<div style="display:flex;flex-direction:column;gap:12px;">
		{#each upcomingEvents as event (event.id)}
			<div class="card">
				<div style="display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap;">
					<div style="flex:1;">
						<h3><a href="/volunteer/events/{event.id}">{event.title}</a></h3>
						<p style="font-size:0.9rem;color:var(--text-light);">{event.date} at {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}{#if event.location} &middot; {event.location}{/if}</p>
						{#if event.description}<p style="margin-top:8px;">{event.description}</p>{/if}
						<p style="font-size:0.85rem;color:var(--text-light);margin-top:4px;">{t[$lang].volunteersSignedUp(event.signupCount)}{#if event.type} &middot; {event.type}{/if}</p>
					</div>
					<div>
						{#if event.signedUp}
							<form method="POST" action="?/cancel" use:enhance><input type="hidden" name="eventId" value={event.id} /><button type="submit" class="btn btn-danger">{t[$lang].cancelSignUp}</button></form>
						{:else}
							<form method="POST" action="?/signup" use:enhance><input type="hidden" name="eventId" value={event.id} /><button type="submit" class="btn btn-accent">{t[$lang].signUp}</button></form>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}



<h1>{t[$lang].pastEventsTitle}</h1>
<p style="color:var(--text-light);margin-bottom:24px;">{t[$lang].pastEventsSubtitle}</p>
{#if pastEvents.length === 0}
	<div class="card"><p style="color:var(--text-light);">{t[$lang].noPastEvents}</p></div>
{:else}
	<div style="display:flex;flex-direction:column;gap:12px;">
		{#each pastEvents as event (event.id)}
			<div class="card">
				<div style="display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap;">
					<div style="flex:1;">
						<h3><a href="/volunteer/events/{event.id}">{event.title}</a></h3>
						<p style="font-size:0.9rem;color:var(--text-light);">{event.date} at {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}{#if event.location} &middot; {event.location}{/if}</p>
						{#if event.description}<p style="margin-top:8px;">{event.description}</p>{/if}
						<p style="font-size:0.85rem;color:var(--text-light);margin-top:4px;">{t[$lang].volunteersSignedUp(event.signupCount)}{#if event.type} &middot; {event.type}{/if}</p>
					</div>

				</div>
			</div>
		{/each}
	</div>
{/if}
