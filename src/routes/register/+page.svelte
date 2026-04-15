<!-- registration page — creates a new volunteer account -->
<!-- only volunteers can register here (organizers are created in the seed/admin) -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { store } from '$lib/store.svelte';

	// form fields
	let firstName = $state('');
	let lastName = $state('');
	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state<string | null>(null);

	function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;

		// basic validation
		if (!firstName || !lastName || !username || !password) {
			error = 'All fields are required.';
			return;
		}
		if (password.length < 4) {
			error = 'Password must be at least 4 characters.';
			return;
		}
		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}

		// try to register — will fail if username already taken
		const result = store.register({
			username: username.trim(),
			password,
			firstName: firstName.trim(),
			lastName: lastName.trim()
		});

		if (!result.ok) {
			error = result.error;
			return;
		}

		// auto-login and go to the volunteer dashboard
		goto('/volunteer');
	}
</script>

<div class="register-page">
	<div class="register-box card">
		<h2>Create Volunteer Account</h2>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<form onsubmit={handleSubmit}>
			<div class="form-group">
				<label for="firstName">First Name</label>
				<input id="firstName" type="text" bind:value={firstName} required />
			</div>
			<div class="form-group">
				<label for="lastName">Last Name</label>
				<input id="lastName" type="text" bind:value={lastName} required />
			</div>
			<div class="form-group">
				<label for="username">Username</label>
				<input id="username" type="text" bind:value={username} required />
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input id="password" type="password" bind:value={password} required />
			</div>
			<div class="form-group">
				<label for="confirmPassword">Confirm Password</label>
				<input id="confirmPassword" type="password" bind:value={confirmPassword} required />
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
	.register-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #1a5276 0%, #2980b9 100%);
		padding: 20px;
	}

	.register-box {
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
		flex-direction: column;
		gap: 8px;
		font-size: 0.9rem;
	}
</style>
