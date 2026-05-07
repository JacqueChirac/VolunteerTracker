<!-- tutorial editor — organizer can add/edit/delete steps and FAQ questions -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	const stepCount = $derived(Number(data.tut.tut_step_count || '5'));
	const faqCount = $derived(Number(data.tut.tut_faq_count || '4'));
	const steps = $derived(Array.from({ length: stepCount }, (_, i) => i + 1));
	const faqs = $derived(Array.from({ length: faqCount }, (_, i) => i + 1));
</script>

<!-- hidden operation forms — referenced by buttons inside the main save form via form="..." -->
{#each steps as n}
	<form id="del-step-{n}" method="POST" action="?/deleteStep" use:enhance style="display:none;">
		<input type="hidden" name="n" value={n} />
	</form>
{/each}
<form id="add-step-form" method="POST" action="?/addStep" use:enhance style="display:none;"></form>

{#each faqs as n}
	<form id="del-faq-{n}" method="POST" action="?/deleteFaq" use:enhance style="display:none;">
		<input type="hidden" name="n" value={n} />
	</form>
{/each}
<form id="add-faq-form" method="POST" action="?/addFaq" use:enhance style="display:none;"></form>

<!-- ───────────── page header ───────────── -->
<a href="/organizer/manage" style="font-size:0.9rem;">← Back to Manage</a>

<h1 style="margin-top:12px;">Edit Tutorial</h1>
<p style="color:var(--text-light);margin-bottom:4px;">
	Customize the tutorial shown to volunteers. Changes take effect immediately.
	<a href="/volunteer/tutorial" target="_blank" style="margin-left:8px;font-size:0.9rem;">Preview ↗</a>
</p>
<p style="color:var(--text-light);font-size:0.82rem;margin-bottom:20px;">
	Save your changes before adding or deleting steps — the page reloads on those actions.
</p>

{#if form?.success}
	<div style="background:#d4edda;padding:10px 14px;border-radius:8px;margin-bottom:20px;">
		<p style="color:#155724;font-size:0.9rem;">Saved.</p>
	</div>
{/if}

<!-- ───────────── main edit form ───────────── -->
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
	{#each steps as n}
		<div class="card" style="margin-bottom:20px;">
			<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
				<h2 style="margin:0;">Step {n}</h2>
				{#if stepCount > 1}
					<button
						type="submit"
						form="del-step-{n}"
						class="del-btn"
						onclick={(e) => { if (!confirm(`Delete Step ${n}? Unsaved edits will be lost.`)) e.preventDefault(); }}
					>
						Delete step
					</button>
				{/if}
			</div>

			<div class="form-group">
				<label>Step Title</label>
				<input name="tut_step{n}_title" type="text" value={data.tut[`tut_step${n}_title`] ?? ''} required />
			</div>
			<div class="form-group">
				<label>Body Text</label>
				<textarea name="tut_step{n}_body" rows="4">{data.tut[`tut_step${n}_body`] ?? ''}</textarea>
				<small style="color:var(--text-light);font-size:0.8rem;">Plain text. Line breaks are preserved.</small>
			</div>
			<div style="display:flex;gap:12px;flex-wrap:wrap;">
				<div class="form-group" style="flex:1;min-width:140px;">
					<label>Button Label</label>
					<input name="tut_step{n}_link_text" type="text" value={data.tut[`tut_step${n}_link_text`] ?? ''} placeholder="e.g. My Account" />
				</div>
				<div class="form-group" style="flex:2;min-width:200px;">
					<label>Button URL</label>
					<input name="tut_step{n}_link_url" type="text" value={data.tut[`tut_step${n}_link_url`] ?? ''} placeholder="e.g. /volunteer/account" />
				</div>
			</div>
		</div>
	{/each}

	<button
		type="submit"
		form="add-step-form"
		class="btn btn-outline"
		style="width:100%;margin-bottom:28px;"
		onclick={(e) => { if (!confirm('Add a new step? Unsaved edits will be lost.')) e.preventDefault(); }}
	>
		+ Add Step
	</button>

	<!-- FAQ -->
	<div class="card" style="margin-bottom:20px;">
		<h2 style="margin-bottom:12px;">FAQ</h2>
		<div class="form-group">
			<label>FAQ Section Title</label>
			<input name="tut_faq_title" type="text" value={data.tut.tut_faq_title} />
		</div>

		{#each faqs as n}
			<div style="padding:14px 0;border-top:1px solid var(--border);margin-top:12px;">
				<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
					<p style="font-size:0.85rem;font-weight:600;color:var(--text-light);margin:0;">Question {n}</p>
					{#if faqCount > 1}
						<button
							type="submit"
							form="del-faq-{n}"
							class="del-btn"
							onclick={(e) => { if (!confirm(`Delete Question ${n}? Unsaved edits will be lost.`)) e.preventDefault(); }}
						>
							Delete
						</button>
					{/if}
				</div>
				<div class="form-group">
					<label>Question</label>
					<input name="tut_faq{n}_q" type="text" value={data.tut[`tut_faq${n}_q`] ?? ''} />
				</div>
				<div class="form-group">
					<label>Answer</label>
					<textarea name="tut_faq{n}_a" rows="2">{data.tut[`tut_faq${n}_a`] ?? ''}</textarea>
				</div>
			</div>
		{/each}

		<div style="margin-top:16px;">
			<button
				type="submit"
				form="add-faq-form"
				class="btn btn-outline"
				style="width:100%;"
				onclick={(e) => { if (!confirm('Add a new FAQ question? Unsaved edits will be lost.')) e.preventDefault(); }}
			>
				+ Add FAQ Question
			</button>
		</div>
	</div>

	<button type="submit" class="btn btn-primary" style="width:100%;margin-bottom:32px;">Save Tutorial</button>
</form>

<style>
	.del-btn {
		background: transparent;
		border: 1px solid #c0392b;
		color: #c0392b;
		border-radius: 6px;
		padding: 3px 10px;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}
	.del-btn:hover {
		background: #c0392b;
		color: #fff;
		transform: none;
		box-shadow: none;
	}
</style>
