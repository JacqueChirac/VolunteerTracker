<!-- organizer layout — wraps all /organizer/* pages -->
<!-- shows the green admin nav bar and redirects non-organizers to the login page -->
<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { store } from '$lib/store.svelte';

	let { children } = $props();
	let menuOpen = $state(false); // mobile hamburger menu toggle

	// if you're not logged in as an organizer, kick back to login
	$effect(() => {
		const user = store.currentUser;
		if (!user || user.role !== 'organizer') {
			goto('/login?role=organizer');
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

{#if store.currentUser && store.currentUser.role === 'organizer'}
	<!-- green nav bar to visually distinguish from the volunteer (blue) nav -->
	<nav class="nav" style="background:#27ae60;">
		<a href="/organizer" class="brand">Volunteer Tracker (Admin)</a>
		<button class="hamburger" onclick={() => (menuOpen = !menuOpen)} aria-label="Menu">
			{menuOpen ? '\u2715' : '\u2630'}
		</button>
		<div class="nav-links" class:open={menuOpen}>
			<a
				href="/organizer"
				class:active={page.url.pathname === '/organizer'}
				onclick={closeMenu}>Events</a
			>
			<a
				href="/organizer/volunteers"
				class:active={isActive('/organizer/volunteers')}
				onclick={closeMenu}>Volunteers</a
			>
			<a
				href="/organizer/manage"
				class:active={isActive('/organizer/manage')}
				onclick={closeMenu}>Manage</a
			>
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
