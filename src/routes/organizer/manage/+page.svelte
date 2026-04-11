<script lang="ts">
	import { store } from '$lib/store.svelte';

	// Local editable copies of settings, keyed by setting key. Synced from store
	// whenever the store changes and this key hasn't been touched locally yet.
	let settingInputs = $state<Record<string, string>>({});
	let settingsSuccess = $state(false);

	$effect(() => {
		for (const s of store.siteSettings) {
			if (!(s.key in settingInputs)) settingInputs[s.key] = s.value;
		}
	});

	function handleSaveSettings(e: Event) {
		e.preventDefault();
		for (const [key, value] of Object.entries(settingInputs)) {
			store.updateSetting(key, value.trim());
		}
		settingsSuccess = true;
		setTimeout(() => (settingsSuccess = false), 2500);
	}

	function handleResetData() {
		if (!confirm('Reset ALL local data and reseed? This wipes your paper prototype state.'))
			return;
		store.resetAll();
	}
</script>

<h1>Manage</h1>
<p style="color:var(--text-light);margin-bottom:24px;">Site settings and data reset.</p>

<h2>Settings</h2>
<div class="card" style="margin-top:12px;">
	{#if settingsSuccess}
		<div style="background:#d4edda;padding:8px 12px;border-radius:6px;margin-bottom:12px;">
			<p style="color:#155724;font-size:0.9rem;">Settings updated.</p>
		</div>
	{/if}
	<form onsubmit={handleSaveSettings}>
		<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:end;">
			{#each store.siteSettings as setting (setting.key)}
				<div class="form-group" style="flex:1;min-width:200px;">
					<label for="setting_{setting.key}">{setting.label}</label>
					<input
						id="setting_{setting.key}"
						type="number"
						step="any"
						min="0"
						bind:value={settingInputs[setting.key]}
						required
					/>
				</div>
			{/each}
			<div class="form-group">
				<button type="submit" class="btn btn-primary">Save Settings</button>
			</div>
		</div>
	</form>
</div>

<h2 style="margin-top:32px;">Reset Demo Data</h2>
<div class="card" style="margin-top:12px;max-width:520px;">
	<p style="font-size:0.9rem;color:var(--text-light);margin-bottom:12px;">
		Clears localStorage and reseeds the demo accounts and events. Signs you out.
	</p>
	<button type="button" class="btn btn-outline" onclick={handleResetData}>
		Reset All Local Data
	</button>
</div>
