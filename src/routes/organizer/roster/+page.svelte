<!-- roster — all children & volunteers in one place, exportable -->
<script lang="ts">
	import type { PageData } from './$types';
	import { lang } from '$lib/stores/lang';

	let { data }: { data: PageData } = $props();

	let tab = $state<'children' | 'volunteers'>('children');
	let search = $state('');

	let filteredChildren = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (!q) return data.childrenData;
		return data.childrenData.filter(
			(c) =>
				`${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
				c.level.toLowerCase().includes(q) ||
				c.volunteerNames.some((n) => n.toLowerCase().includes(q))
		);
	});

	let filteredVolunteers = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (!q) return data.volunteersData;
		return data.volunteersData.filter(
			(v) =>
				`${v.firstName} ${v.lastName}`.toLowerCase().includes(q) ||
				v.email.toLowerCase().includes(q) ||
				v.linkedChildren.some((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q))
		);
	});

	const en = $derived($lang === 'en');
</script>

<div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
	<div>
		<h1>{en ? 'Roster' : 'Liste'}</h1>
		<p style="color:var(--text-light);margin-top:4px;">{en ? 'All children and volunteers at a glance.' : 'Tous les enfants et bénévoles en un coup d\'œil.'}</p>
	</div>
	<div style="display:flex;gap:8px;flex-wrap:wrap;">
		<a href="/api/export?type=children" class="btn btn-outline" style="font-size:0.85rem;">
			⬇ {en ? 'Export Children CSV' : 'Exporter enfants CSV'}
		</a>
		<a href="/api/export?type=volunteers" class="btn btn-outline" style="font-size:0.85rem;">
			⬇ {en ? 'Export Volunteers CSV' : 'Exporter bénévoles CSV'}
		</a>
	</div>
</div>

<!-- tabs -->
<div class="tabs" style="margin-bottom:16px;">
	<button class="tab-btn" class:active={tab === 'children'} onclick={() => { tab = 'children'; search = ''; }}>
		{en ? 'Children' : 'Enfants'} <span class="count">{data.childrenData.length}</span>
	</button>
	<button class="tab-btn" class:active={tab === 'volunteers'} onclick={() => { tab = 'volunteers'; search = ''; }}>
		{en ? 'Volunteers' : 'Bénévoles'} <span class="count">{data.volunteersData.length}</span>
	</button>
</div>

<!-- search -->
<input
	type="search"
	placeholder={tab === 'children'
		? (en ? 'Search by name, level, or volunteer…' : 'Chercher par nom, niveau ou bénévole…')
		: (en ? 'Search by name or email…' : 'Chercher par nom ou courriel…')}
	bind:value={search}
	style="max-width:360px;margin-bottom:20px;"
/>

<!-- children table -->
{#if tab === 'children'}
	{#if filteredChildren.length === 0}
		<div class="card"><p style="color:var(--text-light);">{en ? 'No children found.' : 'Aucun enfant trouvé.'}</p></div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>{en ? 'Name' : 'Nom'}</th>
						<th>{en ? 'Status' : 'Statut'}</th>
						<th>{en ? 'Level' : 'Niveau'}</th>
						<th>{en ? 'Progress' : 'Progression'}</th>
						<th>{en ? 'Volunteers' : 'Bénévoles'}</th>
						<th>{en ? 'Done' : 'Complété'}</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredChildren as c (c.id)}
						<tr>
							<td><strong>{c.firstName} {c.lastName}</strong></td>
							<td>
								<span class="pill {c.status === 'tryout' ? 'pill-accent' : 'pill-primary'}">
									{c.status === 'tryout' ? (en ? 'Tryout' : 'Essai') : (en ? 'Full Member' : 'Membre complet')}
								</span>
							</td>
							<td style="color:var(--text-light);font-size:0.85rem;">{c.level || '—'}</td>
							<td class="progress-cell">
								<div style="display:flex;align-items:center;gap:8px;">
									<div class="mini-bar">
										<div class="mini-fill" style="width:{Math.min(100, (c.totalHours / c.requiredHours) * 100)}%;"></div>
									</div>
									<span style="font-size:0.8rem;white-space:nowrap;color:var(--text-light);">{c.totalHours} / {c.requiredHours} hrs</span>
								</div>
							</td>
							<td style="font-size:0.85rem;">
								{#if c.volunteerNames.length === 0}
									<span style="color:var(--text-light);">—</span>
								{:else}
									{c.volunteerNames.join(', ')}
								{/if}
							</td>
							<td style="text-align:center;font-size:1.1rem;">
								{#if c.complete}
									<span style="color:#2E7D32;">✓</span>
								{:else}
									<span style="color:var(--text-light);">·</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p style="font-size:0.8rem;color:var(--text-light);margin-top:8px;">
			{filteredChildren.filter(c => c.complete).length} / {filteredChildren.length} {en ? 'complete' : 'complétés'}
		</p>
	{/if}
{/if}

<!-- volunteers table -->
{#if tab === 'volunteers'}
	{#if filteredVolunteers.length === 0}
		<div class="card"><p style="color:var(--text-light);">{en ? 'No volunteers found.' : 'Aucun bénévole trouvé.'}</p></div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>{en ? 'Name' : 'Nom'}</th>
						<th>{en ? 'Email' : 'Courriel'}</th>
						<th>{en ? 'Hours' : 'Heures'}</th>
						<th>{en ? 'Children' : 'Enfants'}</th>
						<th>{en ? 'Approved' : 'Approuvé'}</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredVolunteers as v (v.id)}
						<tr>
							<td>
								<a href="/organizer/volunteers/{v.id}" style="font-weight:600;">{v.firstName} {v.lastName}</a>
							</td>
							<td style="font-size:0.85rem;color:var(--text-light);">{v.email}</td>
							<td style="font-weight:600;">{v.totalHours} <span style="font-weight:400;color:var(--text-light);font-size:0.8rem;">hrs</span></td>
							<td style="font-size:0.85rem;">
								{#if v.linkedChildren.length === 0}
									<span style="color:var(--text-light);">—</span>
								{:else}
									{#each v.linkedChildren as child}
										<span class="pill {child.status === 'tryout' ? 'pill-accent' : 'pill-primary'}" style="margin-right:4px;margin-bottom:2px;">
											{child.firstName} {child.lastName}
										</span>
									{/each}
								{/if}
							</td>
							<td style="text-align:center;font-size:1.1rem;">
								{#if v.manuallyApproved}
									<span style="color:#2E7D32;">✓</span>
								{:else}
									<span style="color:var(--text-light);">·</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p style="font-size:0.8rem;color:var(--text-light);margin-top:8px;">
			{filteredVolunteers.length} {en ? 'volunteers' : 'bénévoles'}
		</p>
	{/if}
{/if}

<style>
	.tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--border); }
	.tab-btn {
		background: none;
		border: none;
		border-bottom: 3px solid transparent;
		margin-bottom: -2px;
		padding: 8px 20px;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-light);
		cursor: pointer;
		box-shadow: none;
		border-radius: 0;
		transition: color 0.15s, border-color 0.15s;
		min-height: auto;
	}
	.tab-btn:hover { color: var(--text); transform: none; box-shadow: none; }
	.tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
	.count {
		display: inline-block;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 700;
		padding: 1px 7px;
		margin-left: 6px;
		vertical-align: middle;
	}
	.table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid var(--border); }
	table { width: 100%; border-collapse: collapse; background: var(--card-bg); }
	thead { background: var(--bg); }
	th {
		text-align: left;
		padding: 10px 14px;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-light);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		border-bottom: 1px solid var(--border);
		white-space: nowrap;
	}
	td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
	tbody tr:last-child td { border-bottom: none; }
	tbody tr:hover { background: rgba(88,164,176,0.04); }
	.mini-bar { width: 80px; height: 8px; background: var(--bg); border-radius: 4px; overflow: hidden; flex-shrink: 0; border: 1px solid var(--border); }
	.mini-fill { height: 100%; background: var(--primary); border-radius: 4px; transition: width 0.3s; }
	.pill {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}
	.pill-primary { background: rgba(88,164,176,0.18); color: #2E6770; }
	.pill-accent { background: rgba(218,164,154,0.25); color: #8A4F45; }
	@media (max-width: 600px) {
		th, td { padding: 8px 10px; }
		.mini-bar { width: 50px; }
	}
</style>
