<!-- manage page - settings, activities, announcements, manual entry, export, archive -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';
	import { Mail, BookOpen } from 'lucide-svelte';
	import emailjs from '@emailjs/browser';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let manualType = $state<'volunteering' | 'donation'>('volunteering');
	let childSearch = $state('');
	let linkPick = $state<Record<number, string>>({});
	let showAddChildLevelDetails = $state(false);
	let editingLevelId = $state<number | null>(null);
	let editingAnnouncementId = $state<number | null>(null);

	let openAnnouncements = $state(true);
	let openSettings = $state(true);
	let openPeople = $state(true);
	let openEntry = $state(true);
	let openExport = $state(false);

	// typed confirmation for the destructive "archive & reset everything" action
	let archiveConfirmText = $state('');
	const ARCHIVE_KEYWORD = 'ARCHIVE';

  let filteredChildren = $derived.by(() => {
    const q = childSearch.trim().toLowerCase();
    if (!q) return data.children;
    return data.children.filter((c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q),
    );
  });

  function volunteerName(id: number): string {
    const v = data.volunteers.find((x) => x.id === id);
    return v ? `${v.firstName} ${v.lastName}` : "?";
  }
</script>

<h1>{t[$lang].manageTitle}</h1>
<p style="color:var(--text-light);margin-bottom:20px;">
  {t[$lang].manageSubtitle}
</p>

<!-- emailing quick-access -->
<div class="email-banner">
	<div class="email-banner-left">
		<span class="email-icon"><Mail size={28} color="white" /></span>
		<div>
			<p class="email-banner-title">{$lang === 'en' ? 'Emailing' : 'Courriels'}</p>
			<p class="email-banner-desc">{$lang === 'en' ? 'Send emails and manage templates for your volunteers.' : 'Envoyer des courriels et gérer les modèles pour vos bénévoles.'}</p>
		</div>
	</div>
	<a href="/organizer/manage/emailing" class="btn btn-primary" style="white-space:nowrap;flex-shrink:0;">{$lang === 'en' ? '→ Open Emailing' : '→ Ouvrir les courriels'}</a>
</div>

<!-- tutorial quick-access -->
<div class="tutorial-banner" style="margin-bottom:28px;background:linear-gradient(135deg, var(--primary), var(--primary-dark));border:none;">
	<div class="email-banner-left">
		<span class="email-icon"><BookOpen size={24} color="white" /></span>
		<div>
			<p class="email-banner-title">{$lang === 'en' ? 'Tutorial' : 'Tutoriel'}</p>
			<p class="email-banner-desc">{$lang === 'en' ? 'Edit the step-by-step guide shown to volunteers.' : 'Modifier le guide étape par étape affiché aux bénévoles.'}</p>
		</div>
	</div>
	<a href="/volunteer/tutorial?edit=1" class="btn" style="white-space:nowrap;flex-shrink:0;background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.5);">{$lang === 'en' ? '→ Edit tutorial' : '→ Modifier le tutoriel'}</a>
</div>

