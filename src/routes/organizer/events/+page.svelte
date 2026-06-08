<!-- organizer events dashboard — event list with add/edit/delete -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { today, daysFromNow } from "$lib/dateBounds";
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
    data.events.filter((e: (typeof data.events)[0]) => !isEventPast(e, dateMin)),
  );
  let pastEvents = $derived(
    data.events.filter((e: (typeof data.events)[0]) => isEventPast(e, dateMin)),
  );

  let editingId = $state<number | null>(null);
  let addMode = $state<'day' | 'month'>('day');
  let editMode = $state<'day' | 'month'>('day');
</script>

<h1>{t[$lang].eventsDashboard}</h1>

{#if form?.success}
	<div class="card" style="background:#d4edda;border:1px solid #c3e6cb;margin:16px 0;" role="status" aria-live="polite">
		<p style="color:#155724;">{t[$lang].eventSaved}</p>
	</div>
{/if}

<button class="btn btn-accent" style="margin:16px 0;" onclick={() => showAddEvent = !showAddEvent} aria-expanded={showAddEvent} aria-controls="add-event-panel">
	{showAddEvent ? t[$lang].cancel : t[$lang].addNewEvent}
</button>

<div id="add-event-panel" class="card" style="margin-bottom:20px;" hidden={!showAddEvent}>
		<h2>{t[$lang].addNewEventTitle}</h2>
		{#if form?.error}<p class="error" role="alert" aria-live="assertive">{form.error}</p>{/if}
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
	<h2 style="margin-bottom:12px;">{t[$lang].upcomingEvents(upcomingEvents.length)}</h2>
	{#each upcomingEvents as event (event.id)}
		<div class="card" style="margin-bottom:12px;">
			{#if editingId !== event.id}
				<!-- DISPLAY MODE -->
				<div style="display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap;">
					<div style="flex:1;">
						<h3>{event.title}{#if event.datePrecision === 'month'} <span class="tentative-badge">{t[$lang].tentative}</span>{/if}</h3>
						<p style="font-size:0.9rem;color:var(--text-light);">{formatEventDateTime(event, $lang)}{#if event.location} &middot; {event.location}{/if}</p>
						{#if event.description}<p style="margin-top:4px;font-size:0.9rem;">{event.description}</p>{/if}
						<p style="font-size:0.85rem;color:var(--text-light);margin-top:4px;">{event.volunteersNeeded != null ? t[$lang].volunteersSignedUpOfNeeded(event.signupCount, event.volunteersNeeded) : t[$lang].volunteersCount(event.signupCount)}</p>
					</div>
					<div style="display:flex;gap:6px;">
						<button type="button" class="btn btn-outline" style="padding:4px 10px;font-size:0.8rem;" onclick={() => { editingId = event.id; editMode = (event.datePrecision === 'month' ? 'month' : 'day'); }}>Edit</button>
						<form method="POST" action="?/deleteEvent" use:enhance style="display:inline;">
							<input type="hidden" name="eventId" value={event.id} />
							<button type="submit" class="btn btn-danger" style="padding:4px 10px;font-size:0.8rem;" aria-label={t[$lang].deleteEvent(event.title)} onclick={(e) => { if (!confirm(t[$lang].deleteEventConfirm)) e.preventDefault(); }}>{t[$lang].delete}</button>
						</form>
					</div>
				</div>
			{:else}
				<!-- EDIT MODE -->
				<form method="POST" action="?/editEvent" use:enhance={() => async ({ update }) => { await update(); editingId = null; }}>
					<input type="hidden" name="id" value={event.id} />
					<input type="hidden" name="datePrecision" value={editMode} />

					<fieldset class="form-group" style="border:none;padding:0;margin-bottom:12px;">
						<legend style="font-weight:600;font-size:0.9rem;margin-bottom:6px;">{t[$lang].dateMode}</legend>
						<div style="display:flex;gap:8px;" role="radiogroup">
							<button type="button" role="radio" aria-checked={editMode === 'day'} class="btn {editMode === 'day' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => (editMode = 'day')}>{t[$lang].dateModeDay}</button>
							<button type="button" role="radio" aria-checked={editMode === 'month'} class="btn {editMode === 'month' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => (editMode = 'month')}>{t[$lang].dateModeMonth}</button>
						</div>
					</fieldset>

					<div class="grid-2">
						<div class="form-group">
							<label>Title<input name="title" type="text" required value={event.title} /></label>
						</div>
						{#if editMode === 'day'}
							<div class="form-group">
								<label>Date<input name="date" type="date" required value={event.date} /></label>
							</div>
							<div class="form-group">
								<label>Start<input name="startTime" type="time" required value={event.startTime ?? ''} /></label>
							</div>
							<div class="form-group">
								<label>End<input name="endTime" type="time" value={event.endTime ?? ""} /></label>
							</div>
						{:else}
							<div class="form-group">
								<label>{t[$lang].month}<input name="month" type="month" required value={event.date.slice(0, 7)} /></label>
							</div>
						{/if}
						<div class="form-group">
							<label>Location<input name="location" type="text" value={event.location ?? ""} /></label>
						</div>
						<div class="form-group">
							<label>{t[$lang].peopleNeeded} <span style="color:var(--text-light);font-weight:normal;">({t[$lang].optional})</span><input name="volunteersNeeded" type="number" min="0" step="1" value={event.volunteersNeeded ?? ""} placeholder={t[$lang].peopleNeededPlaceholder} /></label>
						</div>
					</div>
					<div class="form-group">
						<label>Description<textarea name="description" rows="2">{event.description ?? ""}</textarea></label>
					</div>
					<div style="display:flex;gap:8px;">
						<button type="submit" class="btn btn-primary">Save</button>
						<button type="button" class="btn btn-outline" onclick={() => (editingId = null)}>Cancel</button>
					</div>
				</form>
			{/if}
		</div>
	{/each}

	<h2 style="margin-top:32px;margin-bottom:12px;">{t[$lang].pastEvents(pastEvents.length)}</h2>
	{#each pastEvents as event (event.id)}
		<div class="card" style="margin-bottom:12px;opacity:0.75;">
			<div style="display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap;">
				<div style="flex:1;">
					<h3>{event.title}</h3>
					<p style="font-size:0.9rem;color:var(--text-light);">{formatEventDateTime(event, $lang)}{#if event.location} &middot; {event.location}{/if}</p>
					{#if event.description}<p style="margin-top:4px;font-size:0.9rem;">{event.description}</p>{/if}
					<p style="font-size:0.85rem;color:var(--text-light);margin-top:4px;">{event.volunteersNeeded != null ? t[$lang].volunteersSignedUpOfNeeded(event.signupCount, event.volunteersNeeded) : t[$lang].volunteersCount(event.signupCount)}</p>
				</div>
				<form method="POST" action="?/deleteEvent" use:enhance style="display:inline;">
					<input type="hidden" name="eventId" value={event.id} />
					<button type="submit" class="btn btn-danger" style="padding:4px 10px;font-size:0.8rem;" aria-label={t[$lang].deleteEvent(event.title)} onclick={(e) => { if (!confirm(t[$lang].deleteConfirm)) e.preventDefault(); }}>{t[$lang].delete}</button>
				</form>
			</div>
		</div>
	{/each}
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
