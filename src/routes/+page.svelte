<!-- landing page — shows login buttons or a dashboard link -->
<script lang="ts">
	import type { PageData } from './$types';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';

	let { data }: { data: PageData } = $props();
</script>

<div class="landing">
	<div class="landing-content">
		<button onclick={() => lang.update(l => l === 'en' ? 'fr' : 'en')} class="lang-btn">
			{$lang === 'en' ? 'FR' : 'EN'}
		</button>
		<img src="/CPWD.png" alt="CPWD Swim Team" class="team-logo" />
		<h1>{t[$lang].appTitle}</h1>
		<p>{t[$lang].appSubtitle}</p>
		<p class="subtitle">{t[$lang].appCta}</p>

		{#if data.user}
			<div class="logged-in">
				<p>{t[$lang].welcomeBack(data.user.firstName)}</p>
				{#if data.user.role === 'volunteer'}
					<a href="/volunteer" class="btn btn-primary">{t[$lang].goToDashboard}</a>
				{:else}
					<a href="/organizer" class="btn btn-primary">{t[$lang].goToDashboard}</a>
				{/if}
			</div>
		{:else}
			<div class="login-options">
				<a href="/login?role=volunteer" class="btn btn-primary login-card">
					<span class="login-icon"></span>
					<span class="login-label">{t[$lang].volunteerLogin}</span>
				</a>
				<a href="/login?role=organizer" class="btn btn-accent login-card">
					<span class="login-icon"></span>
					<span class="login-label">{t[$lang].organizerLogin}</span>
				</a>
			</div>
			<p class="register-link">{t[$lang].newVolunteer} <a href="/register">{t[$lang].createAccount}</a></p>
		{/if}
	</div>
</div>

<style>
	.landing { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a5276 0%, #2980b9 100%); color: white; text-align: center; padding: 20px; }
	.landing-content { max-width: 520px; position: relative; }
	.team-logo { width: 200px; margin-bottom: 20px; }
	h1 { font-size: 2.2rem; margin-bottom: 12px; }
	p { font-size: 1.1rem; opacity: 0.9; }
	.subtitle { font-size: 0.95rem; opacity: 0.7; margin-bottom: 36px; }
	.login-options { display: flex; gap: 20px; justify-content: center; margin-bottom: 24px; flex-wrap: wrap; }
	.login-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 40px; border-radius: 12px; font-size: 1rem; text-decoration: none; transition: transform 0.2s; }
	.login-card:hover { transform: translateY(-2px); text-decoration: none; }
	.login-icon { font-size: 2rem; }
	.login-label { font-weight: 600; }
	.register-link { font-size: 0.9rem; opacity: 0.8; }
	.register-link a { color: white; text-decoration: underline; }
	.logged-in { margin-top: 24px; }
	.logged-in p { margin-bottom: 16px; font-size: 1.2rem; }
	.logged-in .btn { background: white; color: #1a5276; }
	.lang-btn {
		position: absolute;
		top: 0;
		right: 0;
		background: rgba(255,255,255,0.2);
		color: white;
		border: 1px solid rgba(255,255,255,0.4);
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow: none;
		min-height: auto;
		transition: background 0.2s;
	}
	.lang-btn:hover { background: rgba(255,255,255,0.35); transform: none; box-shadow: none; }
</style>
