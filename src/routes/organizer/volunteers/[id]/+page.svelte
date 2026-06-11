<!-- individual volunteer profile — organizer can view details + edit children -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { swimLevels } from '$lib/swimLevels';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editingChildId = $state<number | null>(null);
	let linkChildId = $state('');
</script>

<a href="/organizer/volunteers" style="font-size:0.9rem;">{t[$lang].backToVolunteers}</a>

<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;flex-wrap:wrap;gap:12px;">
	<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
		<h1>{data.volunteer.firstName} {data.volunteer.lastName}</h1>
		{#if data.volunteer.manuallyApproved}
			<span style="background:#d4edda;color:#155724;border:1px solid #c3e6cb;border-radius:20px;padding:3px 12px;font-size:0.8rem;font-weight:600;">
				{$lang === 'en' ? '✓ Approved' : '✓ Approuvé'}
			</span>
		{/if}
	</div>
	<span style="color:var(--text-light);font-size:0.9rem;">{data.volunteer.email}</span>
</div>

<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
	<form method="POST" action="?/toggleApproval" use:enhance>
		<button type="submit" class="btn {data.volunteer.manuallyApproved ? 'btn-outline' : 'btn-accent'}" style="font-size:0.9rem;">
			{data.volunteer.manuallyApproved
				? ($lang === 'en' ? 'Revoke Approval' : 'Révoquer l\'approbation')
				: ($lang === 'en' ? '✓ Mark as Meets Requirements' : '✓ Marquer comme conforme')}
		</button>
	</form>
	<form method="POST" action="?/deleteVolunteer" use:enhance>
		<button
			type="submit"
			class="btn btn-danger"
			style="font-size:0.9rem;"
			onclick={(e) => {
				if (!confirm($lang === 'en'
					? `Permanently delete ${data.volunteer.firstName} ${data.volunteer.lastName}? All their contributions and links will be removed.`
					: `Supprimer définitivement ${data.volunteer.firstName} ${data.volunteer.lastName}? Toutes leurs contributions seront supprimées.`
				)) e.preventDefault();
			}}
		>
			{$lang === 'en' ? 'Delete Volunteer' : 'Supprimer le bénévole'}
		</button>
	</form>
</div>

{#if form?.editChildSuccess}
	<div class="card" style="background:#d4edda;border:1px solid #c3e6cb;margin-top:12px;"><p style="color:#155724;">{t[$lang].childUpdated}</p></div>
{/if}

<!-- stats -->
<div style="display:flex;gap:16px;margin:16px 0;flex-wrap:wrap;">
	<div class="card" style="flex:1;min-width:120px;text-align:center;">
		<p style="font-size:2rem;font-weight:700;">{data.totalHours}</p>
		<p style="font-size:0.85rem;color:var(--text-light);">{t[$lang].totalHours}</p>
	</div>
	<div class="card" style="flex:1;min-width:120px;text-align:center;">
		<p style="font-size:2rem;font-weight:700;">{data.contributions.length}</p>
		<p style="font-size:0.85rem;color:var(--text-light);">{t[$lang].contributions}</p>
	</div>
</div>

<!-- children -->
<h2 style="margin-bottom:12px;">{t[$lang].children}</h2>

{#if form?.linkError}<p style="color:var(--danger);font-size:0.9rem;margin-bottom:8px;">{form.linkError}</p>{/if}
{#if form?.linkSuccess || form?.unlinkSuccess}
	<div style="background:#d4edda;padding:8px 12px;border-radius:8px;margin-bottom:12px;"><p style="color:#155724;font-size:0.9rem;">{$lang === 'en' ? 'Updated.' : 'Mis à jour.'}</p></div>
{/if}

{#if data.children.length === 0}
	<div class="card" style="margin-bottom:16px;"><p style="color:var(--text-light);">{t[$lang].noChildrenLinkedProfile}</p></div>
{:else}
	<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
		{#each data.children as child (child.id)}
			<div class="card">
				{#if editingChildId === child.id}
					<form method="POST" action="?/editChild" use:enhance={() => { return async ({ update }) => { await update(); editingChildId = null; }; }}>
						<input type="hidden" name="childId" value={child.id} />
						<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;">
							<div class="form-group" style="flex:1;min-width:150px;margin-bottom:0;">
								<label for="level_{child.id}">{t[$lang].levelLabel}</label>
								<select id="level_{child.id}" name="level">
									<option value="" selected={!child.level}>{t[$lang].noneLevel}</option>
									{#each swimLevels as lvl}
										<option value={lvl.value} selected={child.level === lvl.value}>{lvl.name}</option>
									{/each}
								</select>
							</div>
							<div class="form-group" style="min-width:150px;margin-bottom:0;">
								<label for="status_{child.id}">{t[$lang].statusLabelProfile}</label>
								<select id="status_{child.id}" name="status">
									<option value="full_member" selected={child.status === 'full_member'}>{t[$lang].fullMemberOption}</option>
									<option value="tryout" selected={child.status === 'tryout'}>{t[$lang].tryoutOption}</option>
								</select>
							</div>
							<button type="submit" class="btn btn-primary" style="padding:6px 14px;font-size:0.85rem;">{t[$lang].save}</button>
							<button type="button" class="btn btn-outline" style="padding:6px 14px;font-size:0.85rem;" onclick={() => editingChildId = null}>{t[$lang].cancel}</button>
						</div>
					</form>
				{:else}
					<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:4px;">
						<strong>{child.firstName} {child.lastName}</strong>
						<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
							<span style="font-size:0.8rem;color:var(--text-light);">{child.status === 'tryout' ? t[$lang].tryoutOption : t[$lang].fullMemberOption}{#if child.level} · {child.level}{/if}</span>
							<button type="button" class="btn btn-outline" style="padding:2px 8px;font-size:0.75rem;" onclick={() => editingChildId = child.id}>{t[$lang].edit}</button>
							<form method="POST" action="?/unlinkChild" use:enhance>
								<input type="hidden" name="childId" value={child.id} />
								<button type="submit" class="btn btn-danger" style="padding:2px 8px;font-size:0.75rem;"
									onclick={(e) => { if (!confirm($lang === 'en' ? `Unlink ${child.firstName} ${child.lastName} from this volunteer?` : `Dissocier ${child.firstName} ${child.lastName} de ce bénévole?`)) e.preventDefault(); }}>
									{$lang === 'en' ? 'Unlink' : 'Dissocier'}
								</button>
							</form>
						</div>
					</div>
					<div class="progress-bar" style="height:16px;">
						<div class="progress-bar-fill" style="width:{Math.min(100, (child.totalHours / child.requiredHours) * 100)}%;font-size:0.7rem;">
							{child.totalHours} / {child.requiredHours} hrs
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<!-- link a new child -->
{#if data.allChildren.filter(c => !data.linkedChildIds.includes(c.id)).length > 0}
	<form method="POST" action="?/linkChild" use:enhance style="display:flex;gap:8px;align-items:center;margin-bottom:24px;flex-wrap:wrap;">
		<select name="childId" bind:value={linkChildId} style="flex:1;max-width:260px;">
			<option value="">{$lang === 'en' ? '-- Link a child --' : '-- Associer un enfant --'}</option>
			{#each data.allChildren.filter(c => !data.linkedChildIds.includes(c.id)) as c}
				<option value={c.id}>{c.firstName} {c.lastName}</option>
			{/each}
		</select>
		<button type="submit" class="btn btn-accent" disabled={!linkChildId}>
			{$lang === 'en' ? '+ Link Child' : '+ Associer'}
		</button>
	</form>
{:else}
	<div style="margin-bottom:24px;"></div>
{/if}

<!-- contribution history -->
<h2 style="margin-bottom:12px;">{t[$lang].contributionHistory}</h2>
{#if form?.deleteContribSuccess}
	<div style="background:#d4edda;padding:8px 12px;border-radius:8px;margin-bottom:12px;"><p style="color:#155724;font-size:0.9rem;">{$lang === 'en' ? 'Entry deleted.' : 'Entrée supprimée.'}</p></div>
{/if}
{#if form?.contribError}<p class="error" style="margin-bottom:8px;">{form.contribError}</p>{/if}
{#if data.contributions.length === 0}
	<div class="card"><p style="color:var(--text-light);">{t[$lang].noContributionsYet}</p></div>
{:else}
	<div class="table-wrap">
		<table>
			<thead><tr><th>{t[$lang].dateCol}</th><th>{t[$lang].hoursCol}</th><th>{t[$lang].notesCol}</th><th></th></tr></thead>
			<tbody>
				{#each data.contributions as c (c.id)}
					<tr>
						<td>{c.date}</td>
						<td>{c.hours}h</td>
						<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">{c.notes ?? '-'}</td>
						<td style="text-align:right;">
							<form method="POST" action="?/deleteContribution" use:enhance>
								<input type="hidden" name="contributionId" value={c.id} />
								<button
									type="submit"
									class="btn btn-danger"
									style="padding:2px 8px;font-size:0.75rem;"
									aria-label={$lang === 'en' ? `Delete entry from ${c.date}` : `Supprimer l'entrée du ${c.date}`}
									onclick={(e) => { if (!confirm($lang === 'en' ? `Delete this ${c.hours}h entry from ${c.date}? This can be undone with the undo button.` : `Supprimer cette entrée de ${c.hours}h du ${c.date}? Annulable avec le bouton d'annulation.`)) e.preventDefault(); }}
								>{t[$lang].delete}</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
