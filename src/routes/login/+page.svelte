<!-- login page -->
<!-- reads ?role=organizer or ?role=volunteer from the URL to show the right heading -->
<!-- on submit, checks credentials against the store and redirects to the right dashboard -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { store } from '$lib/store.svelte';

	// form fields — $state makes them reactive (Svelte re-renders when they change)
	let username = $state('');
	let password = $state('');
	let error = $state<string | null>(null);

	// figure out which role they're logging in as from the URL (?role=organizer)
	const rawRole = $derived(page.url.searchParams.get('role') || 'volunteer');
	const role = $derived(rawRole === 'organizer' ? 'organizer' : 'volunteer');

	function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;

		if (!username || !password) {
			error = 'Username and password are required.';
			return;
		}

		// try to log in — store.login returns the user if credentials match, null if not
		const user = store.login(username.trim(), password);
		if (!user) {
			error = 'Invalid username or password.';
			return;
		}

		// send them to the right dashboard
		goto(user.role === 'volunteer' ? '/volunteer' : '/organizer');
	}
</script>

<div class="login-page">
	<div class="login-box card">
		<h2>{role === 'organizer' ? 'Organizer' : 'Volunteer'} Login</h2>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<form onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="username">Username</label>
				<input id="username" name="username" type="text" bind:value={username} required />
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input id="password" name="password" type="password" bind:value={password} required />
			</div>
			<button type="submit" class="btn btn-primary" style="width:100%">Login</button>
		</form>

		<div class="links">
			{#if role === 'volunteer'}
				<a href="/register">Create an account</a>
			{/if}
			<a href="/">Back to home</a>
		</div>

		<!-- show the demo credentials so testers know what to type -->
		<p class="hint">
			{#if role === 'organizer'}
				Demo: <strong>admin / admin123</strong>
			{:else}
				Demo: <strong>raymond / password</strong>
			{/if}
		</p>
	</div>
</div>

<style>
	.login-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #1a5276 0%, #2980b9 100%);
		padding: 20px;
	}

	.login-box {
		width: 100%;
		max-width: 400px;
	}

	h2 {
		margin-bottom: 20px;
		text-align: center;
	}

	.links {
		margin-top: 16px;
		text-align: center;
		display: flex;
		justify-content: center;
		gap: 16px;
		font-size: 0.9rem;
	}

	.hint {
		margin-top: 12px;
		text-align: center;
		font-size: 0.8rem;
		color: var(--text-light);
	}
</style>
