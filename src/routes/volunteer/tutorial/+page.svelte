<!-- tutorial page — step-by-step guide for new volunteers -->
<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const steps = [1, 2, 3, 4, 5].map((n) => ({
		title: data.tut[`tut_step${n}_title`],
		body: data.tut[`tut_step${n}_body`],
		linkText: data.tut[`tut_step${n}_link_text`],
		linkUrl: data.tut[`tut_step${n}_link_url`],
	}));

	const faqs = [1, 2, 3, 4].map((n) => ({
		q: data.tut[`tut_faq${n}_q`],
		a: data.tut[`tut_faq${n}_a`],
	}));
</script>

<h1>{data.tut.tut_title}</h1>
<p style="color:var(--text-light);margin-bottom:24px;">{data.tut.tut_subtitle}</p>

<div style="display:flex;flex-direction:column;gap:20px;">
	{#each steps as step, i}
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
		<h2>{data.tut.tut_faq_title}</h2>
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
