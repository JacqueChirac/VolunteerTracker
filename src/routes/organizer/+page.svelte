<!-- organizer home — welcome, stats, quick links, recent announcements -->
<script lang="ts">
	import type { PageData } from './$types';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';
	import { Calendar, Users, Settings, BookOpen } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<h1>{t[$lang].welcomeMsg(data.user?.firstName ?? '')}</h1>
<p style="color:var(--text-light);margin-bottom:24px;">
	{$lang === 'en' ? 'Your organizer dashboard. Use the tiles below to manage events, volunteers, and settings.' : 'Votre tableau de bord. Utilisez les tuiles ci-dessous pour gérer les événements, les bénévoles et les paramètres.'}
</p>

<!-- stat cards -->
<div style="display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap;">
	<div class="card" style="flex:1;min-width:120px;text-align:center;">
		<p style="font-size:1.8rem;font-weight:700;">{data.stats.totalVolunteers}</p>
		<p style="font-size:0.8rem;color:var(--text-light);">{t[$lang].totalVolunteers}</p>
	</div>
	<div class="card" style="flex:1;min-width:120px;text-align:center;">
		<p style="font-size:1.8rem;font-weight:700;">{data.stats.totalHours}</p>
		<p style="font-size:0.8rem;color:var(--text-light);">{t[$lang].totalHours}</p>
	</div>
	<div class="card" style="flex:1;min-width:120px;text-align:center;">
		<p style="font-size:1.8rem;font-weight:700;">{data.stats.childrenMet}/{data.stats.childrenTotal}</p>
		<p style="font-size:0.8rem;color:var(--text-light);">{t[$lang].kidsMetGoal}</p>
	</div>
</div>

<!-- quick-link tiles -->
<div class="tile-grid">
	<a href="/organizer/events" class="tile">
		<span class="tile-icon"><Calendar size={28} /></span>
		<span class="tile-title">{t[$lang].events}</span>
		<span class="tile-desc">{$lang === 'en' ? 'Create and manage upcoming and past events.' : 'Créer et gérer les événements à venir et passés.'}</span>
	</a>
	<a href="/organizer/volunteers" class="tile">
		<span class="tile-icon"><Users size={28} /></span>
		<span class="tile-title">{t[$lang].volunteers}</span>
		<span class="tile-desc">{$lang === 'en' ? 'View volunteer profiles and progress.' : 'Voir les profils et la progression des bénévoles.'}</span>
	</a>
	<a href="/organizer/manage" class="tile">
		<span class="tile-icon"><Settings size={28} /></span>
		<span class="tile-title">{t[$lang].manage}</span>
		<span class="tile-desc">{$lang === 'en' ? 'Settings, announcements, people, exports.' : 'Paramètres, annonces, personnes, exports.'}</span>
	</a>
	<a href="/organizer/tutorial" class="tile">
		<span class="tile-icon"><BookOpen size={28} /></span>
		<span class="tile-title">{$lang === 'en' ? 'Tutorial' : 'Tutoriel'}</span>
		<span class="tile-desc">{$lang === 'en' ? 'Learn how to use the organizer interface.' : "Apprendre à utiliser l'interface d'organisateur."}</span>
	</a>
</div>

{#if data.announcements.length > 0}
	<h2 style="margin-top:32px;margin-bottom:12px;">{t[$lang].announcementsTitle}</h2>
	{#each data.announcements as a}
		<div class="card" style="margin-bottom:12px;">
			<h3>{a.title}</h3>
			<p style="font-size:0.85rem;color:var(--text-light);margin-bottom:4px;">{new Date(a.createdAt).toLocaleDateString()}</p>
			<p>{a.content}</p>
		</div>
	{/each}
{/if}

<style>
	.tile-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 14px;
	}
	.tile {
		display: flex;
		flex-direction: column;
		gap: 6px;
		background: var(--card-bg, white);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 18px 18px 20px;
		color: var(--text);
		text-decoration: none;
		transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
	}
	.tile:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 18px rgba(46,56,72,0.08);
		border-color: var(--primary);
	}
	.tile-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: rgba(88, 164, 176, 0.14);
		color: var(--primary);
		margin-bottom: 4px;
	}
	.tile-title {
		font-size: 1.05rem;
		font-weight: 700;
	}
	.tile-desc {
		font-size: 0.85rem;
		color: var(--text-light);
		line-height: 1.4;
	}
</style>
