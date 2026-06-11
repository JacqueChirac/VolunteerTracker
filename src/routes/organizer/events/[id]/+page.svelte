<!-- organizer single-event view — registrant list + email-all-registrants -->
<script lang="ts">
	import type { PageData } from './$types';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';

	let { data }: { data: PageData } = $props();

	// comma-joined recipient list the Emailing page can pre-fill from
	let emailHref = $derived(
		`/organizer/manage/emailing?recipients=${encodeURIComponent(
			data.registrants.map((r) => r.email).join(', ')
		)}`
	);
</script>

<a href="/organizer/events" style="font-size:0.9rem;">{$lang === 'en' ? '← Back to events' : '← Retour aux événements'}</a>

<div class="card" style="margin-top:12px;">
	<h1>{data.event.title}</h1>
	<p style="color:var(--text-light);margin-top:4px;">
		{data.event.date} at {data.event.startTime}{data.event.endTime ? ` - ${data.event.endTime}` : ''}
	</p>
	{#if data.event.location}<p style="margin-top:4px;">{$lang === 'en' ? 'Location:' : 'Lieu :'} <strong>{data.event.location}</strong></p>{/if}
	{#if data.event.description}<p style="margin-top:12px;">{data.event.description}</p>{/if}

	<div style="margin-top:12px;padding:8px 16px;background:var(--bg);border-radius:6px;display:inline-block;">
		{#if data.event.volunteersNeeded != null}
			{t[$lang].volunteersSignedUpOfNeeded(data.registrants.length, data.event.volunteersNeeded)}
		{:else}
			{t[$lang].volunteersSignedUp(data.registrants.length)}
		{/if}
	</div>
</div>

<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:24px;margin-bottom:12px;">
	<h2 style="margin:0;">{$lang === 'en' ? 'Registrants' : 'Inscrits'} ({data.registrants.length})</h2>
	{#if data.registrants.length > 0}
		<a class="btn btn-primary" href={emailHref}>{$lang === 'en' ? '✉ Email registrants' : '✉ Envoyer un courriel aux inscrits'}</a>
	{/if}
</div>

{#if data.registrants.length === 0}
	<div class="card"><p style="color:var(--text-light);">{$lang === 'en' ? 'No one has signed up for this event yet.' : 'Personne ne s\'est encore inscrit à cet événement.'}</p></div>
{:else}
	<div style="display:flex;flex-direction:column;gap:8px;">
		{#each data.registrants as v (v.id)}
			<div class="card" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
				<div>
					<a href="/organizer/volunteers/{v.id}" style="font-weight:600;">{v.firstName} {v.lastName}</a>
					<span style="color:var(--text-light);font-size:0.85rem;margin-left:8px;">{v.email}</span>
				</div>
				{#if data.isPast}
					<span style="font-size:0.9rem;color:var(--text-light);">
						{#if v.hours > 0}<strong style="color:var(--text);">{v.hours}h</strong> {$lang === 'en' ? 'logged' : 'enregistré'}{:else}{$lang === 'en' ? 'No hours logged' : 'Aucune heure enregistrée'}{/if}
					</span>
				{/if}
			</div>
		{/each}
	</div>
{/if}
