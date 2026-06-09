<!-- organizer events dashboard — event list with add/edit/delete -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { today, daysFromNow } from '$lib/dateBounds';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';
	import { formatEventDateTime, isEventPast } from '$lib/formatEventDate';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let showAddEvent = $state(false);

	const dateMin = today();
	const dateMax = daysFromNow(730); // ~2 years
	const monthMin = dateMin.slice(0, 7);
	const monthMax = dateMax.slice(0, 7);

	let upcomingEvents = $derived(
		data.events.filter((e: (typeof data.events)[0]) => !isEventPast(e, dateMin))
	);
	let pastEvents = $derived(
		data.events.filter((e: (typeof data.events)[0]) => isEventPast(e, dateMin))
	);

	let editingId = $state<number | null>(null);
	let addMode = $state<'day' | 'month'>('day');
	let editMode = $state<'day' | 'month'>('day');
	let savingId = $state<number | null>(null);
	let editSnapshot = $state<string>(''); // JSON of fields when edit opened, for dirty check
	let lastSavedId = $state<number | null>(null); // for per-row success message

	// Errors from a failed edit attempt — only show if this row is the one that failed
	const editError = $derived(
		form && 'editId' in form && form.editId === editingId ? form.error : null
	);

	type EditableEvent = (typeof data.events)[0];

	function openEdit(event: EditableEvent) {
		editingId = event.id;
		editMode = event.datePrecision === 'month' ? 'month' : 'day';
		editSnapshot = JSON.stringify({
			title: event.title,
			date: event.date,
			startTime: event.startTime ?? '',
			endTime: event.endTime ?? '',
			location: event.location ?? '',
			description: event.description ?? '',
			volunteersNeeded: event.volunteersNeeded ?? '',
			precision: editMode
		});
	}

	function currentEditValues(formEl: HTMLFormElement, event: EditableEvent) {
		const fd = new FormData(formEl);
		return JSON.stringify({
			title: (fd.get('title') ?? '').toString(),
			date: editMode === 'day' ? (fd.get('date') ?? '').toString() : `${(fd.get('month') ?? '').toString()}-01`,
			startTime: editMode === 'day' ? (fd.get('startTime') ?? '').toString() : '',
			endTime: editMode === 'day' ? (fd.get('endTime') ?? '').toString() : '',
			location: (fd.get('location') ?? '').toString(),
			description: (fd.get('description') ?? '').toString(),
			volunteersNeeded: (fd.get('volunteersNeeded') ?? '').toString(),
			precision: editMode
		});
	}

	function cancelEdit(formEl: HTMLFormElement, event: EditableEvent) {
		const isDirty = currentEditValues(formEl, event) !== editSnapshot;
		if (isDirty && !confirm(t[$lang].unsavedChangesConfirm)) return;
		editingId = null;
	}
</script>

<h1>{t[$lang].eventsDashboard}</h1>