<!-- announcements -->
<div class="accordion" style="margin-bottom:16px;">
	<button class="acc-header" onclick={() => openAnnouncements = !openAnnouncements}>
		<span class="acc-title">{t[$lang].announcements}</span>
		<span class="acc-chevron" class:rotated={openAnnouncements}>▾</span>
	</button>
{#if openAnnouncements}
<div class="acc-body">
	<div class="card">
		{#if form?.announcementError}<p class="error" style="margin-bottom:8px;">{form.announcementError}</p>{/if}
		<form method="POST" action="?/addAnnouncement" use:enhance style="margin-bottom:16px;">
			<div class="form-group"><label for="announcementTitle">{t[$lang].announcementTitle}</label><input id="announcementTitle" name="title" type="text" required /></div>
			<div class="form-group"><label for="announcementContent">{t[$lang].announcementContent}</label><textarea id="announcementContent" name="content" rows="3" required></textarea></div>
			<button type="submit" class="btn btn-accent">{t[$lang].postAnnouncement}</button>
		</form>
		{#if data.announcements.length === 0}
			<p style="color:var(--text-light);font-size:0.9rem;">{$lang === 'en' ? 'No announcements yet.' : 'Aucune annonce pour l\'instant.'}</p>
		{:else}
			{#each data.announcements as a (a.id)}
				<div style="padding:10px 0;border-bottom:1px solid var(--border);">
					{#if editingAnnouncementId === a.id}
						<!-- enhance callback runs after submit, drops us out of edit mode -->
						<form method="POST" action="?/editAnnouncement" use:enhance={() => () => { editingAnnouncementId = null; }}>
							<input type="hidden" name="id" value={a.id} />
							<div class="form-group" style="margin-bottom:8px;">
								<input name="title" type="text" value={a.title} required />
							</div>
							<div class="form-group" style="margin-bottom:8px;">
								<textarea name="content" rows="3" required>{a.content}</textarea>
							</div>
							<div style="display:flex;gap:6px;">
								<button type="submit" class="btn btn-primary" style="padding:4px 12px;font-size:0.85rem;">{$lang === 'en' ? 'Save' : 'Sauvegarder'}</button>
								<button type="button" class="btn btn-outline" style="padding:4px 12px;font-size:0.85rem;" onclick={() => editingAnnouncementId = null}>{$lang === 'en' ? 'Cancel' : 'Annuler'}</button>
							</div>
						</form>
					{:else}
						<div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">
							<div style="flex:1;">
								<strong>{a.title}</strong>
								<p style="font-size:0.85rem;color:var(--text-light);margin-top:2px;">{a.content}</p>
								<p style="font-size:0.78rem;color:var(--text-light);margin-top:4px;">{new Date(a.createdAt).toLocaleDateString()}</p>
							</div>
							<div style="display:flex;gap:4px;flex-shrink:0;">
								<button type="button" class="btn btn-outline" style="padding:2px 8px;font-size:0.75rem;" onclick={() => editingAnnouncementId = a.id}>{$lang === 'en' ? 'Edit' : 'Modifier'}</button>
								<form method="POST" action="?/deleteAnnouncement" use:enhance>
									<input type="hidden" name="id" value={a.id} />
									<button type="submit" class="btn btn-danger" style="padding:2px 8px;font-size:0.75rem;">{t[$lang].delete}</button>
								</form>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
{/if}
</div>

<!-- settings -->
<div class="accordion" style="margin-bottom:16px;">
	<button class="acc-header" onclick={() => openSettings = !openSettings}>
		<span class="acc-title">{t[$lang].settings}</span>
		<span class="acc-chevron" class:rotated={openSettings}>▾</span>
	</button>
{#if openSettings}
<div class="acc-body">
	{#if data.autoArchived}
		<div style="background:#d4edda;border:1px solid #c3e6cb;border-radius:8px;padding:12px 16px;margin-top:12px;margin-bottom:12px;">
			<p style="color:#155724;font-weight:600;margin-bottom:2px;">Season auto-archived</p>
			<p style="color:#155724;font-size:0.88rem;">The season end date passed, so contributions were archived and the season dates have been advanced by one year.</p>
		</div>
	{/if}

	<div class="card" style="margin-top:12px;">
		{#if form?.settingsSuccess}
			<div style="background:#d4edda;padding:8px 12px;border-radius:6px;margin-bottom:12px;"><p style="color:#155724;font-size:0.9rem;">{t[$lang].settingsUpdated}</p></div>
		{/if}
		<form method="POST" action="?/updateSettings" use:enhance>
			<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:end;">
				{#each Object.entries(data.settings) as [key, setting]}
					<div class="form-group" style="flex:1;min-width:200px;">
						<label for="setting_{key}">{setting.label}</label>
						<input id="setting_{key}" name="setting_{key}" type="number" step="any" min="0" value={setting.value} required />
					</div>
				{/each}
				<div class="form-group"><button type="submit" class="btn btn-primary">{t[$lang].saveSettings}</button></div>
			</div>
		</form>
	</div>

	<div class="card" style="margin-top:12px;">
		<h3 style="margin-bottom:4px;">Season Dates</h3>
		<p style="font-size:0.85rem;color:var(--text-light);margin-bottom:12px;">
			Set the season's date range. Contributions will be automatically archived when the end date passes, and the dates will advance by one year for the next cycle.
		</p>
		<form method="POST" action="?/updateSettings" use:enhance>
			<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:end;">
				<div class="form-group" style="flex:1;min-width:180px;">
					<label for="season_start">Season Start</label>
					<input id="season_start" name="setting_season_start_date" type="date" value={data.seasonDates.start} />
				</div>
				<div class="form-group" style="flex:1;min-width:180px;">
					<label for="season_end">Season End</label>
					<input id="season_end" name="setting_season_end_date" type="date" value={data.seasonDates.end} />
				</div>
				<div class="form-group">
					<button type="submit" class="btn btn-primary">Save Dates</button>
				</div>
			</div>
		</form>
	</div>

	<div style="margin-top:12px;">
		<!-- swim levels -->
		<div>
			<h2 style="margin-bottom:12px;">{$lang === 'en' ? 'Swim Levels' : 'Niveaux de natation'}</h2>
			<div class="card">
				{#if form?.swimLevelError}<p class="error" style="margin-bottom:8px;">{form.swimLevelError}</p>{/if}
				{#if form?.swimLevelSuccess}<div style="background:#d4edda;padding:8px 12px;border-radius:6px;margin-bottom:12px;"><p style="color:#155724;font-size:0.9rem;">{$lang === 'en' ? 'Saved.' : 'Sauvegardé.'}</p></div>{/if}
				{#each data.swimLevels as lvl (lvl.id)}
					<div style="padding:10px 0;border-bottom:1px solid var(--border);">
						{#if editingLevelId === lvl.id}
							<form method="POST" action="?/editSwimLevel" use:enhance={() => () => { editingLevelId = null; }}>
								<input type="hidden" name="id" value={lvl.id} />
								<div style="display:flex;flex-direction:column;gap:6px;">
									<input name="name" type="text" value={lvl.name} required style="font-weight:600;" />
									<textarea name="description" rows="2" style="font-size:0.85rem;">{lvl.description ?? ''}</textarea>
									<div style="display:flex;gap:6px;">
										<button type="submit" class="btn btn-primary" style="padding:4px 10px;font-size:0.8rem;">{$lang === 'en' ? 'Save' : 'Sauvegarder'}</button>
										<button type="button" class="btn btn-outline" style="padding:4px 10px;font-size:0.8rem;" onclick={() => editingLevelId = null}>{$lang === 'en' ? 'Cancel' : 'Annuler'}</button>
									</div>
								</div>
							</form>
						{:else}
							<div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">
								<div style="flex:1;">
									<strong>{lvl.name}</strong>
									{#if lvl.description}<p style="font-size:0.8rem;color:var(--text-light);margin-top:2px;">{lvl.description}</p>{/if}
								</div>
								<div style="display:flex;gap:4px;flex-shrink:0;">
									<button type="button" class="btn btn-outline" style="padding:2px 8px;font-size:0.75rem;" onclick={() => editingLevelId = lvl.id}>{$lang === 'en' ? 'Edit' : 'Modifier'}</button>
									<form method="POST" action="?/deleteSwimLevel" use:enhance>
										<input type="hidden" name="id" value={lvl.id} />
										<button type="submit" class="btn btn-danger" style="padding:2px 8px;font-size:0.75rem;" onclick={(e) => { if (!confirm($lang === 'en' ? 'Delete this level?' : 'Supprimer ce niveau?')) e.preventDefault(); }}>{$lang === 'en' ? 'Delete' : 'Supprimer'}</button>
									</form>
								</div>
							</div>
						{/if}
					</div>
				{/each}
				<form method="POST" action="?/addSwimLevel" use:enhance style="margin-top:16px;display:flex;flex-direction:column;gap:8px;">
					<p style="font-size:0.85rem;font-weight:600;">{$lang === 'en' ? 'Add New Level' : 'Ajouter un niveau'}</p>
					<div style="display:flex;gap:8px;">
						<input name="value" type="text" placeholder={$lang === 'en' ? 'ID (e.g. Junior 3)' : 'ID (ex: Junior 3)'} required style="flex:1;" />
						<input name="name" type="text" placeholder={$lang === 'en' ? 'Display name' : 'Nom affiché'} required style="flex:1;" />
					</div>
					<textarea name="description" rows="2" placeholder={$lang === 'en' ? 'Description (optional)' : 'Description (optionnel)'}></textarea>
					<button type="submit" class="btn btn-accent" style="align-self:flex-start;">{$lang === 'en' ? '+ Add Level' : '+ Ajouter un niveau'}</button>
				</form>
			</div>
		</div>
	</div>
</div>
{/if}
</div>

<!-- people: add volunteers + children, manage links -->
<div class="accordion" style="margin-bottom:16px;">
	<button class="acc-header" onclick={() => openPeople = !openPeople}>
		<span class="acc-title">{t[$lang].people}</span>
		<span class="acc-chevron" class:rotated={openPeople}>▾</span>
	</button>
{#if openPeople}
<div class="acc-body">
  <p style="color:var(--text-light);font-size:0.9rem;margin-bottom:12px;">{t[$lang].peopleSubtitle}</p>

  <div class="grid-2">
    <!-- add volunteer -->
    <div class="card">
      <h3 style="margin-bottom:8px;">{t[$lang].addVolunteer}</h3>
      <p style="color:var(--text-light);font-size:0.85rem;margin-bottom:12px;">
        {t[$lang].addVolunteerDesc}
      </p>
      {#if form?.volunteerSuccess}<div
          class="alert alert-success"
          role="status"
        >
          {form.volunteerSuccess}
        </div>{/if}
      {#if form?.volunteerError}<p class="error" role="alert">
          {form.volunteerError}
        </p>{/if}
      <!-- welcome email is sent server-side in the addVolunteer action -->
      <form method="POST" action="?/addVolunteer" use:enhance>
        <div class="grid-2">
          <div class="form-group">
            <label for="v_first">{t[$lang].firstNameLabel}</label><input
              id="v_first"
              name="firstName"
              type="text"
              autocomplete="given-name"
              required
            />
          </div>
          <div class="form-group">
            <label for="v_last">{t[$lang].lastNameLabel}</label><input
              id="v_last"
              name="lastName"
              type="text"
              autocomplete="family-name"
              required
            />
          </div>
        </div>
        <div class="form-group">
          <label for="v_email">{t[$lang].emailLabel}</label><input
            id="v_email"
            name="email"
            type="email"
            autocomplete="email"
            required
          />
        </div>
        <div class="form-group">
          <label for="v_pass">{t[$lang].tempPassword}</label>
          <input
            id="v_pass"
            name="password"
            type="text"
            minlength="4"
            required
            aria-describedby="v_pass_help"
          />
          <small
            id="v_pass_help"
            style="color:var(--text-light);font-size:0.8rem;"
            >{t[$lang].tempPasswordHelp}</small
          >
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;"
          >{t[$lang].createVolunteer}</button
        >
      </form>
    </div>

		<!-- add child -->
		<div class="card">
			<h3 style="margin-bottom:8px;">{t[$lang].addChild}</h3>
			<p style="color:var(--text-light);font-size:0.85rem;margin-bottom:12px;">{t[$lang].addChildDesc}</p>
			{#if form?.childSuccess}<div class="alert alert-success" role="status">{form.childSuccess}</div>{/if}
			{#if form?.childError}<p class="error" role="alert">{form.childError}</p>{/if}
			<form method="POST" action="?/addChild" use:enhance>
				<div class="grid-2">
					<div class="form-group"><label for="c_first">{t[$lang].firstNameLabel}</label><input id="c_first" name="firstName" type="text" required /></div>
					<div class="form-group"><label for="c_last">{t[$lang].lastNameLabel}</label><input id="c_last" name="lastName" type="text" required /></div>
				</div>
				<div class="grid-2">
					<div class="form-group">
						<label for="c_status">{t[$lang].statusLabel}</label>
						<select id="c_status" name="status">
							<option value="full_member">{t[$lang].fullMember}</option>
							<option value="tryout">{t[$lang].tryout}</option>
						</select>
					</div>
					<div class="form-group">
						<label for="c_level">{t[$lang].levelOptional}</label>
						<select id="c_level" name="level">
							<option value="">{t[$lang].selectLevel}</option>
							{#each data.swimLevels as lvl}
								<option value={lvl.value}>{lvl.name}</option>
							{/each}
						</select>
						<button type="button" style="background:none;border:none;color:var(--primary);cursor:pointer;font-size:0.8rem;padding:4px 0;text-align:left;box-shadow:none;min-height:auto;" onclick={() => showAddChildLevelDetails = !showAddChildLevelDetails}>
							{showAddChildLevelDetails ? t[$lang].hideLevelDetails : t[$lang].moreLevelDetails}
						</button>
						{#if showAddChildLevelDetails}
							<div style="margin-top:8px;font-size:0.8rem;color:var(--text-light);max-height:240px;overflow-y:auto;">
								{#each data.swimLevels as lvl}
									<p style="margin-bottom:8px;"><strong>{lvl.name}</strong> — {lvl.description}</p>
								{/each}
							</div>
						{/if}
					</div>
				</div>
				<div class="form-group">
					<label for="c_link">{t[$lang].linkToVolunteer}</label>
					<select id="c_link" name="linkUserId">
						<option value="">{t[$lang].none}</option>
						{#each data.volunteers as v}
							<option value={v.id}>{v.firstName} {v.lastName}</option>
						{/each}
					</select>
				</div>
				<button type="submit" class="btn btn-primary" style="width:100%;">{t[$lang].addChildBtn}</button>
			</form>
		</div>
	</div>

  <!-- children + their links -->
  <div class="card" style="margin-top:16px;">
    <div
      style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;"
    >
      <h3 style="margin:0;">
        {t[$lang].childrenAndLinks(data.children.length)}
      </h3>
      <input
        type="search"
        placeholder={t[$lang].searchChildren}
        bind:value={childSearch}
        aria-label={t[$lang].searchChildrenLabel}
        style="max-width:260px;"
      />
    </div>
    {#if form?.linkError}<p class="error" role="alert">{form.linkError}</p>{/if}
    {#if data.children.length === 0}
      <p style="color:var(--text-light);">{t[$lang].noChildrenYet}</p>
    {:else if filteredChildren.length === 0}
      <p style="color:var(--text-light);">
        {t[$lang].noChildrenMatch(childSearch)}
      </p>
    {:else}
      <ul class="link-list">
        {#each filteredChildren as child (child.id)}
          <li class="link-row">
            <div class="link-row-head">
              <div>
                <strong>{child.firstName} {child.lastName}</strong>
                <span
                  class="pill {child.status === 'tryout'
                    ? 'pill-accent'
                    : 'pill-primary'}"
                  >{child.status === "tryout"
                    ? t[$lang].tryout
                    : t[$lang].fullMember}</span
                >
                {#if child.level}<span
                    style="color:var(--text-light);font-size:0.8rem;margin-left:6px;"
                    >· {child.level}</span
                  >{/if}
              </div>
              <form
                method="POST"
                action="?/deleteChild"
                use:enhance
                onsubmit={(e) => {
                  if (
                    !confirm(
                      t[$lang].removeChildConfirm(
                        `${child.firstName} ${child.lastName}`,
                      ),
                    )
                  )
                    e.preventDefault();
                }}
              >
                <input type="hidden" name="childId" value={child.id} />
                <button
                  type="submit"
                  class="btn btn-danger btn-sm"
                  aria-label="{t[$lang]
                    .remove} {child.firstName} {child.lastName}"
                  >{t[$lang].remove}</button
                >
              </form>
            </div>
            <div class="link-row-body">
              {#if child.volunteerIds.length === 0}
                <span style="color:var(--text-light);font-size:0.85rem;"
                  >{t[$lang].noVolunteersLinked}</span
                >
              {:else}
                <div class="chips">
                  {#each child.volunteerIds as vid}
                    <span class="chip">
                      {volunteerName(vid)}
                      <form
                        method="POST"
                        action="?/unlinkChild"
                        use:enhance
                        style="display:inline;"
                      >
                        <input type="hidden" name="childId" value={child.id} />
                        <input type="hidden" name="userId" value={vid} />
                        <button
                          type="submit"
                          class="chip-x"
                          aria-label="Unlink {volunteerName(vid)}">×</button
                        >
                      </form>
                    </span>
                  {/each}
                </div>
              {/if}
              <form
                method="POST"
                action="?/linkChild"
                use:enhance
                class="link-add"
              >
                <input type="hidden" name="childId" value={child.id} />
                <select
                  name="userId"
                  bind:value={linkPick[child.id]}
                  aria-label={t[$lang].selectVolunteerToLink}
                >
                  <option value="">{t[$lang].addLinkVolunteer}</option>
                  <!-- only offer volunteers not already linked to this child -->
                  {#each data.volunteers.filter((v) => !child.volunteerIds.includes(v.id)) as v}
                    <option value={v.id}>{v.firstName} {v.lastName}</option>
                  {/each}
                </select>
                <button
                  type="submit"
                  class="btn btn-accent btn-sm"
                  disabled={!linkPick[child.id]}>{t[$lang].link}</button
                >
              </form>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
{/if}
</div>


<!-- row: manual entry + mark as met -->
<div class="accordion" style="margin-bottom:16px;">
	<button class="acc-header" onclick={() => openEntry = !openEntry}>
		<span class="acc-title">{t[$lang].manualEntry} & {$lang === 'en' ? 'Mark as Met' : 'Marquer comme atteint'}</span>
		<span class="acc-chevron" class:rotated={openEntry}>▾</span>
	</button>
{#if openEntry}
<div class="acc-body">
<div class="grid-2">
	<!-- manual entry -->
	<div>
		<h2>{t[$lang].manualEntry}</h2>
		<div class="card" style="margin-top:12px;">
			{#if form?.manualSuccess}
				<div style="background:#d4edda;padding:8px 12px;border-radius:6px;margin-bottom:12px;"><p style="color:#155724;font-size:0.9rem;">{t[$lang].entryAddedSuccess}</p></div>
			{/if}
			{#if form?.manualError}<p class="error" style="margin-bottom:8px;">{form.manualError}</p>{/if}
			<form method="POST" action="?/addManualHours" use:enhance>
				<div class="form-group">
					<label for="userId">{t[$lang].volunteer}</label>
					<select id="userId" name="userId" required>
						<option value="">{t[$lang].selectVolunteer}</option>
						{#each data.volunteers as p}<option value={p.id}>{p.firstName} {p.lastName} ({p.email})</option>{/each}
					</select>
				</div>
				<fieldset class="form-group" style="border:none;padding:0;margin-bottom:16px;">
					<legend style="font-weight:600;font-size:0.9rem;margin-bottom:6px;color:var(--text);">{t[$lang].type}</legend>
					<div style="display:flex;gap:8px;" role="radiogroup" aria-label={t[$lang].entryType}>
						<button type="button" role="radio" aria-checked={manualType === 'volunteering'} class="btn {manualType === 'volunteering' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => manualType = 'volunteering'}>{t[$lang].hours}</button>
						<button type="button" role="radio" aria-checked={manualType === 'donation'} class="btn {manualType === 'donation' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => manualType = 'donation'}>{t[$lang].donation}</button>
					</div>
					<input type="hidden" name="type" value={manualType} />
				</fieldset>
				<div class="form-group"><label for="date">{t[$lang].date}</label><input id="date" name="date" type="date" required value={new Date().toISOString().split('T')[0]} /></div>
				<div class="form-group"><label for="value">{manualType === 'donation' ? t[$lang].amountLabel : t[$lang].hoursLabel}</label><input id="value" name="value" type="number" step="0.5" min="0.5" max={manualType === 'donation' ? 10000 : 999} required /></div>
				<div class="form-group"><label for="notes">{t[$lang].notes}</label><input id="notes" name="notes" type="text" /></div>
				<button type="submit" class="btn btn-primary" style="width:100%;">{t[$lang].addEntry}</button>
			</form>
		</div>
	</div>

	<!-- mark as met -->
	<div>
		<h2>{$lang === 'en' ? 'Mark as Met' : 'Marquer comme atteint'}</h2>
		<p style="color:var(--text-light);font-size:0.85rem;margin-bottom:12px;">{$lang === 'en' ? 'Adds enough hours so the volunteer meets their requirement.' : 'Ajoute les heures nécessaires pour atteindre l\'exigence.'}</p>
		<div class="card" style="margin-top:12px;">
			{#if form?.markMetSuccess}
				<div style="background:#d4edda;padding:8px 12px;border-radius:6px;margin-bottom:12px;"><p style="color:#155724;font-size:0.9rem;">{$lang === 'en' ? 'Volunteer marked as meeting requirements.' : 'Bénévole marqué comme ayant atteint les exigences.'}</p></div>
			{/if}
			{#if form?.markMetError}<p class="error" style="margin-bottom:8px;">{form.markMetError}</p>{/if}
			<form method="POST" action="?/markMet" use:enhance style="display:flex;flex-direction:column;gap:12px;">
				<div class="form-group" style="margin-bottom:0;">
					<label for="markMetUser">{$lang === 'en' ? 'Volunteer' : 'Bénévole'}</label>
					<select id="markMetUser" name="userId" required>
						<option value="">{$lang === 'en' ? '-- Select volunteer --' : '-- Sélectionner --'}</option>
						{#each data.volunteers as v}
							<option value={v.id}>{v.firstName} {v.lastName}</option>
						{/each}
					</select>
				</div>
				<div class="form-group" style="margin-bottom:0;">
					<label for="markAs">{$lang === 'en' ? 'Requirement' : 'Exigence'}</label>
					<select id="markAs" name="markAs">
						<option value="full_member">{$lang === 'en' ? 'Annual Member' : 'Membre annuel'}</option>
						<option value="tryout">{$lang === 'en' ? 'Tryout' : 'Essai'}</option>
					</select>
				</div>
				<button type="submit" class="btn btn-primary" onclick={(e) => { if (!confirm($lang === 'en' ? 'This will add hours to meet the selected requirement. Continue?' : 'Cela ajoutera des heures. Continuer?')) e.preventDefault(); }}>{$lang === 'en' ? 'Mark as Met' : 'Marquer comme atteint'}</button>
			</form>
		</div>
	</div>
</div>
</div>
{/if}
</div>

<!-- export + archive -->
<div class="accordion" style="margin-bottom:16px;">
	<button class="acc-header" onclick={() => openExport = !openExport}>
		<span class="acc-title">{t[$lang].exportArchive}</span>
		<span class="acc-chevron" class:rotated={openExport}>▾</span>
	</button>
{#if openExport}
<div class="acc-body">
	<div class="card">
		<a href="/api/export" class="btn btn-primary" style="display:block;text-align:center;margin-bottom:16px;">{t[$lang].exportCsv}</a>
		<hr style="border:none;border-top:1px solid var(--border);margin:16px 0;" />
		<h3>{t[$lang].archiveSeason}</h3>
		<p style="font-size:0.85rem;color:var(--text-light);margin-bottom:12px;">{t[$lang].archiveSeasonDesc}</p>
		{#if form?.archiveSuccess}
			<div style="background:#d4edda;padding:8px 12px;border-radius:6px;margin-bottom:12px;"><p style="color:#155724;font-size:0.9rem;">{t[$lang].seasonArchivedSuccess}</p></div>
		{/if}
		{#if form?.restoreSuccess}
			<div style="background:#d4edda;padding:8px 12px;border-radius:6px;margin-bottom:12px;"><p style="color:#155724;font-size:0.9rem;">{form.message ?? ($lang === 'en' ? 'Archive restored.' : 'Archive restaurée.')}</p></div>
		{/if}
		{#if form?.archiveError}<p class="error" style="margin-bottom:8px;">{form.archiveError}</p>{/if}
		<form method="POST" action="?/archiveSeason" use:enhance={() => async ({ update }) => { await update(); archiveConfirmText = ''; }} onsubmit={(e) => { if (!confirm(t[$lang].archiveConfirm)) e.preventDefault(); }}>
			<div class="form-group"><label for="archiveLabel">{t[$lang].seasonLabel}</label><input id="archiveLabel" name="label" type="text" placeholder={t[$lang].seasonLabelPlaceholder} required /></div>
			<div class="form-group">
				<label for="archiveConfirm" style="color:var(--danger,#b91c1c);font-weight:600;">
					{$lang === 'en' ? `This wipes ALL hours. Type ${ARCHIVE_KEYWORD} to confirm.` : `Cela efface TOUTES les heures. Tapez ${ARCHIVE_KEYWORD} pour confirmer.`}
				</label>
				<input id="archiveConfirm" type="text" autocomplete="off" bind:value={archiveConfirmText} placeholder={ARCHIVE_KEYWORD} />
			</div>
			<!-- stays disabled until the keyword is typed exactly -->
			<button type="submit" class="btn btn-danger" style="width:100%;" disabled={archiveConfirmText.trim().toUpperCase() !== ARCHIVE_KEYWORD}>{t[$lang].archiveReset}</button>
		</form>
			<h4 style="margin-top:16px;">{t[$lang].pastArchives}</h4>
		{#if data.archives.length === 0}
			<p style="color:var(--text-light);font-size:0.85rem;">
				{$lang === 'en'
					? 'No archived seasons yet. After you archive a season above, it will appear here with a Restore button.'
					: 'Aucune saison archivée pour l\'instant. Après avoir archivé une saison ci-dessus, elle apparaîtra ici avec un bouton Restaurer.'}
			</p>
		{:else}
			{#each data.archives as archive}
				<div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
					<div style="display:flex;flex-direction:column;">
						<span>{archive.label}</span>
						<span style="font-size:0.85rem;color:var(--text-light);">{new Date(archive.archivedAt).toLocaleDateString()}</span>
					</div>
					<form method="POST" action="?/restoreSeason" use:enhance onsubmit={(e) => { if (!confirm($lang === 'en' ? `Restore "${archive.label}"? This re-adds that season's hours on top of the current data.` : `Restaurer « ${archive.label} »? Cela rajoute les heures de cette saison aux données actuelles.`)) e.preventDefault(); }}>
						<input type="hidden" name="archiveId" value={archive.id} />
						<button type="submit" class="btn btn-outline" style="padding:4px 12px;font-size:0.8rem;">{$lang === 'en' ? 'Restore' : 'Restaurer'}</button>
					</form>
				</div>
			{/each}
		{/if}
	</div>
</div>
{/if}
</div>


<style>
  .email-banner {
    display: flex; justify-content: space-between; align-items: center;
    gap: 16px; flex-wrap: wrap;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white; border-radius: 16px; padding: 20px 24px;
    margin-bottom: 28px; box-shadow: 0 4px 16px rgba(46,56,72,0.15);
  }
  .email-banner-left { display: flex; align-items: center; gap: 16px; }
  .email-icon { font-size: 2rem; line-height: 1; flex-shrink: 0; }
  .email-banner-title { font-size: 1.1rem; font-weight: 700; color: white; margin-bottom: 2px; }
  .email-banner-desc { font-size: 0.85rem; color: rgba(255,255,255,0.8); margin: 0; }
  .tutorial-banner {
    display: flex; justify-content: space-between; align-items: center;
    gap: 16px; flex-wrap: wrap;
    background: var(--card-bg); border: 1px solid var(--border);
    border-radius: 16px; padding: 16px 20px;
    margin-bottom: 28px;
  }
  .accordion { border-bottom: 1px solid var(--border); }
  .acc-header {
    display: flex; justify-content: space-between; align-items: center;
    width: 100%; background: none; border: none; padding: 14px 0;
    cursor: pointer; text-align: left; box-shadow: none; min-height: auto;
    border-radius: 0; gap: 8px;
  }
  .acc-header:hover { background: none; transform: none; box-shadow: none; }
  .acc-title { font-size: 1.15rem; font-weight: 700; color: var(--text); }
  .acc-chevron { font-size: 1rem; color: var(--text-light); transition: transform 0.2s; display: inline-block; }
  .acc-chevron.rotated { transform: rotate(180deg); }
  .acc-body { padding: 4px 0 24px; }
  .alert {
    padding: 8px 12px;
    border-radius: 10px;
    margin-bottom: 12px;
    font-size: 0.9rem;
  }
  .alert-success {
    background: #ddf1e1;
    color: #1f5a3a;
    border: 1px solid #b8e0c2;
  }
  .btn-sm {
    padding: 6px 12px;
    font-size: 0.8rem;
    border-radius: 12px;
  }
  .pill {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-left: 8px;
    vertical-align: middle;
  }
  .pill-primary {
    background: rgba(88, 164, 176, 0.18);
    color: #2e6770;
  }
  .pill-accent {
    background: rgba(218, 164, 154, 0.25);
    color: #8a4f45;
  }
  .link-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .link-row {
    background: white;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 12px 14px;
  }
  .link-row-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .link-row-body {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(88, 164, 176, 0.14);
    color: #235760;
    padding: 4px 4px 4px 10px;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 500;
  }
  .chip-x {
    appearance: none;
    background: transparent;
    border: none;
    color: #235760;
    font-size: 1rem;
    line-height: 1;
    padding: 0 6px;
    cursor: pointer;
    border-radius: 999px;
    min-width: 24px;
    min-height: 24px;
    box-shadow: none;
  }
  .chip-x:hover {
    background: rgba(88, 164, 176, 0.25);
    transform: none;
    box-shadow: none;
  }
  .link-add {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .link-add select {
    max-width: 220px;
    padding: 8px 12px;
    font-size: 0.9rem;
  }

  @media (max-width: 600px) {
    .link-row-head,
    .link-row-body {
      flex-direction: column;
      align-items: stretch;
    }
    .link-add select {
      max-width: 100%;
      flex: 1;
    }
    .link-add {
      width: 100%;
    }
  }
</style>
