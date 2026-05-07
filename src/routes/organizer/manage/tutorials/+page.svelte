<!-- tutorial editor — organizer can edit tutorial content shown to volunteers -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<a href="/organizer/manage" style="font-size:0.9rem;">← Back to Manage</a>

<h1 style="margin-top:12px;">Edit Tutorial</h1>
<p style="color:var(--text-light);margin-bottom:24px;">
	Customize the tutorial shown to volunteers. Changes take effect immediately.
	<a href="/volunteer/tutorial" target="_blank" style="margin-left:8px;font-size:0.9rem;">Preview tutorial ↗</a>
</p>

{#if form?.success}
	<div style="background:#d4edda;padding:10px 14px;border-radius:8px;margin-bottom:20px;">
		<p style="color:#155724;font-size:0.9rem;">Tutorial saved.</p>
	</div>
{/if}

<form method="POST" action="?/saveTutorial" use:enhance>
	<!-- Header -->
	<div class="card" style="margin-bottom:20px;">
		<h2 style="margin-bottom:12px;">Header</h2>
		<div class="form-group">
			<label>Title</label>
			<input name="tut_title" type="text" value={data.tut.tut_title} required />
		</div>
		<div class="form-group">
			<label>Subtitle</label>
			<input name="tut_subtitle" type="text" value={data.tut.tut_subtitle} />
		</div>
	</div>

	<!-- Steps -->
	{#each [1, 2, 3, 4, 5] as n}
		<div class="card" style="margin-bottom:20px;">
			<h2 style="margin-bottom:12px;">Step {n}</h2>
			<div class="form-group">
				<label>Step Title</label>
				<input name="tut_step{n}_title" type="text" value={data.tut[`tut_step${n}_title`]} required />
			</div>
			<div class="form-group">
				<label>Body Text</label>
				<textarea name="tut_step{n}_body" rows="4">{data.tut[`tut_step${n}_body`]}</textarea>
				<small style="color:var(--text-light);font-size:0.8rem;">Plain text. Line breaks are preserved.</small>
			</div>
			<div style="display:flex;gap:12px;flex-wrap:wrap;">
				<div class="form-group" style="flex:1;min-width:140px;">
					<label>Button Label</label>
					<input name="tut_step{n}_link_text" type="text" value={data.tut[`tut_step${n}_link_text`]} placeholder="e.g. My Account" />
				</div>
				<div class="form-group" style="flex:2;min-width:200px;">
					<label>Button URL</label>
					<input name="tut_step{n}_link_url" type="text" value={data.tut[`tut_step${n}_link_url`]} placeholder="e.g. /volunteer/account or https://..." />
				</div>
			</div>
		</div>
	{/each}

	<!-- FAQ -->
	<div class="card" style="margin-bottom:20px;">
		<h2 style="margin-bottom:12px;">FAQ</h2>
		<div class="form-group">
			<label>FAQ Section Title</label>
			<input name="tut_faq_title" type="text" value={data.tut.tut_faq_title} />
		</div>
		{#each [1, 2, 3, 4] as n}
			<div style="padding:14px 0;border-top:1px solid var(--border);margin-top:12px;">
				<p style="font-size:0.85rem;font-weight:600;margin-bottom:8px;color:var(--text-light);">Question {n}</p>
				<div class="form-group">
					<label>Question</label>
					<input name="tut_faq{n}_q" type="text" value={data.tut[`tut_faq${n}_q`]} />
				</div>
				<div class="form-group">
					<label>Answer</label>
					<textarea name="tut_faq{n}_a" rows="2">{data.tut[`tut_faq${n}_a`]}</textarea>
				</div>
			</div>
		{/each}
	</div>

	<button type="submit" class="btn btn-primary" style="width:100%;margin-bottom:32px;">Save Tutorial</button>
</form>
