<script lang="ts">
	import { store } from '$lib/store.svelte';

	let date = $state(new Date().toISOString().split('T')[0]);
	let hours = $state('');
	let notes = $state('');

	let error = $state<string | null>(null);
	let successMessage = $state<string | null>(null);

	const user = $derived(store.currentUser);
	const myContributions = $derived.by(() => {
		if (!user) return [];
		return store.getUserContributions(user.id).slice(0, 20);
	});

	function handleLogHours(e: Event) {
		e.preventDefault();
		error = null;
		successMessage = null;
		if (!date || !hours) {
			error = 'Date and hours are required.';
			return;
		}
		const hoursNum = parseFloat(hours);
		if (isNaN(hoursNum) || hoursNum <= 0) {
			error = 'Hours must be a positive number.';
			return;
		}
		store.logHoursForCurrentUser({ date, hours: hoursNum, notes });
		successMessage = `Logged ${hoursNum} volunteer hours.`;
		hours = '';
		notes = '';
	}

	function handleDelete(id: number) {
		if (!confirm('Delete this contribution?')) return;
		error = null;
		successMessage = null;
		const result = store.deleteContribution(id);
		if (!result.ok) {
			error = result.error;
			return;
		}
		successMessage = 'Contribution deleted.';
	}
</script>

<h1>Log Hours</h1>
<p style="color:var(--text-light);margin-bottom:24px;">Log your volunteer hours.</p>

{#if successMessage}
	<div class="card" style="background:#d4edda;border:1px solid #c3e6cb;margin-bottom:16px;">
		<p style="color:#155724;">{successMessage}</p>
	</div>
{/if}

{#if error}
	<p class="error" style="margin-bottom:16px;">{error}</p>
{/if}

<div class="grid-2">
	<div class="card">
		<h2>Log Volunteer Hours</h2>
		<form onsubmit={handleLogHours} style="margin-top:16px;">
			<div class="form-group">
				<label for="date">Date</label>
				<input id="date" type="date" bind:value={date} required />
			</div>
			<div class="form-group">
				<label for="hours">Hours</label>
				<input id="hours" type="number" step="0.5" min="0.5" bind:value={hours} required />
			</div>
			<div class="form-group">
				<label for="notes">Notes (optional)</label>
				<textarea id="notes" rows="2" bind:value={notes}></textarea>
			</div>
			<button type="submit" class="btn btn-accent" style="width:100%;">Log Hours</button>
		</form>
	</div>

	<div>
		<h2>Recent Contributions</h2>
		{#if myContributions.length === 0}
			<div class="card" style="margin-top:12px;">
				<p style="color:var(--text-light);">No contributions logged yet.</p>
			</div>
		{:else}
			<div class="table-wrap" style="margin-top:12px;">
				<table>
					<thead>
						<tr>
							<th>Date</th>
							<th>Hours</th>
							<th>Notes</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each myContributions as c}
							<tr>
								<td>{c.date}</td>
								<td>{c.hours}h</td>
								<td
									style="max-width:160px;overflow:hidden;text-overflow:ellipsis;"
									>{c.notes ?? '-'}</td
								>
								<td>
									<button
										type="button"
										class="btn btn-danger"
										style="padding:2px 8px;font-size:0.75rem;"
										onclick={() => handleDelete(c.id)}
									>
										Delete
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
