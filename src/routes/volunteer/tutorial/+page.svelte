<!-- tutorial — display by default; organizers see an Edit toggle for inline editing. -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Edit3, Eye, ArrowLeft } from 'lucide-svelte';
	import type { PageData, ActionData } from './$types';
	import { lang } from '$lib/stores/lang';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isOrganizer = $derived(data.user?.role === 'organizer');
	// Mode is driven by ?edit=1 in the URL so organizers can be deep-linked
	// straight into the editor from the Manage page, and so it's bookmarkable.
	const editing = $derived(isOrganizer && page.url.searchParams.get('edit') === '1');

	function toggleEdit() {
		const url = new URL(page.url);
		if (editing) url.searchParams.delete('edit');
		else url.searchParams.set('edit', '1');
		goto(url, { replaceState: true, noScroll: true, keepFocus: true });
	}

	const stepCount = $derived(Number(data.tut.tut_step_count || '5'));
	const faqCount = $derived(Number(data.tut.tut_faq_count || '4'));
	const steps = $derived(Array.from({ length: stepCount }, (_, i) => i + 1));
	const faqs = $derived(Array.from({ length: faqCount }, (_, i) => i + 1));

	// returns FR variant if available and non-empty, otherwise falls back to EN
	function tval(l: string, key: string): string {
		if (l === 'fr') {
			const fr = data.tut[`${key}_fr`];
			if (fr?.trim()) return fr;
		}
		return data.tut[key] ?? '';
	}

	const displaySteps = $derived.by(() => {
		const l = $lang;
		return steps.map((n) => ({
			n,
			title: tval(l, `tut_step${n}_title`),
			body: tval(l, `tut_step${n}_body`),
			linkText: tval(l, `tut_step${n}_link_text`),
			linkUrl: data.tut[`tut_step${n}_link_url`]
		}));
	});

	const displayFaqs = $derived.by(() => {
		const l = $lang;
		return faqs.map((n) => ({
			n,
			q: tval(l, `tut_faq${n}_q`),
			a: tval(l, `tut_faq${n}_a`)
		}));
	});
</script>

