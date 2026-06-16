<!-- single event detail - full info + volunteer list + signup/cancel -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';
	import { formatEventDateTime } from '$lib/formatEventDate';

	let { data, form }: { data: PageData; form: ActionData } = $props();

</script>

<a href="/volunteer/events" style="font-size:0.9rem;">{t[$lang].backToEvents}</a>

<div class="card" style="margin-top:12px;">
	<h1>{data.event.title}{#if data.event.datePrecision === 'month'} <span class="tentative-badge">{t[$lang].tentative}</span>{/if}</h1>
	<p style="color:var(--text-light);margin-top:4px;">{formatEventDateTime(data.event, $lang)}</p>
	{#if data.event.location}<p style="margin-top:4px;">{t[$lang].locationLabel} <strong>{data.event.location}</strong></p>{/if}
	{#if data.event.description}<p style="margin-top:12px;">{data.event.description}</p>{/if}

	<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;">
		<div style="padding:8px 16px;background:var(--bg);border-radius:6px;">
			{#if data.event.volunteersNeeded != null}
				{t[$lang].volunteersSignedUpOfNeeded(data.volunteers.length, data.event.volunteersNeeded)}
			{:else}
				{t[$lang].volunteersSignedUp(data.volunteers.length)}
			{/if}
		</div>
	</div>

	{#if form?.error}<p class="error" style="margin-top:12px;">{form.error}</p>{/if}

	{#if !data.isPast}
		<div style="margin-top:20px;">
			{#if data.isSignedUp}
				<form method="POST" action="?/cancel" use:enhance><button type="submit" class="btn btn-danger">{t[$lang].cancelSignUpBtn}</button></form>
			{:else}
				<form method="POST" action="?/signup" use:enhance><button type="submit" class="btn btn-accent">{t[$lang].signUpForEvent}</button></form>
			{/if}
		</div>
	{:else}
		<p style="margin-top:20px;color:var(--text-light);font-style:italic;">{t[$lang].pastEventNoSignup}</p>
	{/if}
</div>

<h2 style="margin-top:24px;margin-bottom:12px;">{t[$lang].signedUpVolunteers(data.volunteers.length)}</h2>
{#if data.volunteers.length === 0}
	<div class="card"><p style="color:var(--text-light);">{t[$lang].noOneSignedUp}</p></div>
{:else}
	<div style="display:flex;flex-direction:column;gap:8px;">
		{#each data.volunteers as v}
			<div class="card" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;">
				<span>{v.firstName} {v.lastName}</span>
				{#if data.isPast}
					<span style="font-size:0.9rem;color:var(--text-light);">
						{#if v.hours > 0}<strong style="color:var(--text);">{v.hours}h</strong> {t[$lang].loggedSuffix}{:else}{t[$lang].noHoursLogged}{/if}
					</span>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.tentative-badge {
		display: inline-block;
		background: #fff3cd;
		color: #856404;
		border: 1px solid #ffeeba;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 1px 8px;
		margin-left: 6px;
		vertical-align: middle;
		letter-spacing: 0.3px;
	}
</style>
