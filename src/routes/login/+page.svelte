<!-- login page — uses SvelteKit form actions (server-side) -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { dev } from '$app/environment';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';

  let { form }: { form: ActionData } = $props();
  let showPassword = $state(false);
</script>

<div class="login-page">
	<div class="login-box card">
		<div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
			<button onclick={() => lang.update(l => l === 'en' ? 'fr' : 'en')} class="lang-btn">
				{$lang === 'en' ? 'FR' : 'EN'}
			</button>
		</div>
		{#if form?.error}
			<p class="error" role="alert" aria-live="assertive">{form.error}</p>
		{/if}

		<form method="POST" action="?/login" use:enhance>
			<div class="form-group">
				<label for="email">{t[$lang].email}</label>
				<input id="email" name="email" type="email" value={form?.email ?? ''} required />
			</div>
			<div class="form-group">
				<label for="password">{t[$lang].password}</label>
				<div class="pw-wrap">
					<input id="password" name="password" type={showPassword ? 'text' : 'password'} required />
					<button type="button" class="pw-toggle" onclick={() => showPassword = !showPassword}>
						{showPassword ? ($lang === 'en' ? 'Hide' : 'Masquer') : ($lang === 'en' ? 'Show' : 'Afficher')}
					</button>
				</div>
			</div>
			<button type="submit" class="btn btn-primary" style="width:100%">{t[$lang].login}</button>
		</form>

		{#if dev}
			<div style="margin-top:24px;padding-top:16px;border-top:1px dashed #999;">
				<p style="font-size:0.8rem;color:var(--text-light);text-align:center;margin-bottom:8px;">
					Dev shortcuts (auto-removed in prod)
				</p>
				<form method="POST" action="?/devLogin" use:enhance>
					<input type="hidden" name="as" value="volunteer" />
					<button type="submit" class="btn btn-outline" style="width:100%;margin-bottom:6px;">
						Login as Volunteer (Raymond)
					</button>
				</form>
				<form method="POST" action="?/devLogin" use:enhance>
					<input type="hidden" name="as" value="organizer" />
					<button type="submit" class="btn btn-outline" style="width:100%;">
						Login as Admin
					</button>
				</form>
			</div>
		{/if}

		<div class="links">
			<a href="/">{t[$lang].backToHome}</a>
		</div>
	</div>
</div>

<style>
	.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #A9BCD0 0%, #58A4B0 50%, #373F51 100%); padding: 20px; }
	.login-box { width: 100%; max-width: 400px; }
	.links { margin-top: 16px; text-align: center; display: flex; justify-content: center; gap: 16px; font-size: 0.9rem; }
	.lang-btn {
		background: rgba(88,164,176,0.15);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow: none;
		min-height: auto;
		transition: background 0.2s;
	}
	.lang-btn:hover { background: rgba(88,164,176,0.3); transform: none; box-shadow: none; }
	.pw-wrap { position: relative; }
	.pw-wrap input { width: 100%; padding-right: 5rem; }
	.pw-toggle { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--primary); font-size: 0.8rem; font-weight: 600; cursor: pointer; padding: 2px 4px; box-shadow: none; min-height: auto; }
	.pw-toggle:hover { text-decoration: underline; transform: translateY(-50%); box-shadow: none; }
</style>
