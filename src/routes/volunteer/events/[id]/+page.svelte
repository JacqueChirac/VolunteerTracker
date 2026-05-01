<!-- single event detail — full info + volunteer list + signup/cancel -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	
</script>

<a href="/volunteer/events" style="font-size:0.9rem;">&larr; Back to Events</a>

<div class="card" style="margin-top:12px;">
	<h1>{data.event.title}</h1>
	<p style="color:var(--text-light);margin-top:4px;">{data.event.date} at {data.event.startTime}{data.event.endTime ? ` - ${data.event.endTime}` : ''}</p>
	{#if data.event.location}<p style="margin-top:4px;">Location: <strong>{data.event.location}</strong></p>{/if}
	{#if data.event.description}<p style="margin-top:12px;">{data.event.description}</p>{/if}

	{#if data.event.type}
		<div style="margin-top:16px;padding:8px 16px;background:var(--bg);border-radius:6px;display:inline-block;">Type: <strong>{data.event.type}</strong></div>
	{/if}

	{#if form?.error}<p class="error" style="margin-top:12px;">{form.error}</p>{/if}

	<div style="margin-top:20px;">
		{#if data.isSignedUp}
			<form method="POST" action="?/cancel" use:enhance><button type="submit" class="btn btn-danger">Cancel Sign Up</button></form>
		{:else}
			<form method="POST" action="?/signup" use:enhance><button type="submit" class="btn btn-accent">Sign Up for This Event</button></form>
		{/if}
	</div>
</div>

<h2 style="margin-top:24px;margin-bottom:12px;">Signed Up Volunteers ({data.volunteers.length})</h2>
{#if data.volunteers.length === 0}
	<div class="card"><p style="color:var(--text-light);">No one has signed up yet. Be the first!</p></div>
{:else}
	<div style="display:flex;flex-direction:column;gap:8px;">
		{#each data.volunteers as v}<div class="card" style="padding:12px 16px;">{v.firstName} {v.lastName}</div>{/each}
	</div>
{/if}
