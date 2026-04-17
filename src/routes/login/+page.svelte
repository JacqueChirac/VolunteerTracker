<!-- login page — uses SvelteKit form actions (server-side) -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { page } from '$app/state';

	let { form }: { form: ActionData } = $props();
	let role = $derived((page.url.searchParams.get('role') || 'volunteer') === 'organizer' ? 'organizer' : 'volunteer');
</script>

<div class="login-page">
	<div class="login-box card">
		<h2>{role === 'organizer' ? 'Organizer' : 'Volunteer'} Login</h2>

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}

		<form method="POST" use:enhance>
			<div class="form-group">
				<label for="email">Email</label>
				<input id="email" name="email" type="email" value={form?.email ?? ''} required />
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input id="password" name="password" type="password" required />
			</div>
			<button type="submit" class="btn btn-primary" style="width:100%">Login</button>
		</form>

		<div class="links">
			{#if role === 'volunteer'}
				<a href="/register">Create an account</a>
			{/if}
			<a href="/">Back to home</a>
		</div>
	</div>
</div>

<style>
	.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #77b8e0 0%, #2980b9 100%); padding: 20px; }
	.login-box { width: 100%; max-width: 400px; }
	h2 { margin-bottom: 20px; text-align: center; }
	.links { margin-top: 16px; text-align: center; display: flex; justify-content: center; gap: 16px; font-size: 0.9rem; }
</style>
