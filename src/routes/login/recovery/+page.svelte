<script lang="ts">
	import { enhance, applyAction } from '$app/forms';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';

	let { form } = $props();
	let email = $state('');
	let step = $state(1); // 1: Email entry, 2: Key entry
	let cooldown = $state(0);
	let timer: ReturnType<typeof setInterval>;

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

	function startCooldown() {
		cooldown = 60;
		clearInterval(timer);
		timer = setInterval(() => {
			if (cooldown > 0) cooldown--;
			else clearInterval(timer);
		}, 1000);
	}

	// Update step based on server response
	$effect(() => {
		if (form?.success && step === 1) {
			step = 2;
			startCooldown();
		}
	});
</script>

<div class="login-page">
	<div class="login-box card">
		<div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
			<button onclick={() => lang.update((l) => (l === 'en' ? 'fr' : 'en'))} class="lang-btn">
				{$lang === 'en' ? 'FR' : 'EN'}
			</button>
		</div>

		<h2 style="text-align: center; margin-bottom: 10px;">
			{$lang === 'en' ? 'Reset Password' : 'Réinitialiser le mot de passe'}
		</h2>

		<!-- Step 1: Send Key -->
		<form method="POST" action="?/sendKey" use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success') {
					showToast($lang === 'en' ? 'Code sent successfully' : 'Code envoyé avec succès', 'success');
				} else if (result.type === 'failure') {
					const message = typeof result.data?.message === 'string' ? result.data.message : 'Error';
					showToast(message, 'error');
				} else if (result.type === 'error') {
					showToast($lang === 'en' ? 'System error' : 'Erreur système', 'error');
				}
				await applyAction(result);
			};
		}}>
			<div class="form-group">
				<label for="email">{t[$lang].email}</label>
				<input 
					id="email" 
					name="email" 
					type="email" 
					bind:value={email} 
					disabled={step === 2} 
					placeholder="example@mail.com"
					required 
				/>
			</div>

			{#if step === 1}
				<p class="instruction">
					{$lang === 'en' ? 'Enter your email to receive a 6-digit reset code.' : 'Entrez votre courriel pour recevoir un code de réinitialisation.'}
				</p>
				<button type="submit" class="btn btn-primary" style="width:100%">
					{$lang === 'en' ? 'Send Code' : 'Envoyer le code'}
				</button>
			{/if}
		</form>

		<!-- Step 2: Verify Key -->
		{#if step === 2}
			<form method="POST" action="?/checkKey" use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						showToast($lang === 'en' ? 'Code verified' : 'Code vérifié', 'success');
					} else if (result.type === 'failure') {
						const message = typeof result.data?.message === 'string' ? result.data.message : ($lang === 'en' ? 'Invalid code' : 'Code invalide');
						showToast(message, 'error');
					}
					await applyAction(result);
				};
			}} style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);">
				<input type="hidden" name="email" value={email} />
				
				<div class="form-group">
					<label for="key">{$lang === 'en' ? 'Verification Code' : 'Code de vérification'}</label>
					<input id="key" name="key" type="number" maxlength="6" placeholder="123456" pattern="\d{6}" required />
				</div>

				<p class="instruction">
					{#if form?.message}
						<span class="error-inline">{form.message}</span>
					{:else}
						{$lang === 'en' ? 'Please check your inbox and enter the 6-digit code.' : 'Veuillez vérifier votre boîte de réception et entrer le code.'}
					{/if}
				</p>

				<button type="submit" class="btn btn-primary" style="width:100%">
					{$lang === 'en' ? 'Verify & Continue' : 'Vérifier et continuer'}
				</button>
			</form>

			<form method="POST" action="?/sendKey" use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						showToast($lang === 'en' ? 'Resent successfully' : 'Renvoyé avec succès', 'success');
					} else if (result.type === 'failure') {
						const message = typeof result.data?.message === 'string' ? result.data.message : 'Error';
						showToast(message, 'error');
					}
					await applyAction(result);
				};
			}} style="margin-top: 10px;">
				<input type="hidden" name="email" value={email} />
				<button type="submit" class="btn btn-outline" style="width:100%" disabled={cooldown > 0}>
					{cooldown > 0 ? ($lang === 'en' ? `Resend in ${cooldown}s` : `Renvoyer dans ${cooldown}s`) : ($lang === 'en' ? 'Resend Email' : 'Renvoyer le courriel')}
				</button>
			</form>
		{/if}

		<div class="links">
			<a href="/login">{t[$lang].backToHome}</a>
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
	.instruction { font-size: 0.85rem; color: var(--text-light); margin: -8px 0 16px 0; line-height: 1.4; }
	.error-inline { color: #b91c1c; font-weight: 500; }
	.links { margin-top: 24px; text-align: center; font-size: 0.9rem; }
	.lang-btn { background: rgba(88,164,176,0.15); color: var(--text); border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }

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
