<!-- logout page — just a form that posts to the server action -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { lang } from '$lib/stores/lang';
	import { t } from '$lib/i18n';
</script>

<div style="padding: 40px; text-align: center;">
	<p>{t[$lang].clickToSignOut}</p>
	<form method="POST" use:enhance>
		<button type="submit" class="btn btn-primary" style="margin-top:12px;">{t[$lang].signOut}</button>
	</form>
</div>
