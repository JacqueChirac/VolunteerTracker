<!-- volunteer layout — wraps all /volunteer/* pages -->
<!-- shows the blue nav bar and redirects non-volunteers to the login page -->
<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { store } from '$lib/store.svelte';

	let { children } = $props();
	let menuOpen = $state(false); // mobile hamburger menu toggle

	// if you're not logged in as a volunteer, kick back to login
	$effect(() => {
		const user = store.currentUser;
		if (!user || user.role !== 'volunteer') {
			goto('/login?role=volunteer');
		}
	});

	// highlights the current nav link
	function isActive(path: string) {
		return page.url.pathname === path || page.url.pathname.startsWith(path + '/');
	}

	function closeMenu() {
		menuOpen = false;
	}

	function handleLogout() {
		store.logout();
		goto('/');
	}
</script>

{#if store.currentUser && store.currentUser.role === 'volunteer'}
	<nav class="nav">
		<a href="/volunteer" class="brand">Volunteer Tracker</a>
		<button class="hamburger" onclick={() => (menuOpen = !menuOpen)} aria-label="Menu">
			{menuOpen ? '\u2715' : '\u2630'}
		</button>
		<div class="nav-links" class:open={menuOpen}>
			<a href="/volunteer" class:active={page.url.pathname === '/volunteer'} onclick={closeMenu}>Home</a>
			<a href="/volunteer/events" class:active={isActive('/volunteer/events')} onclick={closeMenu}>Events</a>
			<a href="/volunteer/log" class:active={isActive('/volunteer/log')} onclick={closeMenu}>Log</a>
			<a href="/volunteer/account" class:active={isActive('/volunteer/account')} onclick={closeMenu}>Account</a>
			<a href="/volunteer/tutorial" class:active={isActive('/volunteer/tutorial')} onclick={closeMenu}>Tutorial</a>
			<button
				type="button"
				onclick={handleLogout}
				style="background:none;color:rgba(255,255,255,0.8);padding:12px 0;font-size:0.9rem;font-weight:500;text-align:left;"
				>Logout</button
			>
		</div>
	</nav>

	<main class="container" style="padding-top:20px;padding-bottom:40px;">
		{@render children()}
	</main>
{/if}
