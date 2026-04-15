<!-- registration page — server-side form -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="register-page">
	<div class="register-box card">
		<h2>Create Volunteer Account</h2>

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}

		<form method="POST" use:enhance>
			<div class="form-group">
				<label for="firstName">First Name</label>
				<input id="firstName" name="firstName" type="text" value={form?.firstName ?? ''} required />
			</div>
			<div class="form-group">
				<label for="lastName">Last Name</label>
				<input id="lastName" name="lastName" type="text" value={form?.lastName ?? ''} required />
			</div>
			<div class="form-group">
				<label for="username">Username</label>
				<input id="username" name="username" type="text" value={form?.username ?? ''} required />
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input id="password" name="password" type="password" required />
			</div>
			<div class="form-group">
				<label for="confirmPassword">Confirm Password</label>
				<input id="confirmPassword" name="confirmPassword" type="password" required />
			</div>
			<button type="submit" class="btn btn-primary" style="width:100%">Create Account</button>
		</form>

		<div class="links">
			<a href="/login?role=volunteer">Already have an account? Login</a>
			<a href="/">Back to home</a>
		</div>
	</div>
</div>

<style>
	.register-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a5276 0%, #2980b9 100%); padding: 20px; }
	.register-box { width: 100%; max-width: 400px; }
	h2 { margin-bottom: 20px; text-align: center; }
	.links { margin-top: 16px; text-align: center; display: flex; flex-direction: column; gap: 8px; font-size: 0.9rem; }
</style>
