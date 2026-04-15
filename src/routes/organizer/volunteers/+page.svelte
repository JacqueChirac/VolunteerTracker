<!-- volunteer list — organizer sees all volunteers and their children's progress -->
<script lang="ts">
	import { store } from '$lib/store.svelte';

	let search = $state('');

	// build the volunteer list, filtered by search and with children + hours attached
	const volunteers = $derived.by(() => {
		const needle = search.trim().toLowerCase();
		const allVolunteers = store.users.filter((u) => u.role === 'volunteer');

		// filter by name or username if searching
		const filtered = needle
			? allVolunteers.filter(
					(v) =>
						v.firstName.toLowerCase().includes(needle) ||
						v.lastName.toLowerCase().includes(needle) ||
						v.username.toLowerCase().includes(needle)
				)
			: allVolunteers;

		// for each volunteer, grab their children and total hours
		return filtered.map((volunteer) => {
			const children = store.getLinkedChildren(volunteer.id).map((c) => ({
				...c,
				totalHours: store.getChildTotalHours(c.id),
				requiredHours: store.getHoursRequired(c.status)
			}));
			const totalHours = store
				.getUserContributions(volunteer.id)
				.reduce((sum, c) => sum + parseFloat(c.hours || '0'), 0);
			return {
				id: volunteer.id,
				firstName: volunteer.firstName,
				lastName: volunteer.lastName,
				username: volunteer.username,
				totalHours: Math.round(totalHours * 100) / 100,
				children
			};
		});
	});
</script>

<h1>Volunteers</h1>
<p style="color:var(--text-light);margin-bottom:24px;">
	View all volunteers and their children's progress.
</p>

<!-- search bar -->
<form onsubmit={(e) => e.preventDefault()} style="margin-bottom:20px;display:flex;gap:8px;">
	<input
		type="text"
		placeholder="Search by name or username..."
		bind:value={search}
		style="max-width:300px;"
	/>
	{#if search}
		<button type="button" class="btn btn-outline" onclick={() => (search = '')}>Clear</button>
	{/if}
</form>

{#if volunteers.length === 0}
	<div class="card">
		<p style="color:var(--text-light);">No volunteers found.</p>
	</div>
{:else}
	{#each volunteers as volunteer (volunteer.id)}
		<div class="card" style="margin-bottom:12px;">
			<!-- volunteer name + hours summary -->
			<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
				<h3>
					<a href="/organizer/volunteers/{volunteer.id}">
						{volunteer.firstName}
						{volunteer.lastName}
					</a>
				</h3>
				<span style="font-size:0.85rem;color:var(--text-light);">
					@{volunteer.username} &middot; {volunteer.totalHours} hrs logged
				</span>
			</div>

			<!-- their children with progress bars -->
			{#if volunteer.children.length === 0}
				<p style="font-size:0.9rem;color:var(--text-light);">No children linked.</p>
			{:else}
				{#each volunteer.children as child}
					<div style="margin-top:8px;padding:8px 12px;background:var(--bg);border-radius:6px;">
						<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
							<span style="font-weight:500;">{child.firstName} {child.lastName}</span>
							<span style="font-size:0.8rem;color:var(--text-light);">
								{child.status === 'tryout' ? 'Tryout' : 'Full Member'}
							</span>
						</div>
						<div class="progress-bar" style="height:16px;">
							<div
								class="progress-bar-fill"
								style="width:{Math.min(100, (child.totalHours / child.requiredHours) * 100)}%;font-size:0.7rem;"
							>
								{child.totalHours} / {child.requiredHours} hrs
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	{/each}
{/if}
