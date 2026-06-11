<script lang="ts">
	import { enhance, applyAction } from '$app/forms';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';

	let { form } = $props();
	let showPassword = $state(false);

	let toastMsg = $state('');
	let toastType = $state<'success' | 'error'>('success');
	let toastTimer: ReturnType<typeof setTimeout>;

	function showToast(msg: string, type: 'success' | 'error' = 'success') {
		clearTimeout(toastTimer);
		toastMsg = msg;
		toastType = type;
		toastTimer = setTimeout(() => {
			toastMsg = '';
		}, 4000);
	}
</script>

<div class="login-page">
	<div class="login-box card">
		<div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
			<button onclick={() => lang.update((l) => (l === 'en' ? 'fr' : 'en'))} class="lang-btn">
				{$lang === 'en' ? 'FR' : 'EN'}
			</button>
		</div>

		<h2 style="text-align: center; margin-bottom: 10px;">
			{$lang === 'en' ? 'Set New Password' : 'Nouveau mot de passe'}
		</h2>

		<form method="POST" action="?/reset" use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'failure') {
					showToast(String(result.data?.error || 'Error'), 'error');
				}
				await applyAction(result);
			};
		}}>
			<div class="form-group">
				<label for="password">{t[$lang].newPassword}</label>
				<div class="pw-wrap">
					<input 
						id="password" 
						name="password" 
						type={showPassword ? 'text' : 'password'} 
						required 
					/>
					<button type="button" class="pw-toggle" onclick={() => showPassword = !showPassword}>
						{showPassword ? ($lang === 'en' ? 'Hide' : 'Masquer') : ($lang === 'en' ? 'Show' : 'Afficher')}
					</button>
				</div>
			</div>

			<div class="form-group">
				<label for="confirmPassword">{t[$lang].confirmPassword}</label>
				<input 
					id="confirmPassword" 
					name="confirmPassword" 
					type={showPassword ? 'text' : 'password'} 
					required 
				/>
			</div>

			<p class="instruction">
				{$lang === 'en' ? 'Choose a strong password to secure your account.' : 'Choisissez un mot de passe robuste pour sécuriser votre compte.'}
			</p>

			<button type="submit" class="btn btn-primary" style="width:100%">
				{t[$lang].changePasswordBtn}
			</button>
		</form>

		<div class="links">
			<a href="/login/recovery">{$lang === 'en' ? 'Back to recovery' : 'Retour à la récupération'}</a>
		</div>
	</div>
</div>

{#if toastMsg}
	<div class="toast" class:toast-error={toastType === 'error'}>
		{toastMsg}
	</div>
{/if}

<style>
	.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #A9BCD0 0%, #58A4B0 50%, #373F51 100%); padding: 20px; }
	.login-box { width: 100%; max-width: 360px; }
	.instruction { font-size: 0.85rem; color: var(--text-light); margin: 8px 0 16px 0; line-height: 1.4; }
	.links { margin-top: 24px; text-align: center; font-size: 0.9rem; }
	.lang-btn { background: rgba(88,164,176,0.15); color: var(--text); border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
	.pw-wrap { position: relative; }
	.pw-wrap input { width: 100%; padding-right: 5rem; }
	.pw-toggle { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--primary); font-size: 0.8rem; font-weight: 600; cursor: pointer; padding: 2px 4px; box-shadow: none; min-height: auto; }
	.pw-toggle:hover { text-decoration: underline; transform: translateY(-50%); box-shadow: none; }
	.toast {
		position: fixed;
		bottom: 28px;
		left: 50%;
		transform: translateX(-50%);
		background: #1a7a4a;
		color: #fff;
		padding: 12px 24px;
		border-radius: 999px;
		font-size: 0.95rem;
		font-weight: 600;
		box-shadow: 0 4px 20px rgba(0,0,0,0.2);
		z-index: 9999;
		white-space: nowrap;
		animation: toast-in 0.2s ease;
	}
	.toast-error { background: #b91c1c; }
	@keyframes toast-in {
		from { opacity: 0; transform: translateX(-50%) translateY(12px); }
		to   { opacity: 1; transform: translateX(-50%) translateY(0); }
	}
</style>