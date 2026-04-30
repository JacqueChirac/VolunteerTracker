<!-- manage page — settings, activities, announcements, manual entry, export, archive -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { swimLevels } from '$lib/swimLevels';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let manualType = $state<'volunteering' | 'donation'>('volunteering');
	let childSearch = $state('');
	let linkPick = $state<Record<number, string>>({});
	let showAddChildLevelDetails = $state(false);

	let filteredChildren = $derived.by(() => {
		const q = childSearch.trim().toLowerCase();
		if (!q) return data.children;
		return data.children.filter((c) =>
			`${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
		);
	});

	function volunteerName(id: number): string {
		const v = data.volunteers.find((x) => x.id === id);
		return v ? `${v.firstName} ${v.lastName}` : '?';
	}
</script>

<h1>Manage</h1>
<p style="color:var(--text-light);margin-bottom:24px;">Settings, activity types, announcements, manual entries, and more.</p>

<!-- settings -->
<div style="margin-bottom:32px;">
	<h2>Settings</h2>
	<div class="card" style="margin-top:12px;">
		{#if form?.settingsSuccess}
			<div style="background:#d4edda;padding:8px 12px;border-radius:6px;margin-bottom:12px;"><p style="color:#155724;font-size:0.9rem;">Settings updated.</p></div>
		{/if}
		<form method="POST" action="?/updateSettings" use:enhance>
			<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:end;">
				{#each Object.entries(data.settings) as [key, setting]}
					<div class="form-group" style="flex:1;min-width:200px;">
						<label for="setting_{key}">{setting.label}</label>
						<input id="setting_{key}" name="setting_{key}" type="number" step="any" min="0" value={setting.value} required />
					</div>
				{/each}
				<div class="form-group"><button type="submit" class="btn btn-primary">Save Settings</button></div>
			</div>
		</form>
	</div>
</div>

<!-- people: add volunteers + children, manage links -->
<section style="margin-bottom:32px;">
	<h2>People</h2>
	<p style="color:var(--text-light);font-size:0.9rem;margin-bottom:12px;">Create volunteer accounts, add children, and manage the links between them.</p>

	<div class="grid-2">
		<!-- add volunteer -->
		<div class="card">
			<h3 style="margin-bottom:8px;">Add Volunteer</h3>
			<p style="color:var(--text-light);font-size:0.85rem;margin-bottom:12px;">Creates a login account that the volunteer can use right away.</p>
			{#if form?.volunteerSuccess}<div class="alert alert-success" role="status">{form.volunteerSuccess}</div>{/if}
			{#if form?.volunteerError}<p class="error" role="alert">{form.volunteerError}</p>{/if}
			<form method="POST" action="?/addVolunteer" use:enhance>
				<div class="grid-2">
					<div class="form-group"><label for="v_first">First name</label><input id="v_first" name="firstName" type="text" autocomplete="given-name" required /></div>
					<div class="form-group"><label for="v_last">Last name</label><input id="v_last" name="lastName" type="text" autocomplete="family-name" required /></div>
				</div>
				<div class="form-group"><label for="v_email">Email</label><input id="v_email" name="email" type="email" autocomplete="email" required /></div>
				<div class="form-group">
					<label for="v_pass">Temporary password</label>
					<input id="v_pass" name="password" type="text" minlength="4" required aria-describedby="v_pass_help" />
					<small id="v_pass_help" style="color:var(--text-light);font-size:0.8rem;">Share this with the volunteer; they can change it later.</small>
				</div>
				<button type="submit" class="btn btn-primary" style="width:100%;">Create volunteer</button>
			</form>
		</div>

		<!-- add child -->
		<div class="card">
			<h3 style="margin-bottom:8px;">Add Child</h3>
			<p style="color:var(--text-light);font-size:0.85rem;margin-bottom:12px;">Optionally link them to a volunteer right away.</p>
			{#if form?.childSuccess}<div class="alert alert-success" role="status">{form.childSuccess}</div>{/if}
			{#if form?.childError}<p class="error" role="alert">{form.childError}</p>{/if}
			<form method="POST" action="?/addChild" use:enhance>
				<div class="grid-2">
					<div class="form-group"><label for="c_first">First name</label><input id="c_first" name="firstName" type="text" required /></div>
					<div class="form-group"><label for="c_last">Last name</label><input id="c_last" name="lastName" type="text" required /></div>
				</div>
				<div class="grid-2">
					<div class="form-group">
						<label for="c_status">Status</label>
						<select id="c_status" name="status">
							<option value="full_member">Full member</option>
							<option value="tryout">Tryout</option>
						</select>
					</div>
					<div class="form-group">
						<label for="c_level">Level (optional)</label>
						<select id="c_level" name="level">
							<option value="">— Select level —</option>
							{#each swimLevels as lvl}
								<option value={lvl.value}>{lvl.name}</option>
							{/each}
						</select>
						<button type="button" style="background:none;border:none;color:var(--primary);cursor:pointer;font-size:0.8rem;padding:4px 0;text-align:left;box-shadow:none;min-height:auto;" onclick={() => showAddChildLevelDetails = !showAddChildLevelDetails}>
							{showAddChildLevelDetails ? 'Hide level details' : 'More level details'}
						</button>
						{#if showAddChildLevelDetails}
							<div style="margin-top:8px;font-size:0.8rem;color:var(--text-light);max-height:240px;overflow-y:auto;">
								{#each swimLevels as lvl}
									<p style="margin-bottom:8px;"><strong>{lvl.name}</strong> — {lvl.description}</p>
								{/each}
							</div>
						{/if}
					</div>
				</div>
				<div class="form-group">
					<label for="c_link">Link to volunteer (optional)</label>
					<select id="c_link" name="linkUserId">
						<option value="">— none —</option>
						{#each data.volunteers as v}
							<option value={v.id}>{v.firstName} {v.lastName}</option>
						{/each}
					</select>
				</div>
				<button type="submit" class="btn btn-primary" style="width:100%;">Add child</button>
			</form>
		</div>
	</div>

	<!-- children + their links -->
	<div class="card" style="margin-top:16px;">
		<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
			<h3 style="margin:0;">Children &amp; Volunteer Links ({data.children.length})</h3>
			<input
				type="search"
				placeholder="Search children..."
				bind:value={childSearch}
				aria-label="Search children"
				style="max-width:260px;"
			/>
		</div>
		{#if form?.linkError}<p class="error" role="alert">{form.linkError}</p>{/if}
		{#if data.children.length === 0}
			<p style="color:var(--text-light);">No children added yet.</p>
		{:else if filteredChildren.length === 0}
			<p style="color:var(--text-light);">No children match "{childSearch}".</p>
		{:else}
			<ul class="link-list">
				{#each filteredChildren as child (child.id)}
					<li class="link-row">
						<div class="link-row-head">
							<div>
								<strong>{child.firstName} {child.lastName}</strong>
								<span class="pill {child.status === 'tryout' ? 'pill-accent' : 'pill-primary'}">{child.status === 'tryout' ? 'Tryout' : 'Member'}</span>
								{#if child.level}<span style="color:var(--text-light);font-size:0.8rem;margin-left:6px;">· {child.level}</span>{/if}
							</div>
							<form method="POST" action="?/deleteChild" use:enhance onsubmit={(e) => { if (!confirm(`Remove ${child.firstName} ${child.lastName}? This will also remove their volunteer links.`)) e.preventDefault(); }}>
								<input type="hidden" name="childId" value={child.id} />
								<button type="submit" class="btn btn-danger btn-sm" aria-label="Remove {child.firstName} {child.lastName}">Remove</button>
							</form>
						</div>
						<div class="link-row-body">
							{#if child.volunteerIds.length === 0}
								<span style="color:var(--text-light);font-size:0.85rem;">No volunteers linked yet.</span>
							{:else}
								<div class="chips">
									{#each child.volunteerIds as vid}
										<span class="chip">
											{volunteerName(vid)}
											<form method="POST" action="?/unlinkChild" use:enhance style="display:inline;">
												<input type="hidden" name="childId" value={child.id} />
												<input type="hidden" name="userId" value={vid} />
												<button type="submit" class="chip-x" aria-label="Unlink {volunteerName(vid)}">×</button>
											</form>
										</span>
									{/each}
								</div>
							{/if}
							<form method="POST" action="?/linkChild" use:enhance class="link-add">
								<input type="hidden" name="childId" value={child.id} />
								<select name="userId" bind:value={linkPick[child.id]} aria-label="Select volunteer to link">
									<option value="">+ Link volunteer...</option>
									{#each data.volunteers.filter((v) => !child.volunteerIds.includes(v.id)) as v}
										<option value={v.id}>{v.firstName} {v.lastName}</option>
									{/each}
								</select>
								<button type="submit" class="btn btn-accent btn-sm" disabled={!linkPick[child.id]}>Link</button>
							</form>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<div class="grid-2">
	<!-- activity types -->
	<div>
		<h2>Activity Types</h2>
		<div class="card" style="margin-top:12px;">
			{#if form?.activityError}<p class="error" style="margin-bottom:8px;">{form.activityError}</p>{/if}
			<form method="POST" action="?/addActivity" use:enhance style="display:flex;gap:8px;margin-bottom:16px;">
				<input name="name" type="text" placeholder="New activity name..." required style="flex:1;" />
				<button type="submit" class="btn btn-accent">Add</button>
			</form>
			{#each data.activities as activity}
				<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
					<span style={activity.active ? '' : 'text-decoration:line-through;color:var(--text-light);'}>{activity.name}</span>
					<form method="POST" action="?/toggleActivity" use:enhance>
						<input type="hidden" name="id" value={activity.id} />
						<input type="hidden" name="active" value={String(activity.active)} />
						<button type="submit" class="btn {activity.active ? 'btn-outline' : 'btn-accent'}" style="padding:4px 10px;font-size:0.8rem;">{activity.active ? 'Disable' : 'Enable'}</button>
					</form>
				</div>
			{/each}
		</div>

	</div>

	<!-- manual entry -->
	<div>
		<h2>Manual Entry</h2>
		<div class="card" style="margin-top:12px;">
			{#if form?.manualSuccess}
				<div style="background:#d4edda;padding:8px 12px;border-radius:6px;margin-bottom:12px;"><p style="color:#155724;font-size:0.9rem;">Entry added successfully.</p></div>
			{/if}
			{#if form?.manualError}<p class="error" style="margin-bottom:8px;">{form.manualError}</p>{/if}
			<form method="POST" action="?/addManualHours" use:enhance>
				<div class="form-group">
					<label for="userId">Volunteer</label>
					<select id="userId" name="userId" required>
						<option value="">-- Select volunteer --</option>
						{#each data.volunteers as p}<option value={p.id}>{p.firstName} {p.lastName} ({p.email})</option>{/each}
					</select>
				</div>
				<fieldset class="form-group" style="border:none;padding:0;margin-bottom:16px;">
					<legend style="font-weight:600;font-size:0.9rem;margin-bottom:6px;color:var(--text);">Type</legend>
					<div style="display:flex;gap:8px;" role="radiogroup" aria-label="Entry type">
						<button type="button" role="radio" aria-checked={manualType === 'volunteering'} class="btn {manualType === 'volunteering' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => manualType = 'volunteering'}>Hours</button>
						<button type="button" role="radio" aria-checked={manualType === 'donation'} class="btn {manualType === 'donation' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => manualType = 'donation'}>Donation ($)</button>
					</div>
					<input type="hidden" name="type" value={manualType} />
				</fieldset>
				<div class="form-group"><label for="date">Date</label><input id="date" name="date" type="date" required value={new Date().toISOString().split('T')[0]} /></div>
				<div class="form-group"><label for="value">{manualType === 'donation' ? 'Amount ($)' : 'Hours'}</label><input id="value" name="value" type="number" step="0.5" min="0.5" required /></div>
				<div class="form-group"><label for="notes">Notes (optional)</label><input id="notes" name="notes" type="text" /></div>
				<button type="submit" class="btn btn-primary" style="width:100%;">Add Entry</button>
			</form>
		</div>
	</div>
</div>

<div style="margin-top:32px;">
	<div class="grid-2">
		<!-- announcements -->
		<div>
			<h2>Announcements</h2>
			<div class="card" style="margin-top:12px;">
				{#if form?.announcementError}<p class="error" style="margin-bottom:8px;">{form.announcementError}</p>{/if}
				<form method="POST" action="?/addAnnouncement" use:enhance style="margin-bottom:16px;">
					<div class="form-group"><label for="announcementTitle">Title</label><input id="announcementTitle" name="title" type="text" required /></div>
					<div class="form-group"><label for="announcementContent">Content</label><textarea id="announcementContent" name="content" rows="3" required></textarea></div>
					<button type="submit" class="btn btn-accent">Post Announcement</button>
				</form>
				{#each data.announcements as a}
					<div style="display:flex;justify-content:space-between;align-items:start;padding:8px 0;border-bottom:1px solid var(--border);">
						<div><strong>{a.title}</strong><p style="font-size:0.85rem;color:var(--text-light);">{new Date(a.createdAt).toLocaleDateString()}</p></div>
						<form method="POST" action="?/deleteAnnouncement" use:enhance><input type="hidden" name="id" value={a.id} /><button type="submit" class="btn btn-danger" style="padding:4px 10px;font-size:0.8rem;">Delete</button></form>
					</div>
				{/each}
			</div>
		</div>

		<!-- export + archive -->
		<div>
			<h2>Export & Archive</h2>
			<div class="card" style="margin-top:12px;">
				<a href="/organizer/manage/emailing" class="btn btn-accent" style="display:block;text-align:center;margin-bottom:16px;">Manage Emailing</a>
				<a href="/api/export" class="btn btn-primary" style="display:block;text-align:center;margin-bottom:16px;">Export All Data as CSV</a>
				<hr style="border:none;border-top:1px solid var(--border);margin:16px 0;" />
				<h3>Archive Season</h3>
				<p style="font-size:0.85rem;color:var(--text-light);margin-bottom:12px;">Saves a snapshot and resets all hours to 0.</p>
				{#if form?.archiveSuccess}
					<div style="background:#d4edda;padding:8px 12px;border-radius:6px;margin-bottom:12px;"><p style="color:#155724;font-size:0.9rem;">Season archived and hours reset.</p></div>
				{/if}
				{#if form?.archiveError}<p class="error" style="margin-bottom:8px;">{form.archiveError}</p>{/if}
				<form method="POST" action="?/archiveSeason" use:enhance onsubmit={(e) => { if (!confirm('Archive all data and reset hours to 0?')) e.preventDefault(); }}>
					<div class="form-group"><label for="archiveLabel">Season Label</label><input id="archiveLabel" name="label" type="text" placeholder="e.g. 2025-2026" required /></div>
					<button type="submit" class="btn btn-danger" style="width:100%;">Archive & Reset</button>
				</form>
				{#if data.archives.length > 0}
					<h4 style="margin-top:16px;">Past Archives</h4>
					{#each data.archives as archive}
						<div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;">
							<span>{archive.label}</span>
							<span style="font-size:0.85rem;color:var(--text-light);">{new Date(archive.archivedAt).toLocaleDateString()}</span>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.alert {
		padding: 8px 12px;
		border-radius: 10px;
		margin-bottom: 12px;
		font-size: 0.9rem;
	}
	.alert-success {
		background: #DDF1E1;
		color: #1F5A3A;
		border: 1px solid #B8E0C2;
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
	.pill-primary { background: rgba(88,164,176,0.18); color: #2E6770; }
	.pill-accent { background: rgba(218,164,154,0.25); color: #8A4F45; }
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
		background: rgba(88,164,176,0.14);
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
	.chip-x:hover { background: rgba(88,164,176,0.25); transform: none; box-shadow: none; }
	.link-add {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
	}
	.link-add select { max-width: 220px; padding: 8px 12px; font-size: 0.9rem; }

	@media (max-width: 600px) {
		.link-row-head, .link-row-body { flex-direction: column; align-items: stretch; }
		.link-add select { max-width: 100%; flex: 1; }
		.link-add { width: 100%; }
	}
</style>
