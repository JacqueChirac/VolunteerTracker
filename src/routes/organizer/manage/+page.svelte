<!-- manage page — settings, activities, announcements, manual entry, export, archive -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let manualType = $state<'volunteering' | 'donation'>('volunteering');
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
				<div class="form-group">
					<label>Type</label>
					<div style="display:flex;gap:8px;">
						<button type="button" class="btn {manualType === 'volunteering' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => manualType = 'volunteering'}>Hours</button>
						<button type="button" class="btn {manualType === 'donation' ? 'btn-primary' : 'btn-outline'}" style="flex:1;text-align:center;" onclick={() => manualType = 'donation'}>Donation ($)</button>
					</div>
					<input type="hidden" name="type" value={manualType} />
				</div>
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
