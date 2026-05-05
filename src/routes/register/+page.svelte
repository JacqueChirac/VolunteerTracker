<!-- registration page — server-side form -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';

	let { form }: { form: ActionData } = $props();
</script>

<div class="register-page">
	<div class="register-box card">
		<div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
			<button onclick={() => lang.update(l => l === 'en' ? 'fr' : 'en')} class="lang-btn">
				{$lang === 'en' ? 'FR' : 'EN'}
			</button>
		</div>
		<h2>{t[$lang].createVolunteerAccount}</h2>

		{#if form?.error}
			<p class="error" role="alert" aria-live="assertive">{form.error}</p>
		{/if}

		<form method="POST" use:enhance>
			<div class="form-group">
				<label for="firstName">{t[$lang].firstName}</label>
				<input id="firstName" name="firstName" type="text" value={form?.firstName ?? ''} required />
			</div>
			<div class="form-group">
				<label for="lastName">{t[$lang].lastName}</label>
				<input id="lastName" name="lastName" type="text" value={form?.lastName ?? ''} required />
			</div>
			<div class="form-group">
				<label for="email">{t[$lang].email}</label>
				<input id="email" name="email" type="email" value={form?.email ?? ''} required />
			</div>
			<div class="form-group">
				<label for="password">{t[$lang].password}</label>
				<input id="password" name="password" type="password" required />
			</div>
			<div class="form-group">
				<label for="confirmPassword">{t[$lang].confirmPassword}</label>
				<input id="confirmPassword" name="confirmPassword" type="password" required />
			</div>
			<button type="submit" class="btn btn-primary" style="width:100%">{t[$lang].createAccountBtn}</button>
		</form>

		<div class="links">
			<a href="/login?role=volunteer">{t[$lang].alreadyHaveAccount}</a>
			<a href="/">{t[$lang].backToHome}</a>
		</div>
	</div>
</div>

<style>
	.register-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #373F51 0%, #58A4B0 50%, #A9BCD0 100%); padding: 20px; }
	.register-box { width: 100%; max-width: 400px; }
	h2 { margin-bottom: 20px; text-align: center; }
	.links { margin-top: 16px; text-align: center; display: flex; flex-direction: column; gap: 8px; font-size: 0.9rem; }
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
</style>
