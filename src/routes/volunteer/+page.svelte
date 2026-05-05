<!-- volunteer home — quick links + announcements -->
<script lang="ts">
	import type { PageData } from './$types';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';

	let { data }: { data: PageData } = $props();
</script>

<h1>{t[$lang].welcomeMsg(data.user?.firstName ?? '')}</h1>
<p style="color:var(--text-light);margin-bottom:24px;">{t[$lang].homeSubtitle}</p>

<!-- //Display volunteer contributions -->
<div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
  <div class="card" style="flex:1;min-width:120px;text-align:center;">
    <p style="font-size:1.8rem;font-weight:700;">{data.totals.hours}</p>
    <p style="font-size:0.8rem;color:var(--text-light);">Total Hours</p>
  </div>
  <div class="card" style="flex:1;min-width:120px;text-align:center;">
    <p style="font-size:1.8rem;font-weight:700;">${data.totals.donations}</p>
    <p style="font-size:0.8rem;color:var(--text-light);">Total Donated</p>
  </div>
</div>

<div class="card" style="display:flex;flex-direction:column;gap:12px;max-width:420px;">
	<a href="/volunteer/events" class="btn btn-primary" style="text-align:center;">{t[$lang].viewEvents}</a>
	<a href="/volunteer/log" class="btn btn-accent" style="text-align:center;">{t[$lang].logHours}</a>
	<a href="/volunteer/account" class="btn btn-outline" style="text-align:center;">{t[$lang].myAccountChildren}</a>
	<a href="/volunteer/tutorial" class="btn btn-outline" style="text-align:center;">{t[$lang].howToUseSite}</a>
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
