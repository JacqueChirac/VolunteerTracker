<!-- volunteer home — quick links + announcements -->
<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<h1>Welcome, {data.user?.firstName}!</h1>
<p style="color:var(--text-light);margin-bottom:24px;">Use the links below to get started.</p>

<div class="card" style="display:flex;flex-direction:column;gap:12px;max-width:420px;">
	<a href="/volunteer/events" class="btn btn-primary" style="text-align:center;">View Events</a>
	<a href="/volunteer/log" class="btn btn-accent" style="text-align:center;">Log Hours</a>
	<a href="/volunteer/account" class="btn btn-outline" style="text-align:center;">My Account & Children</a>
	<a href="/volunteer/tutorial" class="btn btn-outline" style="text-align:center;">How to Use This Site</a>
</div>

{#if data.announcements.length > 0}
	<h2 style="margin-top:32px;margin-bottom:12px;">Announcements</h2>
	{#each data.announcements as a}
		<div class="card" style="margin-bottom:12px;">
			<h3>{a.title}</h3>
			<p style="font-size:0.85rem;color:var(--text-light);margin-bottom:4px;">{new Date(a.createdAt).toLocaleDateString()}</p>
			<p>{a.content}</p>
		</div>
	{/each}
{/if}
