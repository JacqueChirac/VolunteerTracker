<!-- email defaults + reusable templates for the Emailing composer -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { lang } from '$lib/stores/lang';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let showAddTemplate = $state(false);
</script>

<a href="/organizer/manage/emailing" style="font-size:0.9rem;">{$lang === 'en' ? '← Back to Emailing' : '← Retour aux courriels'}</a>

<h1 style="margin-top:8px;">{$lang === 'en' ? 'Email Settings' : 'Paramètres des courriels'}</h1>
<p style="color:var(--text-light);margin-bottom:24px;">
	{$lang === 'en'
		? 'Set the default subject and signature, plus reusable message templates. These pre-fill the Emailing composer.'
		: 'Définissez le sujet et la signature par défaut, ainsi que des modèles réutilisables. Ils pré-remplissent le composeur de courriels.'}
</p>

<!-- defaults -->
<div class="card" style="margin-bottom:20px;">
	<h2 style="margin-bottom:12px;">{$lang === 'en' ? 'Defaults' : 'Valeurs par défaut'}</h2>
	{#if form?.defaultsSaved}
		<div style="background:#d4edda;padding:8px 12px;border-radius:6px;margin-bottom:12px;"><p style="color:#155724;font-size:0.9rem;">{$lang === 'en' ? 'Defaults saved.' : 'Valeurs enregistrées.'}</p></div>
	{/if}
	{#if form?.error}<p class="error" style="margin-bottom:8px;">{form.error}</p>{/if}
	<form method="POST" action="?/saveDefaults" use:enhance>
		<div class="form-group">
			<label for="subject">{$lang === 'en' ? 'Default subject' : 'Sujet par défaut'}</label>
			<input id="subject" name="subject" type="text" value={data.email.subject} required />
		</div>
		<div class="form-group">
			<label for="signature">{$lang === 'en' ? 'Default signature / from-name' : 'Signature par défaut'}</label>
			<input id="signature" name="signature" type="text" value={data.email.signature} />
		</div>
		<button type="submit" class="btn btn-primary">{$lang === 'en' ? 'Save defaults' : 'Enregistrer'}</button>
	</form>
</div>

<!-- templates -->
<div class="card">
	<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
		<h2 style="margin:0;">{$lang === 'en' ? 'Message templates' : 'Modèles de message'}</h2>
		<button class="btn btn-accent" style="padding:6px 14px;font-size:0.85rem;" onclick={() => (showAddTemplate = !showAddTemplate)}>
			{showAddTemplate ? ($lang === 'en' ? 'Cancel' : 'Annuler') : ($lang === 'en' ? '+ New template' : '+ Nouveau modèle')}
		</button>
	</div>

	{#if form?.templateSaved}
		<div style="background:#d4edda;padding:8px 12px;border-radius:6px;margin-bottom:12px;"><p style="color:#155724;font-size:0.9rem;">{$lang === 'en' ? 'Template saved.' : 'Modèle enregistré.'}</p></div>
	{/if}
	{#if form?.templateDeleted}
		<div style="background:#d4edda;padding:8px 12px;border-radius:6px;margin-bottom:12px;"><p style="color:#155724;font-size:0.9rem;">{$lang === 'en' ? 'Template deleted.' : 'Modèle supprimé.'}</p></div>
	{/if}
	{#if form?.templateError}<p class="error" style="margin-bottom:8px;">{form.templateError}</p>{/if}

	{#if showAddTemplate}
		<form method="POST" action="?/addTemplate" use:enhance={() => async ({ update }) => { await update(); showAddTemplate = false; }} style="margin-bottom:16px;padding:12px;border:1px dashed var(--border);border-radius:12px;">
			<div class="form-group">
				<label for="tpl_name">{$lang === 'en' ? 'Template name' : 'Nom du modèle'}</label>
				<input id="tpl_name" name="name" type="text" placeholder={$lang === 'en' ? 'e.g. Event reminder' : 'ex. Rappel d\'événement'} required />
			</div>
			<div class="form-group">
				<label for="tpl_body">{$lang === 'en' ? 'Message body' : 'Corps du message'}</label>
				<textarea id="tpl_body" name="body" rows="5" required></textarea>
			</div>
			<button type="submit" class="btn btn-primary">{$lang === 'en' ? 'Save template' : 'Enregistrer le modèle'}</button>
		</form>
	{/if}

	{#if data.email.templates.length === 0}
		<p style="color:var(--text-light);font-size:0.9rem;">{$lang === 'en' ? 'No templates yet.' : 'Aucun modèle pour l\'instant.'}</p>
	{:else}
		{#each data.email.templates as tpl (tpl.name)}
			<div style="padding:12px 0;border-bottom:1px solid var(--border);">
				<div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">
					<strong>{tpl.name}</strong>
					<form method="POST" action="?/deleteTemplate" use:enhance>
						<input type="hidden" name="name" value={tpl.name} />
						<button type="submit" class="btn btn-danger" style="padding:2px 8px;font-size:0.75rem;" onclick={(e) => { if (!confirm($lang === 'en' ? `Delete template "${tpl.name}"?` : `Supprimer le modèle « ${tpl.name} »?`)) e.preventDefault(); }}>
							{$lang === 'en' ? 'Delete' : 'Supprimer'}
						</button>
					</form>
				</div>
				<p style="font-size:0.85rem;color:var(--text-light);margin-top:4px;white-space:pre-wrap;">{tpl.body}</p>
			</div>
		{/each}
	{/if}
</div>
