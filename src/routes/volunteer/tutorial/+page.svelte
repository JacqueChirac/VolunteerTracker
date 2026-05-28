<!-- tutorial page — displays content in the volunteer's selected language -->
<script lang="ts">
	import type { PageData } from './$types';
	import { lang } from '$lib/stores/lang';
	let { data }: { data: PageData } = $props();

	const stepCount = Number(data.tut.tut_step_count || '5');
	const faqCount  = Number(data.tut.tut_faq_count  || '4');

	// returns FR variant if available and non-empty, otherwise falls back to EN
	function tval(l: string, key: string): string {
		if (l === 'fr') {
			const fr = data.tut[`${key}_fr`];
			if (fr?.trim()) return fr;
		}
		return data.tut[key] ?? '';
	}

	const steps = $derived.by(() => {
		const l = $lang;
		return Array.from({ length: stepCount }, (_, i) => i + 1).map((n) => ({
			title:    tval(l, `tut_step${n}_title`),
			body:     tval(l, `tut_step${n}_body`),
			linkText: tval(l, `tut_step${n}_link_text`),
			linkUrl:  data.tut[`tut_step${n}_link_url`],
		}));
	});

	const faqs = $derived.by(() => {
		const l = $lang;
		return Array.from({ length: faqCount }, (_, i) => i + 1).map((n) => ({
			q: tval(l, `tut_faq${n}_q`),
			a: tval(l, `tut_faq${n}_a`),
		}));
	});
</script>

<h1>{tval($lang, 'tut_title')}</h1>
<p style="color:var(--text-light);margin-bottom:24px;">{tval($lang, 'tut_subtitle')}</p>

<div style="display:flex;flex-direction:column;gap:20px;">
	{#each steps as step}
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
			{#each faqs as faq}
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
