<!-- organizer layout — green admin nav bar -->
<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { Calendar, Users, Settings, LogOut, Menu, X } from 'lucide-svelte';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';

	let { children } = $props();
	let menuOpen = $state(false);

	function isActive(path: string) {
		return page.url.pathname === path || page.url.pathname.startsWith(path + '/');
	}

	function closeMenu() { menuOpen = false; }
</script>

<a class="skip-link" href="#main-content">{t[$lang].skipToMain}</a>

<nav class="nav" aria-label="Admin">
	<a href="/organizer" class="brand">
		<img src="/CPWD.png" alt="CPWD" class="brand-logo" />
		{t[$lang].appTitle}
	</a>
	<button class="hamburger" onclick={() => menuOpen = !menuOpen} aria-label={menuOpen ? t[$lang].closeMenu : t[$lang].openMenu} aria-expanded={menuOpen} aria-controls="admin-nav-links">
		{#if menuOpen}<X size={20} />{:else}<Menu size={20} />{/if}
	</button>
	<div id="admin-nav-links" class="nav-links" class:open={menuOpen}>
		<a href="/organizer" class:active={page.url.pathname === '/organizer'} onclick={closeMenu}><Calendar size={16} />{t[$lang].events}</a>
		<a href="/organizer/volunteers" class:active={isActive('/organizer/volunteers')} onclick={closeMenu}><Users size={16} />{t[$lang].volunteers}</a>
		<a href="/organizer/manage" class:active={isActive('/organizer/manage')} onclick={closeMenu}><Settings size={16} />{t[$lang].manage}</a>
		<button onclick={() => lang.update(l => l === 'en' ? 'fr' : 'en')} class="lang-btn nav-lang-btn">
			{$lang === 'en' ? 'FR' : 'EN'}
		</button>
		<form method="POST" action="/logout" use:enhance class="nav-logout">
			<button type="submit" class="nav-logout-btn"><LogOut size={16} />{t[$lang].logout}</button>
		</form>
	</div>
</nav>

<main id="main-content" class="container" style="padding-top:20px;padding-bottom:40px;" tabindex="-1">
	{@render children()}
</main>

<style>
	.brand-logo { height: 28px; vertical-align: middle; border-radius: 4px; }
	.nav-logout {
		display: inline-flex;
		align-items: center;
		height: 100%;
	}
	.nav-logout-btn {
		background: transparent;
		color: rgba(255,255,255,0.85);
		padding: 0 16px;
		min-height: var(--touch);
		font-size: 0.9rem;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border-radius: 10px;
		box-shadow: none;
	}
	.nav-logout-btn:hover { background: rgba(255,255,255,0.14); transform: none; box-shadow: none; color: white; }
	.lang-btn {
		background: rgba(255,255,255,0.15);
		color: white;
		border: 1px solid rgba(255,255,255,0.3);
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow: none;
		min-height: auto;
		transition: background 0.2s;
	}
	.lang-btn:hover { background: rgba(255,255,255,0.3); transform: none; box-shadow: none; }
	.nav-lang-btn {
		display: inline-flex;
		align-items: center;
		align-self: center;
	}
	@media (max-width: 768px) {
		.nav-logout { width: 100%; }
		.nav-logout-btn { width: 100%; justify-content: flex-start; padding: 0 14px; }
		.nav-lang-btn { width: 100%; justify-content: flex-start; border-radius: 10px; padding: 0 14px; min-height: var(--touch); font-size: 0.9rem; background: transparent; border: none; }
		.nav-lang-btn:hover { background: rgba(255,255,255,0.14); }
	}
</style>
