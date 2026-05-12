<!-- organizer tutorial — static guide for admins/organizers -->
<script lang="ts">
	import { lang } from '$lib/stores/lang';
	import { Calendar, Users, Settings, Mail, BookOpen, Archive, Download } from 'lucide-svelte';

	const en = {
		title: 'Organizer Guide',
		subtitle: "Everything you need to know to run your organization's volunteer tracking.",
		sections: [
			{
				icon: 'home',
				title: 'The Home Dashboard',
				body: "The home page shows headline stats (total volunteers, total hours, kids who've met their goal) and quick-link tiles to every section. Recent announcements are pinned at the bottom.",
				tips: [
					'Stats reload on every page visit — refresh after large changes.',
					'Use the tiles to jump quickly to Events, Volunteers, Manage, or this tutorial.',
				],
			},
			{
				icon: 'calendar',
				title: 'Managing Events',
				body: 'The Events tab is where you create and maintain the schedule volunteers sign up for. Click "+ Add New Event" to create one. Existing events can be edited or deleted inline.',
				tips: [
					'Past events stay visible (greyed out) until you delete them or archive the season.',
					'The "Event Type" dropdown is populated from the activity types you set in Manage.',
					'Dates are capped at 2 years in the future to prevent typos.',
				],
			},
			{
				icon: 'users',
				title: 'Volunteers',
				body: 'The Volunteers tab lists every volunteer account with their hours and linked children. Click a volunteer to see their full contribution history and edit details.',
				tips: [
					'Hours shown are cumulative for the current season.',
					'To add a new volunteer, go to Manage → People → Add Volunteer.',
				],
			},
			{
				icon: 'settings',
				title: 'The Manage Page',
				body: 'Manage is the control panel. Each section is collapsible:',
				tips: [
					'Announcements — post messages that appear on the volunteer home page.',
					'Settings — hours required per membership tier, donation conversion rate, swim levels, activity types, and season start/end dates.',
					'People — create volunteer accounts, add children, link guardians to children.',
					'Manual Entry & Mark as Met — log hours on behalf of a volunteer, or top them up to meet the requirement in one click.',
					'Export & Archive — download a CSV of all contributions, or archive the season to reset for next year.',
				],
			},
			{
				icon: 'mail',
				title: 'Emailing',
				body: 'From Manage, click the Emailing banner to send announcements, reminders, or custom emails to volunteers. Templates can be edited from there.',
				tips: [
					'Current limit is 600 emails per month (set by the mail provider).',
					'You can preview the email body before sending.',
				],
			},
			{
				icon: 'book',
				title: 'Editing the Volunteer Tutorial',
				body: "Manage → Tutorial Edit lets you customize the step-by-step guide volunteers see on their tutorial page. Steps and FAQ entries can be added, edited, or removed.",
				tips: [
					'Save your edits before adding or deleting a step — the page reloads on those actions.',
					'Click "Preview ↗" to see the live volunteer tutorial in a new tab.',
				],
			},
			{
				icon: 'archive',
				title: 'Archiving a Season',
				body: 'When the season ends, go to Manage → Export & Archive. Archiving freezes the current contributions under a season label and clears them for the next cycle. Past archives stay browsable below the form.',
				tips: [
					'Always export the CSV before archiving — archived data stays in the system but the CSV is a clean snapshot.',
					"If you set a Season End date, the system will auto-archive once that date passes and roll the dates forward by one year.",
				],
			},
			{
				icon: 'download',
				title: 'Exporting Data',
				body: 'The Export CSV button in Manage → Export & Archive downloads every contribution in the current season as a spreadsheet. Open it in Excel, Google Sheets, or any text editor.',
				tips: [
					'Each row is one contribution (hours or donation).',
					'Volunteer name, date, type, and notes are all included.',
				],
			},
		],
	};

	const fr = {
		title: "Guide de l'organisateur",
		subtitle: 'Tout ce qu\'il faut savoir pour gérer le suivi des bénévoles.',
		sections: [
			{
				icon: 'home',
				title: "Le tableau de bord d'accueil",
				body: "La page d'accueil affiche les statistiques clés (bénévoles, heures, enfants ayant atteint leur objectif) et des tuiles de raccourci. Les annonces récentes sont en bas.",
				tips: [
					'Les statistiques se rechargent à chaque visite — rafraîchissez après de gros changements.',
					'Utilisez les tuiles pour accéder rapidement aux Événements, Bénévoles, Gestion ou à ce tutoriel.',
				],
			},
			{
				icon: 'calendar',
				title: 'Gestion des événements',
				body: "L'onglet Événements vous permet de créer et maintenir le calendrier auquel les bénévoles s'inscrivent. Cliquez sur « + Ajouter un événement ».",
				tips: [
					"Les événements passés restent visibles (grisés) jusqu'à suppression ou archivage de la saison.",
					"Le menu « Type d'événement » est rempli depuis les types d'activités définis dans Gestion.",
					'Les dates sont limitées à 2 ans dans le futur pour éviter les fautes de frappe.',
				],
			},
			{
				icon: 'users',
				title: 'Bénévoles',
				body: "L'onglet Bénévoles liste chaque compte avec ses heures et ses enfants liés. Cliquez sur un bénévole pour voir l'historique complet.",
				tips: [
					'Les heures affichées sont cumulatives pour la saison en cours.',
					'Pour ajouter un nouveau bénévole, allez dans Gestion → Personnes → Ajouter un bénévole.',
				],
			},
			{
				icon: 'settings',
				title: 'La page Gestion',
				body: 'Gestion est le panneau de contrôle. Chaque section est repliable :',
				tips: [
					"Annonces — publier des messages affichés sur la page d'accueil des bénévoles.",
					'Paramètres — heures requises par type de membre, taux de conversion des dons, niveaux, types d\'activités, dates de saison.',
					'Personnes — créer des comptes bénévoles, ajouter des enfants, lier les tuteurs.',
					"Saisie manuelle & Marquer comme atteint — enregistrer des heures pour un bénévole, ou compléter d'un clic.",
					'Export & Archive — télécharger un CSV ou archiver la saison pour repartir à zéro.',
				],
			},
			{
				icon: 'mail',
				title: 'Courriels',
				body: 'Depuis Gestion, cliquez sur la bannière Courriels pour envoyer des annonces, rappels ou courriels personnalisés. Les modèles sont modifiables.',
				tips: [
					'Limite actuelle : 600 courriels par mois (fixée par le fournisseur).',
					"Vous pouvez prévisualiser le corps du courriel avant l'envoi.",
				],
			},
			{
				icon: 'book',
				title: 'Modifier le tutoriel des bénévoles',
				body: 'Gestion → Modifier le tutoriel permet de personnaliser le guide étape par étape vu par les bénévoles. Étapes et questions FAQ peuvent être ajoutées, modifiées ou supprimées.',
				tips: [
					"Sauvegardez vos modifications avant d'ajouter ou supprimer une étape — la page se recharge sur ces actions.",
					'Cliquez sur « Aperçu ↗ » pour voir le tutoriel en direct dans un nouvel onglet.',
				],
			},
			{
				icon: 'archive',
				title: "Archiver une saison",
				body: "À la fin de la saison, allez dans Gestion → Export & Archive. L'archivage fige les contributions sous un nom de saison et les efface pour le cycle suivant.",
				tips: [
					"Exportez toujours le CSV avant d'archiver — les données archivées restent dans le système mais le CSV est une copie propre.",
					'Si vous avez une date de fin de saison, le système archive automatiquement à cette date et avance les dates d\'un an.',
				],
			},
			{
				icon: 'download',
				title: 'Exporter les données',
				body: "Le bouton Export CSV dans Gestion → Export & Archive télécharge toutes les contributions de la saison en cours sous forme de tableur.",
				tips: [
					'Chaque ligne est une contribution (heures ou don).',
					'Le nom du bénévole, la date, le type et les notes sont inclus.',
				],
			},
		],
	};

	let content = $derived($lang === 'fr' ? fr : en);

	function iconFor(name: string) {
		switch (name) {
			case 'calendar': return Calendar;
			case 'users': return Users;
			case 'settings': return Settings;
			case 'mail': return Mail;
			case 'book': return BookOpen;
			case 'archive': return Archive;
			case 'download': return Download;
			default: return BookOpen;
		}
	}
</script>

<h1>{content.title}</h1>
<p style="color:var(--text-light);margin-bottom:24px;">{content.subtitle}</p>

<div style="display:flex;flex-direction:column;gap:16px;">
	{#each content.sections as section}
		{@const Icon = iconFor(section.icon)}
		<div class="card section-card">
			<div class="section-head">
				<span class="section-icon"><Icon size={22} /></span>
				<h2 style="margin:0;">{section.title}</h2>
			</div>
			<p style="margin-top:10px;line-height:1.55;">{section.body}</p>
			{#if section.tips.length > 0}
				<ul class="tip-list">
					{#each section.tips as tip}
						<li>{tip}</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/each}
</div>

<style>
	.section-card {
		padding: 18px 20px;
	}
	.section-head {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.section-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 10px;
		background: rgba(88, 164, 176, 0.14);
		color: var(--primary);
		flex-shrink: 0;
	}
	.tip-list {
		margin: 10px 0 0 0;
		padding-left: 20px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.tip-list li {
		font-size: 0.92rem;
		color: var(--text-light);
		line-height: 1.5;
	}
</style>
