<!-- shown when the user has no internet connection (if we add PWA/service worker later) -->
<script lang="ts">
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';
</script>

<h1>{t[$lang].offline}</h1>
<p>{t[$lang].offlineMsg}</p>
