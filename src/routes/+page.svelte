<!-- landing page — the first thing users see -->
<!-- shows login buttons if not logged in, or a "go to dashboard" link if they are -->
<script lang="ts">
	import { store } from '$lib/store.svelte';

	// reactively tracks the logged-in user (null if nobody is logged in)
	const user = $derived(store.currentUser);
</script>

<div class="landing">
	<div class="landing-content">
		<h1>Volunteer Tracker</h1>
		<p>Track volunteer hours, donations, and events for your organization.</p>
		<p class="subtitle">Click the appropriate login to get started.</p>

		{#if user}
			<!-- already logged in — just show a link to their dashboard -->
			<div class="logged-in">
				<p>Welcome back, {user.firstName}!</p>
				{#if user.role === 'volunteer'}
					<a href="/volunteer" class="btn btn-primary">Go to Dashboard</a>
				{:else}
					<a href="/organizer" class="btn btn-primary">Go to Dashboard</a>
				{/if}
			</div>
		{:else}
			<!-- not logged in — show the two login options -->
			<div class="login-options">
				<a href="/login?role=volunteer" class="btn btn-primary login-card">
					<span class="login-icon">👤</span>
					<span class="login-label">Volunteer Login</span>
				</a>
				<a href="/login?role=organizer" class="btn btn-accent login-card">
					<span class="login-icon">🔧</span>
					<span class="login-label">Organizer Login</span>
				</a>
			</div>
			<p class="register-link">New volunteer? <a href="/register">Create an account</a></p>
			<p class="demo-hint">
				Demo accounts: <strong>admin / admin123</strong> (organizer) &middot;
				<strong>raymond / password</strong> (volunteer)
			</p>
		{/if}
	</div>
</div>

<style>
	.landing {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #1a5276 0%, #2980b9 100%);
		color: white;
		text-align: center;
		padding: 20px;
	}

	.landing-content {
		max-width: 520px;
	}

	h1 {
		font-size: 2.2rem;
		margin-bottom: 12px;
	}

	p {
		font-size: 1.1rem;
		opacity: 0.9;
	}

	.subtitle {
		font-size: 0.95rem;
		opacity: 0.7;
		margin-bottom: 36px;
	}

	.login-options {
		display: flex;
		gap: 20px;
		justify-content: center;
		margin-bottom: 24px;
		flex-wrap: wrap;
	}

	.login-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 24px 40px;
		border-radius: 12px;
		font-size: 1rem;
		text-decoration: none;
		transition: transform 0.2s;
	}

	.login-card:hover {
		transform: translateY(-2px);
		text-decoration: none;
	}

	.login-icon {
		font-size: 2rem;
	}

	.login-label {
		font-weight: 600;
	}

	.register-link {
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.register-link a {
		color: white;
		text-decoration: underline;
	}

	.demo-hint {
		margin-top: 18px;
		font-size: 0.8rem;
		opacity: 0.7;
	}

	.logged-in {
		margin-top: 24px;
	}

	.logged-in p {
		margin-bottom: 16px;
		font-size: 1.2rem;
	}

	.logged-in .btn {
		background: white;
		color: #1a5276;
	}
</style>
