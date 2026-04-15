<!-- logout page — just a form that posts to the server action -->
<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<div style="padding: 40px; text-align: center;">
	<p>Click below to sign out.</p>
	<form method="POST" use:enhance>
		<button type="submit" class="btn btn-primary" style="margin-top:12px;">Sign Out</button>
	</form>
</div>
