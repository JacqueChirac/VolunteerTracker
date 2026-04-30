<!-- organizer layout — green admin nav bar -->
<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { Calendar, Users, Settings, LogOut, Menu, X } from 'lucide-svelte';

	let { children } = $props();
	let menuOpen = $state(false);

	function isActive(path: string) {
		return page.url.pathname === path || page.url.pathname.startsWith(path + '/');
	}

	function closeMenu() { menuOpen = false; }
</script>

<a class="skip-link" href="#main-content">Skip to main content</a>

<nav class="nav" aria-label="Admin">
	<a href="/organizer" class="brand">Volunteer Tracker</a>
	<button class="hamburger" onclick={() => menuOpen = !menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="admin-nav-links">
		{#if menuOpen}<X size={20} />{:else}<Menu size={20} />{/if}
	</button>
	<div id="admin-nav-links" class="nav-links" class:open={menuOpen}>
		<a href="/organizer" class:active={page.url.pathname === '/organizer'} onclick={closeMenu}><Calendar size={16} />Events</a>
		<a href="/organizer/volunteers" class:active={isActive('/organizer/volunteers')} onclick={closeMenu}><Users size={16} />Volunteers</a>
		<a href="/organizer/manage" class:active={isActive('/organizer/manage')} onclick={closeMenu}><Settings size={16} />Manage</a>
		<form method="POST" action="/logout" use:enhance class="nav-logout">
			<button type="submit" class="nav-logout-btn"><LogOut size={16} />Logout</button>
		</form>
	</div>
</nav>

<main id="main-content" class="container" style="padding-top:20px;padding-bottom:40px;" tabindex="-1">
	{@render children()}
</main>

<style>
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
	@media (max-width: 768px) {
		.nav-logout { width: 100%; }
		.nav-logout-btn { width: 100%; justify-content: flex-start; padding: 0 14px; }
	}
</style>