{#if form?.success && !('editId' in form)}
	<div class="card" style="background:#d4edda;border:1px solid #c3e6cb;margin:16px 0;" role="status" aria-live="polite">
		<p style="color:#155724;">{t[$lang].eventSaved}</p>
	</div>
{/if}

<button class="btn btn-accent" style="margin:16px 0;" onclick={() => (showAddEvent = !showAddEvent)} aria-expanded={showAddEvent} aria-controls="add-event-panel">
	{showAddEvent ? t[$lang].cancel : t[$lang].addNewEvent}
</button>

<div id="add-event-panel" class="card" style="margin-bottom:20px;" hidden={!showAddEvent}>
	<h2>{t[$lang].addNewEventTitle}</h2>
	{#if form?.error && !('editId' in form)}<p class="error" role="alert" aria-live="assertive">{form.error}</p>{/if}
	<form method="POST" action="?/addEvent" use:enhance style="margin-top:12px;">
		<input type="hidden" name="datePrecision" value={addMode} />

		<fieldset class="form-group" style="border:none;padding:0;margin-bottom:12px;">
			<legend style="font-weight:600;font-size:0.9rem;margin-bottom:6px;">{t[$lang].dateMode}</legend>
			<div style="display:flex;gap:8px;" role="radiogroup">
				<button type="button" role="radio" aria-checked={addMode === 'day'} class="btn {addMode === 'day' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => (addMode = 'day')}>{t[$lang].dateModeDay}</button>
				<button type="button" role="radio" aria-checked={addMode === 'month'} class="btn {addMode === 'month' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => (addMode = 'month')}>{t[$lang].dateModeMonth}</button>
			</div>
		</fieldset>

		<div class="grid-2">
			<div class="form-group"><label for="add_title">{t[$lang].title}</label><input id="add_title" name="title" type="text" required /></div>
			{#if addMode === 'day'}
				<div class="form-group"><label for="add_date">{t[$lang].date}</label><input id="add_date" name="date" type="date" required min={dateMin} max={dateMax} /></div>
				<div class="form-group"><label for="add_start">{t[$lang].startTime}</label><input id="add_start" name="startTime" type="time" required /></div>
				<div class="form-group"><label for="add_end">{t[$lang].endTime}</label><input id="add_end" name="endTime" type="time" /></div>
			{:else}
				<div class="form-group"><label for="add_month">{t[$lang].month}</label><input id="add_month" name="month" type="month" required min={monthMin} max={monthMax} /></div>
			{/if}
			<div class="form-group"><label for="add_loc">{t[$lang].location}</label><input id="add_loc" name="location" type="text" /></div>
			<div class="form-group"><label for="add_needed">{t[$lang].peopleNeeded} <span style="color:var(--text-light);font-weight:normal;">({t[$lang].optional})</span></label><input id="add_needed" name="volunteersNeeded" type="number" min="0" step="1" placeholder={t[$lang].peopleNeededPlaceholder} /></div>
		</div>
		<div class="form-group"><label for="add_desc">{t[$lang].description}</label><textarea id="add_desc" name="description" rows="3"></textarea></div>
		<button type="submit" class="btn btn-primary">{t[$lang].createEvent}</button>
	</form>
</div>

{#if data.events.length === 0}
	<div class="card"><p style="color:var(--text-light);">{t[$lang].noEventsYet}</p></div>
{:else}
	{#snippet eventRow(event: EditableEvent, isPast: boolean)}
		<div class="card" style="margin-bottom:12px;{isPast && editingId !== event.id ? 'opacity:0.75;' : ''}">
			{#if editingId !== event.id}
				<!-- DISPLAY MODE -->
				{#if lastSavedId === event.id}
					<div class="inline-success" role="status" aria-live="polite">{t[$lang].savedInline}</div>
				{/if}
				<div style="display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap;">
					<div style="flex:1;">
						<h3>
							{event.title}
							{#if event.datePrecision === 'month'}<span class="tentative-badge">{t[$lang].tentative}</span>{/if}
							{#if isPast}<span class="past-badge">{t[$lang].pastBadge}</span>{/if}
						</h3>
						<p style="font-size:0.9rem;color:var(--text-light);">{formatEventDateTime(event, $lang)}{#if event.location} &middot; {event.location}{/if}</p>
						{#if event.description}<p style="margin-top:4px;font-size:0.9rem;">{event.description}</p>{/if}
						<p style="font-size:0.85rem;color:var(--text-light);margin-top:4px;">{event.volunteersNeeded != null ? t[$lang].volunteersSignedUpOfNeeded(event.signupCount, event.volunteersNeeded) : t[$lang].volunteersCount(event.signupCount)}</p>
					</div>
					<div style="display:flex;gap:6px;">
						<button type="button" class="btn btn-outline" style="padding:4px 10px;font-size:0.8rem;" onclick={() => openEdit(event)}>{t[$lang].edit}</button>
						<form method="POST" action="?/deleteEvent" use:enhance style="display:inline;">
							<input type="hidden" name="eventId" value={event.id} />
							<button type="submit" class="btn btn-danger" style="padding:4px 10px;font-size:0.8rem;" aria-label={t[$lang].deleteEvent(event.title)} onclick={(e) => { if (!confirm(t[$lang].deleteEventConfirm)) e.preventDefault(); }}>{t[$lang].delete}</button>
						</form>
					</div>
				</div>
			{:else}
				<!-- EDIT MODE -->
				<form
					method="POST"
					action="?/editEvent"
					use:enhance={() => {
						savingId = event.id;
						return async ({ result, update }) => {
							await update({ reset: false });
							savingId = null;
							// Only close on success — keep form open with typed data on validation failure
							if (result.type === 'success' || result.type === 'redirect') {
								editingId = null;
								lastSavedId = event.id;
								setTimeout(() => { if (lastSavedId === event.id) lastSavedId = null; }, 3000);
							}
						};
					}}
				>
					<input type="hidden" name="id" value={event.id} />
					<input type="hidden" name="datePrecision" value={editMode} />

					{#if editError}
						<p class="error" role="alert" aria-live="assertive" style="margin-bottom:12px;">{editError}</p>
					{/if}

					<fieldset class="form-group" style="border:none;padding:0;margin-bottom:12px;">
						<legend style="font-weight:600;font-size:0.9rem;margin-bottom:6px;">{t[$lang].dateMode}</legend>
						<div style="display:flex;gap:8px;" role="radiogroup">
							<button type="button" role="radio" aria-checked={editMode === 'day'} class="btn {editMode === 'day' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => (editMode = 'day')}>{t[$lang].dateModeDay}</button>
							<button type="button" role="radio" aria-checked={editMode === 'month'} class="btn {editMode === 'month' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => (editMode = 'month')}>{t[$lang].dateModeMonth}</button>
						</div>
					</fieldset>

					<div class="grid-2">
						<div class="form-group">
							<label>{t[$lang].title}<input name="title" type="text" required value={event.title} /></label>
						</div>
						{#if editMode === 'day'}
							<div class="form-group">
								<label>{t[$lang].date}<input name="date" type="date" required value={event.date} max={dateMax} /></label>
							</div>
							<div class="form-group">
								<label>{t[$lang].startTime}<input name="startTime" type="time" required value={event.startTime ?? ''} /></label>
							</div>
							<div class="form-group">
								<label>{t[$lang].endTime}<input name="endTime" type="time" value={event.endTime ?? ''} /></label>
							</div>
						{:else}
							<div class="form-group">
								<label>{t[$lang].month}<input name="month" type="month" required value={event.date.slice(0, 7)} max={monthMax} /></label>
							</div>
						{/if}
						<div class="form-group">
							<label>{t[$lang].location}<input name="location" type="text" value={event.location ?? ''} /></label>
						</div>
						<div class="form-group">
							<label>{t[$lang].peopleNeeded} <span style="color:var(--text-light);font-weight:normal;">({t[$lang].optional})</span><input name="volunteersNeeded" type="number" min="0" step="1" value={event.volunteersNeeded ?? ''} placeholder={t[$lang].peopleNeededPlaceholder} /></label>
						</div>
					</div>
					<div class="form-group">
						<label>{t[$lang].description}<textarea name="description" rows="2">{event.description ?? ''}</textarea></label>
					</div>
					<div style="display:flex;gap:8px;">
						<button type="submit" class="btn btn-primary" disabled={savingId === event.id}>
							{savingId === event.id ? t[$lang].saving : t[$lang].save}
						</button>
						<button
							type="button"
							class="btn btn-outline"
							disabled={savingId === event.id}
							onclick={(e) => cancelEdit((e.currentTarget as HTMLButtonElement).form as HTMLFormElement, event)}
						>
							{t[$lang].cancel}
						</button>
					</div>
				</form>
			{/if}
		</div>
	{/snippet}

	<h2 style="margin-bottom:12px;">{t[$lang].upcomingEvents(upcomingEvents.length)}</h2>
	{#each upcomingEvents as event (event.id)}
		{@render eventRow(event, false)}
	{/each}

	<h2 style="margin-top:32px;margin-bottom:12px;">{t[$lang].pastEvents(pastEvents.length)}</h2>
	{#each pastEvents as event (event.id)}
		{@render eventRow(event, true)}
	{/each}
{/if}

<style>
	.tentative-badge,
	.past-badge {
		display: inline-block;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 1px 8px;
		margin-left: 6px;
		vertical-align: middle;
		letter-spacing: 0.3px;
	}
	.tentative-badge {
		background: #fff3cd;
		color: #856404;
		border: 1px solid #ffeeba;
	}
	.past-badge {
		background: #e9ecef;
		color: #495057;
		border: 1px solid #ced4da;
	}
	.inline-success {
		background: #d4edda;
		border: 1px solid #c3e6cb;
		color: #155724;
		font-size: 0.85rem;
		padding: 6px 10px;
		border-radius: 6px;
		margin-bottom: 10px;
	}
</style>
