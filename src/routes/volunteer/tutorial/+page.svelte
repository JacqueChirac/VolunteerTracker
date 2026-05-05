<!-- tutorial page — step-by-step guide for new volunteers -->
<script lang="ts">
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';
</script>

<h1>{t[$lang].tutorialTitle}</h1>
<p style="color:var(--text-light);margin-bottom:24px;">
	{t[$lang].tutorialSubtitle}
</p>

<div style="display:flex;flex-direction:column;gap:20px;">
	<div class="card">
		<h2>{t[$lang].step1Title}</h2>
		<p>
			{t[$lang].step1Body} <a href="/volunteer/account">{t[$lang].step1MyAccount}</a> {t[$lang].step1And}
			<strong>{t[$lang].step1NewChild}</strong>{t[$lang].step1Desc}
		</p>
		<ul style="margin-top:8px;margin-left:20px;">
			<li><strong>{t[$lang].step1FullMember}</strong> {t[$lang].step1FullMemberDesc}</li>
			<li><strong>{t[$lang].step1Tryout}</strong> {t[$lang].step1TryoutDesc}</li>
		</ul>
		<p style="margin-top:8px;">
			{t[$lang].step1MultiGuardian}
		</p>
	</div>

	<div class="card">
		<h2>{t[$lang].step2Title}</h2>
		<p>
			{t[$lang].step2Body} <a href="/volunteer/events">{t[$lang].step2Events}</a> {t[$lang].step2Desc} <strong>{t[$lang].step2SignUp}</strong> {t[$lang].step2Desc2}
		</p>
		<p style="margin-top:8px;">{t[$lang].step2Cancel}</p>
	</div>

	<div class="card">
		<h2>{t[$lang].step3Title}</h2>
		<p>
			{t[$lang].step3Body} <a href="/volunteer/log">{t[$lang].step3Log}</a> {t[$lang].step3And}
			<strong>{t[$lang].step3LogVol}</strong>.
		</p>
		<ul style="margin-top:8px;margin-left:20px;">
			<li>{t[$lang].step3List1}</li>
			<li>{t[$lang].step3List2}</li>
			<li>{t[$lang].step3List3}</li>
			<li>{t[$lang].step3List4}</li>
		</ul>
		<p style="margin-top:8px;">
			{t[$lang].step3Trust}
		</p>
	</div>

	<div class="card">
		<h2>{t[$lang].step4Title}</h2>
		<p>
			{t[$lang].step4Body} <a href="/volunteer/log">{t[$lang].step4Log}</a> {t[$lang].step4And} <strong>{t[$lang].step4LogDon}</strong>.
		</p>
		<p style="margin-top:8px;">
			{t[$lang].step4Rate}
		</p>
	</div>

	<div class="card">
		<h2>{t[$lang].step5Title}</h2>
		<p>
			{t[$lang].step5Body} <a href="/volunteer/account">{t[$lang].step5Account}</a> {t[$lang].step5Desc}
		</p>
		<p style="margin-top:8px;">
			{t[$lang].step5Multi} <strong>{t[$lang].step5All}</strong> {t[$lang].step5MultiEnd}
		</p>
	</div>

	<!-- FAQ section -->
	<div class="card" style="background:var(--bg);border:2px solid var(--border);">
		<h2>{t[$lang].faqTitle}</h2>
		<div style="margin-top:12px;">
			<p><strong>{t[$lang].faq1Q}</strong></p>
			<p style="color:var(--text-light);">
				{t[$lang].faq1A}
			</p>
		</div>
		<div style="margin-top:16px;">
			<p><strong>{t[$lang].faq2Q}</strong></p>
			<p style="color:var(--text-light);">
				{t[$lang].faq2A}
			</p>
		</div>
		<div style="margin-top:16px;">
			<p><strong>{t[$lang].faq3Q}</strong></p>
			<p style="color:var(--text-light);">
				{t[$lang].faq3A}
			</p>
		</div>
		<div style="margin-top:16px;">
			<p><strong>{t[$lang].faq4Q}</strong></p>
			<p style="color:var(--text-light);">
				{t[$lang].faq4A}
			</p>
		</div>
		<div style="margin-top:16px;">
			<p><strong>{t[$lang].faq5Q}</strong></p>
			<p style="color:var(--text-light);">
				{t[$lang].faq5A}
			</p>
		</div>
	</div>
</div>
