<!-- individual volunteer profile — organizer can view details and edit children -->
<script lang="ts">
	import { page } from '$app/state';
	import { store, type ChildStatus } from '$lib/store.svelte';

	// get the volunteer ID from the URL (e.g. /organizer/volunteers/3 -> id = 3)
	const volunteerId = $derived(Number(page.params.id));
	const volunteer = $derived(
		store.users.find((u) => u.id === volunteerId && u.role === 'volunteer')
	);

	// their contribution history and linked children
	const contributions = $derived(volunteer ? store.getUserContributions(volunteer.id) : []);
	const linkedChildren = $derived.by(() => {
		if (!volunteer) return [];
		return store.getLinkedChildren(volunteer.id).map((c) => ({
			...c,
			totalHours: store.getChildTotalHours(c.id),
			requiredHours: store.getHoursRequired(c.status)
		}));
	});
	const totalHours = $derived(
		Math.round(
			contributions.reduce((sum, c) => sum + parseFloat(c.hours || '0'), 0) * 100
		) / 100
	);

	// inline edit state for editing a child's level/status
	let editingChildId = $state<number | null>(null);
	let editLevel = $state('');
	let editStatus = $state<ChildStatus>('full_member');
	let editChildSuccess = $state(false);

	function startEditChild(id: number) {
		const child = store.children.find((c) => c.id === id);
		if (!child) return;
		editingChildId = id;
		editLevel = child.level ?? '';
		editStatus = child.status;
	}

	function handleSaveChild(e: Event) {
		e.preventDefault();
		if (editingChildId == null) return;
		store.editChild(editingChildId, { level: editLevel, status: editStatus });
		editChildSuccess = true;
		editingChildId = null;
		setTimeout(() => (editChildSuccess = false), 2500);
	}
</script>

<a href="/organizer/volunteers" style="font-size:0.9rem;">&larr; Back to Volunteers</a>

{#if !volunteer}
	<div class="card" style="margin-top:12px;">
		<p style="color:var(--text-light);">Volunteer not found.</p>
	</div>
{:else}
	<!-- header -->
	<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;flex-wrap:wrap;gap:12px;">
		<h1>{volunteer.firstName} {volunteer.lastName}</h1>
		<span style="color:var(--text-light);font-size:0.9rem;">@{volunteer.username}</span>
	</div>

	{#if editChildSuccess}
		<div class="card" style="background:#d4edda;border:1px solid #c3e6cb;margin-top:12px;">
			<p style="color:#155724;">Child updated.</p>
		</div>
	{/if}

	<!-- stats -->
	<div style="display:flex;gap:16px;margin:16px 0;flex-wrap:wrap;">
		<div class="card" style="flex:1;min-width:120px;text-align:center;">
			<p style="font-size:2rem;font-weight:700;">{totalHours}</p>
			<p style="font-size:0.85rem;color:var(--text-light);">Total Hours</p>
		</div>
		<div class="card" style="flex:1;min-width:120px;text-align:center;">
			<p style="font-size:2rem;font-weight:700;">{contributions.length}</p>
			<p style="font-size:0.85rem;color:var(--text-light);">Contributions</p>
		</div>
	</div>

	<!-- children with progress bars (organizer can edit level/status) -->
	<h2 style="margin-bottom:12px;">Children</h2>
	{#if linkedChildren.length === 0}
		<div class="card" style="margin-bottom:24px;">
			<p style="color:var(--text-light);">No children linked.</p>
		</div>
	{:else}
		<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">
			{#each linkedChildren as child (child.id)}
				<div class="card">
					{#if editingChildId === child.id}
						<!-- inline edit form -->
						<form onsubmit={handleSaveChild}>
							<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end;">
								<div class="form-group" style="flex:1;min-width:150px;margin-bottom:0;">
									<label for="level_{child.id}">Level</label>
									<input id="level_{child.id}" type="text" bind:value={editLevel} placeholder="e.g. Beginner" />
								</div>
								<div class="form-group" style="min-width:150px;margin-bottom:0;">
									<label for="status_{child.id}">Status</label>
									<select id="status_{child.id}" bind:value={editStatus}>
										<option value="full_member">Full Member</option>
										<option value="tryout">Tryout</option>
									</select>
								</div>
								<button type="submit" class="btn btn-primary" style="padding:6px 14px;font-size:0.85rem;">Save</button>
								<button type="button" class="btn btn-outline" style="padding:6px 14px;font-size:0.85rem;" onclick={() => (editingChildId = null)}>Cancel</button>
							</div>
						</form>
					{:else}
						<!-- display mode -->
						<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:4px;">
							<strong>{child.firstName} {child.lastName}</strong>
							<div style="display:flex;align-items:center;gap:8px;">
								<span style="font-size:0.8rem;color:var(--text-light);">
									{child.status === 'tryout' ? 'Tryout' : 'Full Member'}
									{#if child.level}&middot; {child.level}{/if}
								</span>
								<button type="button" class="btn btn-outline" style="padding:2px 8px;font-size:0.75rem;" onclick={() => startEditChild(child.id)}>Edit</button>
							</div>
						</div>
						<div class="progress-bar" style="height:16px;">
							<div
								class="progress-bar-fill"
								style="width:{Math.min(100, (child.totalHours / child.requiredHours) * 100)}%;font-size:0.7rem;"
							>
								{child.totalHours} / {child.requiredHours} hrs
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- contribution history table -->
	<h2 style="margin-bottom:12px;">Contribution History</h2>
	{#if contributions.length === 0}
		<div class="card">
			<p style="color:var(--text-light);">No contributions logged yet.</p>
		</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Hours</th>
						<th>Notes</th>
					</tr>
				</thead>
				<tbody>
					{#each contributions as c (c.id)}
						<tr>
							<td>{c.date}</td>
							<td>{c.hours}h</td>
							<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">
								{c.notes ?? '-'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
{/if}
