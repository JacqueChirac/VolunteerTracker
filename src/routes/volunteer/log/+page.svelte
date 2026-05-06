<!-- log hours page — volunteer logs hours or donations -->
<script lang="ts">
	import { today, daysAgo } from "$lib/dateBounds";
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let tab = $state<"volunteering" | "donation">("volunteering");
	let editingId = $state<number | null>(null);
	const dateMax = today();
	const dateMin = daysAgo(365);
</script>

<h1>{t[$lang].logHoursTitle}</h1>
<p style="color:var(--text-light);margin-bottom:24px;">{t[$lang].logHoursSubtitle}</p>

{#if form?.success}
	<div class="card" style="background:#d4edda;border:1px solid #c3e6cb;margin-bottom:16px;">
		<p style="color:#155724;">{form.message}</p>
	</div>
{/if}
{#if form?.error}<p class="error" style="margin-bottom:16px;">{form.error}</p>{/if}

<div class="grid-2">
	<!-- left: log form -->
	<div class="card">
		<div style="display:flex;gap:8px;margin-bottom:16px;">
			<button class="btn {tab === 'volunteering' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => tab = 'volunteering'}>{t[$lang].logHoursBtn}</button>
			<button class="btn {tab === 'donation' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => tab = 'donation'}>{t[$lang].logDonation}</button>
		</div>

		{#if tab === 'volunteering'}
			<form method="POST" action="?/volunteering" use:enhance>
				<div class="form-group">
					<label for="event">Event (optional)</label>
					<select
						id="event"
						name="eventId"
						onchange={(e) => {
							const ev = data.myEvents.find((x) => x.id === Number(e.currentTarget.value));
							if (ev) (document.getElementById("date") as HTMLInputElement).value = ev.date;
						}}
					>
						<option value="">— Other / general hours —</option>
						{#each data.myEvents as ev}
							<option value={ev.id}>{ev.date} — {ev.title}</option>
						{/each}
					</select>
				</div>
				<div class="form-group"><label for="date">{t[$lang].dateField}</label><input id="date" name="date" type="date" required value={dateMax} min={dateMin} max={dateMax} /></div>
				<div class="form-group"><label for="hours">{t[$lang].hoursField}</label><input id="hours" name="hours" type="number" step="0.5" min="0.5" max="24" required /></div>
				<div class="form-group"><label for="notes">{t[$lang].notesField}</label><textarea id="notes" name="notes" rows="2"></textarea></div>
				<button type="submit" class="btn btn-accent" style="width:100%;">{t[$lang].logHoursSubmit}</button>
			</form>
		{:else}
			<form method="POST" action="?/donation" use:enhance>
				<p style="font-size:0.85rem;color:var(--text-light);margin-bottom:12px;">{t[$lang].donationRate(data.donationRate)}</p>
				<div class="form-group"><label for="date2">{t[$lang].dateField}</label><input id="date2" name="date" type="date" required value={dateMax} min={dateMin} max={dateMax} /></div>
				<div class="form-group"><label for="amount">{t[$lang].amountField}</label><input id="amount" name="amount" type="number" step="0.01" min="1" required /></div>
				<div class="form-group"><label for="notes2">{t[$lang].notesField}</label><textarea id="notes2" name="notes" rows="2"></textarea></div>
				<button type="submit" class="btn btn-accent" style="width:100%;">{t[$lang].logDonationSubmit}</button>
			</form>
		{/if}
	</div>

	<!-- right: contribution history -->
	<div>
		<h2>{t[$lang].recentContributions}</h2>
		{#if data.contributions.length === 0}
			<div class="card" style="margin-top:12px;"><p style="color:var(--text-light);">{t[$lang].noContributions}</p></div>
		{:else}
			<div style="margin-top:12px;display:flex;flex-direction:column;gap:10px;">
				{#each data.contributions as c (c.id)}
					{#if editingId === c.id}
						<!-- inline edit form -->
						<div class="card" style="border:2px solid var(--primary);">
							<p style="font-size:0.8rem;font-weight:600;color:var(--primary);margin-bottom:10px;">Editing entry</p>
							<form method="POST" action="?/editContribution" use:enhance={() => () => { editingId = null; }}>
								<input type="hidden" name="id" value={c.id} />
								<div class="form-group">
									<label>Date</label>
									<input name="date" type="date" value={c.date} min={dateMin} max={dateMax} required />
								</div>
								{#if c.type === 'volunteering'}
									<div class="form-group">
										<label>Hours</label>
										<input name="hours" type="number" step="0.5" min="0.5" max="24" value={c.hours} required />
									</div>
								{:else}
									<div class="form-group">
										<label>Amount ($)</label>
										<input name="amount" type="number" step="0.01" min="1" value={c.amount} required />
									</div>
								{/if}
								<div class="form-group">
									<label>Notes</label>
									<textarea name="notes" rows="2">{c.notes ?? ''}</textarea>
								</div>
								<div style="display:flex;gap:8px;">
									<button type="submit" class="btn btn-primary" style="flex:1;">Save</button>
									<button type="button" class="btn btn-outline" style="flex:1;" onclick={() => editingId = null}>Cancel</button>
								</div>
							</form>
						</div>
					{:else}
						<!-- normal row -->
						<div class="card" style="padding:12px 14px;">
							<div style="display:flex;justify-content:space-between;align-items:start;gap:8px;flex-wrap:wrap;">
								<div style="flex:1;">
									<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
										<span style="font-weight:600;font-size:0.95rem;">{c.date}</span>
										<span style="font-size:0.8rem;color:var(--text-light);">{c.type === 'donation' ? `$${c.amount} donation` : 'Volunteering'}</span>
										<span style="font-size:0.85rem;font-weight:600;">{c.hours}h</span>
										{#if c.status === 'pending'}
											<span class="status-badge pending">Pending Approval</span>
										{:else}
											<span class="status-badge approved">Approved</span>
										{/if}
									</div>
									{#if c.notes}<p style="font-size:0.82rem;color:var(--text-light);">{c.notes}</p>{/if}
								</div>
								<div style="display:flex;gap:6px;flex-shrink:0;">
									{#if c.status === 'pending'}
										<button type="button" class="btn btn-outline" style="padding:3px 10px;font-size:0.78rem;" onclick={() => editingId = c.id}>Edit</button>
									{/if}
									<form method="POST" action="?/deleteContribution" use:enhance style="display:inline;">
										<input type="hidden" name="id" value={c.id} />
										<button type="submit" class="btn btn-danger" style="padding:3px 10px;font-size:0.78rem;" onclick={(e) => { if (!confirm(t[$lang].deleteConfirm)) e.preventDefault(); }}>{t[$lang].delete}</button>
									</form>
								</div>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.status-badge {
		display: inline-block;
		padding: 2px 9px;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}
	.status-badge.pending {
		background: #fff3cd;
		color: #856404;
		border: 1px solid #ffc107;
	}
	.status-badge.approved {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}
</style>
