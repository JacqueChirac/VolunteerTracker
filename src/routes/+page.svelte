<!-- landing page — shows login buttons or a dashboard link -->
<script lang="ts">
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<div class="landing">
  <div class="landing-content">
    <img src="/CPWD.png" alt="CPWD Swim Team" class="team-logo" />
    <h1>Volunteer Tracker</h1>
    <p>Track volunteer hours, donations, and events for your organization.</p>
    <p class="subtitle">Click the appropriate login to get started.</p>

    {#if data.user}
      <div class="logged-in">
        <p>Welcome back, {data.user.firstName}!</p>
        {#if data.user.role === "volunteer"}
          <a href="/volunteer" class="btn btn-primary">Go to Dashboard</a>
        {:else}
          <a href="/organizer" class="btn btn-primary">Go to Dashboard</a>
        {/if}
      </div>
    {:else}
      <div class="login-options">
        <a href="/login" class="btn btn-primary login-card">
          <span class="login-label">Login</span>
        </a>
      </div>

      <p class="register-link">
        New volunteer? <a href="/register">Create an account</a>
      </p>
    {/if}
  </div>
</div>

<style>
  .landing {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a5276 0%, #2980b9 100%);
    color: white;
    text-align: center;
    padding: 20px;
  }
  .landing-content {
    max-width: 520px;
  }
  .team-logo {
    width: 200px;
    margin-bottom: 20px;
  }
  h1 {
    font-size: 2.2rem;
    margin-bottom: 12px;
  }
  p {
    font-size: 1.1rem;
    opacity: 0.9;
  }
  .subtitle {
    font-size: 0.95rem;
    opacity: 0.7;
    margin-bottom: 36px;
  }
  .login-options {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .login-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 40px;
    border-radius: 12px;
    font-size: 1rem;
    text-decoration: none;
    transition: transform 0.2s;
  }
  .login-card:hover {
    transform: translateY(-2px);
    text-decoration: none;
  }
  .login-label {
    font-weight: 600;
  }
  .register-link {
    font-size: 0.9rem;
    opacity: 0.8;
  }
  .register-link a {
    color: white;
    text-decoration: underline;
  }
  .logged-in {
    margin-top: 24px;
  }
  .logged-in p {
    margin-bottom: 16px;
    font-size: 1.2rem;
  }
  .logged-in .btn {
    background: white;
    color: #1a5276;
  }
</style>
