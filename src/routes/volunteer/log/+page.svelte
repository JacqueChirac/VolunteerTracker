<!-- log hours page — volunteer logs hours or donations -->
<script lang="ts">
	import { today, daysAgo } from "$lib/dateBounds";
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let tab = $state<"volunteering" | "donation">("volunteering");
  let submitting = $state(false);
  const dateMax = today();
  const dateMin = daysAgo(365);

  // a self-logged contribution shows as "pending approval" until pendingUntil passes
  function isPending(c: { pendingUntil?: string | Date | null }) {
    return !!c.pendingUntil && new Date(c.pendingUntil).getTime() > Date.now();
  }
  let formPending = $derived(Boolean((form as { pending?: boolean } | null | undefined)?.pending));
</script>

<h1>{t[$lang].logHoursTitle}</h1>
<p style="color:var(--text-light);margin-bottom:24px;">{t[$lang].logHoursSubtitle}</p>

{#if form?.success}
  <div
    class="card"
    style="background:{formPending ? '#fff3cd' : '#d4edda'};border:1px solid {formPending ? '#ffeeba' : '#c3e6cb'};margin-bottom:16px;"
  >
    <p style="color:{formPending ? '#856404' : '#155724'};">{form.message}</p>
  </div>
{/if}
{#if form?.error}<p class="error" style="margin-bottom:16px;">
    {form.error}
  </p>{/if}

<div class="grid-2">
	<!-- left: log form -->
	<div class="card">
		<div style="display:flex;gap:8px;margin-bottom:16px;">
			<button class="btn {tab === 'volunteering' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => tab = 'volunteering'}>{t[$lang].logHoursBtn}</button>
			<button class="btn {tab === 'donation' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => tab = 'donation'}>{t[$lang].logDonation}</button>
		</div>

		<!-- Log events with date constraints -->
		{#if tab === 'volunteering'}
			<form method="POST" action="?/volunteering" use:enhance={({ cancel }) => {
				if (submitting) return cancel();
				submitting = true;
				return async ({ update }) => { await update(); submitting = false; };
			}}>
				<div class="form-group">
					<label for="event">Event (optional)</label>
					<select
						id="event"
						name="eventId"
						onchange={(e) => {
							const ev = data.allEvents.find(
								(x) => x.id === Number(e.currentTarget.value),
							);
							if (ev)
								(document.getElementById("date") as HTMLInputElement).value =
									ev.date;
						}}
					>
						<option value="">— Other / general hours —</option>
						{#each data.allEvents as ev}
							<option value={ev.id}>{ev.date} — {ev.title}</option>
						{/each}
					</select>
				</div>
				<div class="form-group"><label for="date">{t[$lang].dateField}</label><input id="date" name="date" type="date" required value={dateMax} min={dateMin} max={dateMax} /></div>
				<div class="form-group"><label for="hours">{t[$lang].hoursField}</label><input id="hours" name="hours" type="number" step="0.5" min="0.5" max="24" required /></div>
				<div class="form-group"><label for="notes">{t[$lang].notesField}</label><textarea id="notes" name="notes" rows="2"></textarea></div>
				<button type="submit" class="btn btn-accent" style="width:100%;" disabled={submitting}>
					{submitting ? 'Submitting…' : t[$lang].logHoursSubmit}
				</button>
			</form>
		{:else}
			<form method="POST" action="?/donation" use:enhance={({ cancel }) => {
				if (submitting) return cancel();
				submitting = true;
				return async ({ update }) => { await update(); submitting = false; };
			}}>
				<p style="font-size:0.85rem;color:var(--text-light);margin-bottom:12px;">{t[$lang].donationRate(data.donationRate)}</p>
				<div class="form-group">
					<label for="don_event">Event (optional)</label>
					<select
						id="don_event"
						name="eventId"
						onchange={(e) => {
							const ev = data.allEvents.find((x) => x.id === Number(e.currentTarget.value));
							if (ev) (document.getElementById("date2") as HTMLInputElement).value = ev.date;
						}}
					>
						<option value="">— Not tied to a specific event —</option>
						{#each data.allEvents as ev}
							<option value={ev.id}>{ev.date} — {ev.title}</option>
						{/each}
					</select>
				</div>
				<div class="form-group"><label for="date2">{t[$lang].dateField}</label><input id="date2" name="date" type="date" required value={dateMax} min={dateMin} max={dateMax} /></div>
				<div class="form-group"><label for="amount">{t[$lang].amountField}</label><input id="amount" name="amount" type="number" step="0.01" min="1" max="10000" required /></div>
				<div class="form-group"><label for="notes2">{t[$lang].notesField}</label><textarea id="notes2" name="notes" rows="2"></textarea></div>
				<button type="submit" class="btn btn-accent" style="width:100%;" disabled={submitting}>
					{submitting ? 'Submitting…' : t[$lang].logDonationSubmit}
				</button>
			</form>
		{/if}
	</div>

	<!-- right: recent history -->
	<div>
		<h2>{t[$lang].recentContributions}</h2>
		{#if data.contributions.length === 0}
			<div class="card" style="margin-top:12px;"><p style="color:var(--text-light);">{t[$lang].noContributions}</p></div>
		{:else}
			<div class="table-wrap" style="margin-top:12px;">
				<table>
					<thead><tr><th>{t[$lang].dateCol}</th><th>{t[$lang].typeCol}</th><th>{t[$lang].hoursCol}</th><th>{t[$lang].notesCol}</th><th></th></tr></thead>
					<tbody>
						{#each data.contributions as c (c.id)}
							<tr>
								<td>{c.date}</td>
								<td>
									{c.type === 'donation' ? `$${c.amount}` : t[$lang].vol}
									{#if isPending(c)}<span class="pending-badge">{$lang === 'en' ? 'Pending approval' : 'En attente'}</span>{/if}
								</td>
								<td>{c.hours}h</td>
								<td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;">{c.notes ?? '-'}</td>
								<td>
									<form method="POST" action="?/deleteContribution" use:enhance style="display:inline;">
										<input type="hidden" name="id" value={c.id} />
										<button type="submit" class="btn btn-danger" style="padding:2px 8px;font-size:0.75rem;" onclick={(e) => { if (!confirm(t[$lang].deleteConfirm)) e.preventDefault(); }}>{t[$lang].delete}</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	.pending-badge {
		display: inline-block;
		margin-left: 6px;
		padding: 1px 7px;
		border-radius: 999px;
		background: #fff3cd;
		color: #856404;
		border: 1px solid #ffeeba;
		font-size: 0.7rem;
		font-weight: 600;
		white-space: nowrap;
		vertical-align: middle;
	}
</style>
