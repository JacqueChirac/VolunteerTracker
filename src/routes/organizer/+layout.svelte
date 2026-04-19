<!-- organizer layout — green admin nav bar -->
<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';

	let { children } = $props();
	let menuOpen = $state(false);

	function isActive(path: string) {
		return page.url.pathname === path || page.url.pathname.startsWith(path + '/');
	}

	function closeMenu() { menuOpen = false; }
</script>

<nav class="nav" style="background:linear-gradient(135deg, #373F51, #4A5568);">
	<a href="/organizer" class="brand">Volunteer Tracker (Admin)</a>
	<button class="hamburger" onclick={() => menuOpen = !menuOpen} aria-label="Menu">
		{menuOpen ? '\u2715' : '\u2630'}
	</button>
	<div class="nav-links" class:open={menuOpen}>
		<a href="/organizer" class:active={page.url.pathname === '/organizer'} onclick={closeMenu}>Events</a>
		<a href="/organizer/volunteers" class:active={isActive('/organizer/volunteers')} onclick={closeMenu}>Volunteers</a>
		<a href="/organizer/manage" class:active={isActive('/organizer/manage')} onclick={closeMenu}>Manage</a>
		<form method="POST" action="/logout" use:enhance style="display:inline">
			<button type="submit" style="background:none;color:rgba(255,255,255,0.8);padding:12px 0;font-size:0.9rem;font-weight:500;width:100%;text-align:left;">Logout</button>
		</form>
	</div>
</nav>

<main class="container" style="padding-top:20px;padding-bottom:40px;">
	{@render children()}
</main>
