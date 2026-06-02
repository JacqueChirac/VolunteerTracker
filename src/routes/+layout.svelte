<!-- root layout — wraps every page in the app -->
<script lang="ts">
	import '../app.css';
	import { lang } from '$lib/stores/lang';

	let { children } = $props();
</script>

<svelte:head>
	<title>Volunteer Tracker</title>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

{@render children()}

<footer class="site-footer">
	<p>
		{$lang === 'en'
			? 'For maintenance or technical issues, contact'
			: 'Pour la maintenance ou les problèmes techniques, contactez'}
		<a href="mailto:rliu16@ocdsb.ca">rliu16@ocdsb.ca</a>
	</p>
</footer>

<style>
	.site-footer {
		text-align: center;
		padding: 16px 20px;
		font-size: 0.8rem;
		color: var(--text-light, #6c7a89);
		border-top: 1px solid var(--border, #e3e8ee);
		background: var(--surface, #ffffff);
	}
	.site-footer p { margin: 0; }
	.site-footer a {
		color: inherit;
		text-decoration: underline;
		font-weight: 600;
	}
	.site-footer a:hover { color: var(--primary, #58A4B0); }
</style>
