<!-- volunteer layout — blue nav bar -->
<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { House, Calendar, ClipboardList, User, BookOpen, LogOut, Menu, X } from 'lucide-svelte';

	let { children } = $props();
	let menuOpen = $state(false);

	function isActive(path: string) {
		return page.url.pathname === path || page.url.pathname.startsWith(path + '/');
	}
	function closeMenu() { menuOpen = false; }
</script>

<a class="skip-link" href="#main-content">Skip to main content</a>

<nav class="nav" aria-label="Volunteer">
	<a href="/volunteer" class="brand">
		<img src="/CPWD.png" alt="CPWD" class="brand-logo" />
		Volunteer Tracker
	</a>
	<button class="hamburger" onclick={() => menuOpen = !menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="volunteer-nav-links">
		{#if menuOpen}<X size={20} />{:else}<Menu size={20} />{/if}
	</button>
	<div id="volunteer-nav-links" class="nav-links" class:open={menuOpen}>
		<a href="/volunteer" class:active={page.url.pathname === '/volunteer'} onclick={closeMenu}><House size={16} />Home</a>
		<a href="/volunteer/events" class:active={isActive('/volunteer/events')} onclick={closeMenu}><Calendar size={16} />Events</a>
		<a href="/volunteer/log" class:active={isActive('/volunteer/log')} onclick={closeMenu}><ClipboardList size={16} />Log</a>
		<a href="/volunteer/account" class:active={isActive('/volunteer/account')} onclick={closeMenu}><User size={16} />Account</a>
		<a href="/volunteer/tutorial" class:active={isActive('/volunteer/tutorial')} onclick={closeMenu}><BookOpen size={16} />Tutorial</a>
		<form method="POST" action="/logout" use:enhance style="display:inline">
			<button type="submit" style="background:none;color:rgba(255,255,255,0.8);padding:12px 0;font-size:0.9rem;font-weight:500;width:100%;text-align:left;display:flex;align-items:center;gap:6px;"><LogOut size={16} />Logout</button>
		</form>
	</div>
</nav>

<main id="main-content" class="container" style="padding-top:20px;padding-bottom:40px;" tabindex="-1">
	{@render children()}
</main>

<style>
	.brand-logo { height: 28px; vertical-align: middle; border-radius: 4px; }
</style>
