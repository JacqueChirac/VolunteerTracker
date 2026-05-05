<!-- login page — uses SvelteKit form actions (server-side) -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ActionData } from "./$types";
  import { page } from "$app/state";
	import { dev } from '$app/environment';


  let { form }: { form: ActionData } = $props();
</script>

<div class="login-page">
  <div class="login-box card">
    {#if form?.error}
      <p class="error" role="alert" aria-live="assertive">{form.error}</p>
    {/if}

    <form method="POST" use:enhance>
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form?.email ?? ""}
          required
        />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" required />
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%"
        >Login</button
      >
    </form>
    {#if dev}
      <div style="margin-top:24px;padding-top:16px;border-top:1px dashed #999;">
        <p
          style="font-size:0.8rem;color:var(--text-light);text-align:center;margin-bottom:8px;"
        >
          Dev shortcuts (auto-removed in prod)
        </p>
        <form method="POST" action="?/devLogin" use:enhance>
          <input type="hidden" name="as" value="volunteer" />
          <button
            type="submit"
            class="btn btn-outline"
            style="width:100%;margin-bottom:6px;"
          >
            Login as Volunteer (Raymond)
          </button>
        </form>
        <form method="POST" action="?/devLogin" use:enhance>
          <input type="hidden" name="as" value="organizer" />
          <button type="submit" class="btn btn-outline" style="width:100%;">
            Login as Admin
          </button>
        </form>
      </div>
    {/if}

    <div class="links">
      <a href="/register">Create an account</a>
      <a href="/">Back to home</a>
    </div>
  </div>
</div>

<style>
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #a9bcd0 0%, #58a4b0 50%, #373f51 100%);
    padding: 20px;
  }
  .login-box {
    width: 100%;
    max-width: 400px;
  }
  h2 {
    margin-bottom: 20px;
    text-align: center;
  }
  .links {
    margin-top: 16px;
    text-align: center;
    display: flex;
    justify-content: center;
    gap: 16px;
    font-size: 0.9rem;
  }
</style>
