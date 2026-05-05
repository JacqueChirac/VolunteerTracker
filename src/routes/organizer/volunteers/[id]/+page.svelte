<!-- individual volunteer profile — organizer can view details + edit children -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { swimLevels } from '$lib/swimLevels';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editingChildId = $state<number | null>(null);
</script>

<a href="/organizer/volunteers" style="font-size:0.9rem;">{t[$lang].backToVolunteers}</a>

<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;flex-wrap:wrap;gap:12px;">
	<h1>{data.volunteer.firstName} {data.volunteer.lastName}</h1>
	<span style="color:var(--text-light);font-size:0.9rem;">{data.volunteer.email}</span>
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
{#if data.children.length === 0}
	<div class="card" style="margin-bottom:24px;"><p style="color:var(--text-light);">{t[$lang].noChildrenLinkedProfile}</p></div>
{:else}
	<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">
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
						<div style="display:flex;align-items:center;gap:8px;">
							<span style="font-size:0.8rem;color:var(--text-light);">{child.status === 'tryout' ? t[$lang].tryoutOption : t[$lang].fullMemberOption}{#if child.level} &middot; {child.level}{/if}</span>
							<button type="button" class="btn btn-outline" style="padding:2px 8px;font-size:0.75rem;" onclick={() => editingChildId = child.id}>{t[$lang].edit}</button>
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

<!-- contribution history -->
<h2 style="margin-bottom:12px;">{t[$lang].contributionHistory}</h2>
{#if data.contributions.length === 0}
	<div class="card"><p style="color:var(--text-light);">{t[$lang].noContributionsYet}</p></div>
{:else}
	<div class="table-wrap">
		<table>
			<thead><tr><th>{t[$lang].dateCol}</th><th>{t[$lang].hoursCol}</th><th>{t[$lang].notesCol}</th></tr></thead>
			<tbody>
				{#each data.contributions as c (c.id)}
					<tr><td>{c.date}</td><td>{c.hours}h</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">{c.notes ?? '-'}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