{#if isOrganizer}
	<div class="org-bar">
		<a href="/organizer/manage" class="back-link">
			<ArrowLeft size={16} />
			{$lang === 'en' ? 'Back to Manage' : 'Retour à Gestion'}
		</a>
		<div class="mode-info">
			<span class="mode-label">
				{editing
					? ($lang === 'en' ? 'You are editing the volunteer tutorial' : 'Vous modifiez le tutoriel des bénévoles')
					: ($lang === 'en' ? 'Previewing the volunteer tutorial' : 'Aperçu du tutoriel des bénévoles')}
			</span>
		</div>
		<button
			type="button"
			class="mode-toggle {editing ? 'is-preview' : 'is-edit'}"
			onclick={toggleEdit}
		>
			{#if editing}
				<Eye size={16} />
				{$lang === 'en' ? 'Switch to preview' : 'Passer en aperçu'}
			{:else}
				<Edit3 size={16} />
				{$lang === 'en' ? 'Switch to edit' : "Passer en édition"}
			{/if}
		</button>
	</div>
{/if}

{#if form?.success}
	<div class="alert-ok">
		<p>{form.message ?? ($lang === 'en' ? 'Saved.' : 'Sauvegardé.')}</p>
	</div>
{/if}

{#if editing && isOrganizer}
	<!-- ─── EDIT MODE ─────────────────────────────────────────────────── -->

	<!-- hidden operation forms (used by buttons inside the main form) -->
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

	<p style="color:var(--text-light);font-size:0.85rem;margin-bottom:20px;">
		{$lang === 'en'
			? 'Edits are bilingual (EN + FR). Save before adding or deleting steps — the page reloads on those actions.'
			: "Modifications bilingues (EN + FR). Sauvegardez avant d'ajouter ou supprimer des étapes — la page se recharge."}
	</p>

	<form method="POST" action="?/saveTutorial" use:enhance>
		<!-- Header -->
		<div class="card" style="margin-bottom:20px;">
			<h2 style="margin-bottom:12px;">{$lang === 'en' ? 'Header' : 'En-tête'}</h2>
			<div class="bilingual">
				<div class="form-group">
					<label>Title <span class="lang-tag">EN</span></label>
					<input name="tut_title" type="text" value={data.tut.tut_title ?? ''} required />
				</div>
				<div class="form-group">
					<label>Titre <span class="lang-tag">FR</span></label>
					<input name="tut_title_fr" type="text" value={data.tut.tut_title_fr ?? ''} />
				</div>
			</div>
			<div class="bilingual">
				<div class="form-group">
					<label>Subtitle <span class="lang-tag">EN</span></label>
					<input name="tut_subtitle" type="text" value={data.tut.tut_subtitle ?? ''} />
				</div>
				<div class="form-group">
					<label>Sous-titre <span class="lang-tag">FR</span></label>
					<input name="tut_subtitle_fr" type="text" value={data.tut.tut_subtitle_fr ?? ''} />
				</div>
			</div>
		</div>

		<!-- Steps -->
		{#each steps as n}
			<div class="card" style="margin-bottom:20px;">
				<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
					<h2 style="margin:0;">{$lang === 'en' ? `Step ${n}` : `Étape ${n}`}</h2>
					{#if stepCount > 1}
						<button
							type="submit"
							form="del-step-{n}"
							class="del-btn"
							onclick={(e) => {
								if (!confirm($lang === 'en' ? `Delete Step ${n}? Unsaved edits will be lost.` : `Supprimer l'étape ${n} ?`)) e.preventDefault();
							}}
						>
							{$lang === 'en' ? 'Delete step' : "Supprimer l'étape"}
						</button>
					{/if}
				</div>

				<div class="bilingual">
					<div class="form-group">
						<label>Step Title <span class="lang-tag">EN</span></label>
						<input name="tut_step{n}_title" type="text" value={data.tut[`tut_step${n}_title`] ?? ''} required />
					</div>
					<div class="form-group">
						<label>Titre de l'étape <span class="lang-tag">FR</span></label>
						<input name="tut_step{n}_title_fr" type="text" value={data.tut[`tut_step${n}_title_fr`] ?? ''} />
					</div>
				</div>

				<div class="bilingual">
					<div class="form-group">
						<label>Body Text <span class="lang-tag">EN</span></label>
						<textarea name="tut_step{n}_body" rows="4">{data.tut[`tut_step${n}_body`] ?? ''}</textarea>
					</div>
					<div class="form-group">
						<label>Texte <span class="lang-tag">FR</span></label>
						<textarea name="tut_step{n}_body_fr" rows="4">{data.tut[`tut_step${n}_body_fr`] ?? ''}</textarea>
					</div>
				</div>
				<small style="color:var(--text-light);font-size:0.8rem;display:block;margin-top:-8px;margin-bottom:12px;">
					{$lang === 'en' ? 'Plain text. Line breaks are preserved.' : 'Texte brut. Les sauts de ligne sont préservés.'}
				</small>

				<div class="bilingual">
					<div class="form-group">
						<label>Button Label <span class="lang-tag">EN</span></label>
						<input name="tut_step{n}_link_text" type="text" value={data.tut[`tut_step${n}_link_text`] ?? ''} placeholder="e.g. My Account" />
					</div>
					<div class="form-group">
						<label>Libellé du bouton <span class="lang-tag">FR</span></label>
						<input name="tut_step{n}_link_text_fr" type="text" value={data.tut[`tut_step${n}_link_text_fr`] ?? ''} placeholder="ex: Mon compte" />
					</div>
				</div>

				<div class="form-group">
					<label>
						Button URL <span style="color:var(--text-light);font-size:0.78rem;">({$lang === 'en' ? 'same for both languages' : 'identique pour les deux langues'})</span>
					</label>
					<input name="tut_step{n}_link_url" type="text" value={data.tut[`tut_step${n}_link_url`] ?? ''} placeholder="e.g. /volunteer/account" />
				</div>
			</div>
		{/each}

		<button
			type="submit"
			form="add-step-form"
			class="btn btn-outline"
			style="width:100%;margin-bottom:28px;"
			onclick={(e) => {
				if (!confirm($lang === 'en' ? 'Add a new step? Unsaved edits will be lost.' : 'Ajouter une étape ? Modifications non sauvegardées perdues.')) e.preventDefault();
			}}
		>
			+ {$lang === 'en' ? 'Add Step' : 'Ajouter une étape'}
		</button>

		<!-- FAQ -->
		<div class="card" style="margin-bottom:20px;">
			<h2 style="margin-bottom:12px;">FAQ</h2>
			<div class="bilingual">
				<div class="form-group">
					<label>FAQ Section Title <span class="lang-tag">EN</span></label>
					<input name="tut_faq_title" type="text" value={data.tut.tut_faq_title ?? ''} />
				</div>
				<div class="form-group">
					<label>Titre de la FAQ <span class="lang-tag">FR</span></label>
					<input name="tut_faq_title_fr" type="text" value={data.tut.tut_faq_title_fr ?? ''} />
				</div>
			</div>

			{#each faqs as n}
				<div style="padding:14px 0;border-top:1px solid var(--border);margin-top:12px;">
					<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
						<p style="font-size:0.85rem;font-weight:600;color:var(--text-light);margin:0;">Question {n}</p>
						{#if faqCount > 1}
							<button
								type="submit"
								form="del-faq-{n}"
								class="del-btn"
								onclick={(e) => {
									if (!confirm($lang === 'en' ? `Delete Question ${n}? Unsaved edits will be lost.` : `Supprimer la question ${n} ?`)) e.preventDefault();
								}}
							>
								{$lang === 'en' ? 'Delete' : 'Supprimer'}
							</button>
						{/if}
					</div>
					<div class="bilingual">
						<div class="form-group">
							<label>Question <span class="lang-tag">EN</span></label>
							<input name="tut_faq{n}_q" type="text" value={data.tut[`tut_faq${n}_q`] ?? ''} />
						</div>
						<div class="form-group">
							<label>Question <span class="lang-tag">FR</span></label>
							<input name="tut_faq{n}_q_fr" type="text" value={data.tut[`tut_faq${n}_q_fr`] ?? ''} />
						</div>
					</div>
					<div class="bilingual">
						<div class="form-group">
							<label>Answer <span class="lang-tag">EN</span></label>
							<textarea name="tut_faq{n}_a" rows="2">{data.tut[`tut_faq${n}_a`] ?? ''}</textarea>
						</div>
						<div class="form-group">
							<label>Réponse <span class="lang-tag">FR</span></label>
							<textarea name="tut_faq{n}_a_fr" rows="2">{data.tut[`tut_faq${n}_a_fr`] ?? ''}</textarea>
						</div>
					</div>
				</div>
			{/each}

			<div style="margin-top:16px;">
				<button
					type="submit"
					form="add-faq-form"
					class="btn btn-outline"
					style="width:100%;"
					onclick={(e) => {
						if (!confirm($lang === 'en' ? 'Add a new FAQ question? Unsaved edits will be lost.' : 'Ajouter une nouvelle question FAQ ?')) e.preventDefault();
					}}
				>
					+ {$lang === 'en' ? 'Add FAQ Question' : 'Ajouter une question'}
				</button>
			</div>
		</div>

		<button type="submit" class="btn btn-primary" style="width:100%;margin-bottom:32px;">
			{$lang === 'en' ? 'Save Tutorial' : 'Sauvegarder le tutoriel'}
		</button>
	</form>
{:else}
	<!-- ─── VIEW MODE ─────────────────────────────────────────────────── -->
	<h1>{tval($lang, 'tut_title')}</h1>
	<p style="color:var(--text-light);margin-bottom:24px;">{tval($lang, 'tut_subtitle')}</p>

	<div style="display:flex;flex-direction:column;gap:20px;">
		{#each displaySteps as step}
			<div class="card">
				<h2>{step.title}</h2>
				<p style="white-space:pre-wrap;line-height:1.6;">{step.body}</p>
				{#if step.linkUrl}
					<a href={step.linkUrl} class="btn btn-outline" style="display:inline-block;margin-top:12px;font-size:0.9rem;">
						{step.linkText || 'Go'}
					</a>
				{/if}
			</div>
		{/each}

		<div class="card" style="background:var(--bg);border:2px solid var(--border);">
			<h2>{tval($lang, 'tut_faq_title')}</h2>
			<div style="margin-top:12px;display:flex;flex-direction:column;gap:16px;">
				{#each displayFaqs as faq}
					{#if faq.q}
						<div>
							<p><strong>{faq.q}</strong></p>
							<p style="color:var(--text-light);margin-top:4px;">{faq.a}</p>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.org-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
		margin-bottom: 20px;
		padding: 12px 16px;
		background: linear-gradient(135deg, var(--primary), var(--primary-dark));
		border: none;
		border-radius: 10px;
		color: white;
		box-shadow: 0 2px 6px rgba(0,0,0,0.08);
	}
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.9rem;
		color: rgba(255,255,255,0.85);
		text-decoration: none;
		padding: 6px 10px;
		border-radius: 6px;
		transition: background 0.15s;
	}
	.back-link:hover { color: white; background: rgba(255,255,255,0.14); }
	.mode-info {
		flex: 1;
		min-width: 0;
		text-align: center;
	}
	.mode-label {
		font-size: 0.92rem;
		font-weight: 600;
		color: white;
	}
	.mode-toggle {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		font-size: 0.9rem;
		font-weight: 600;
		border-radius: 8px;
		cursor: pointer;
		border: 1px solid rgba(255,255,255,0.5);
		background: rgba(255,255,255,0.2);
		color: white;
		transition: background 0.15s;
		white-space: nowrap;
	}
	.mode-toggle:hover { background: rgba(255,255,255,0.32); }
	.mode-toggle.is-edit { background: rgba(255,255,255,0.95); color: var(--primary-dark); border-color: white; }
	.mode-toggle.is-edit:hover { background: white; }
	@media (max-width: 600px) {
		.org-bar { flex-direction: column; align-items: stretch; }
		.mode-info { text-align: left; }
		.mode-toggle { justify-content: center; }
	}
	.alert-ok {
		background: #d4edda;
		padding: 10px 14px;
		border-radius: 8px;
		margin-bottom: 20px;
	}
	.alert-ok p {
		color: #155724;
		font-size: 0.9rem;
		margin: 0;
	}
	.bilingual {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	@media (max-width: 600px) { .bilingual { grid-template-columns: 1fr; } }
	.lang-tag {
		display: inline-block;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 0.68rem;
		font-weight: 700;
		padding: 1px 5px;
		color: var(--text-light);
		vertical-align: middle;
		margin-left: 4px;
		letter-spacing: 0.5px;
	}
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
	.del-btn:hover { background: #c0392b; color: #fff; transform: none; box-shadow: none; }
</style>
