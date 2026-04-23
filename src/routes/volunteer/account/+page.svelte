<!-- account page — manage children + change password (server-side forms) -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let showAddChild = $state(false);
  let showLinkChild = $state(false);
</script>

<h1>My Account</h1>
<p style="color:var(--text-light);margin-bottom:24px;">
  Manage your children and account settings.
</p>
<p style="font-size: 48px; color:var(--text-light);margin-bottom:48px;">
  1 hour = ${data.donationRate}
</p>
<div class="grid-2">
  <!-- left column: children -->
  <div>
    <div
      style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;"
    >
      <h2>My Children</h2>
      <div style="display:flex;gap:6px;">
        <button
          class="btn btn-accent"
          style="font-size:0.85rem;padding:6px 14px;"
          onclick={() => {
            showLinkChild = !showLinkChild;
            showAddChild = false;
          }}
        >
          {showLinkChild ? "Cancel" : "Link Existing"}
        </button>
        <button
          class="btn btn-primary"
          style="font-size:0.85rem;padding:6px 14px;"
          onclick={() => {
            showAddChild = !showAddChild;
            showLinkChild = false;
          }}
        >
          {showAddChild ? "Cancel" : "+ New Child"}
        </button>
      </div>
    </div>

    {#if form?.success}
      <div
        class="card"
        style="background:#d4edda;border:1px solid #c3e6cb;margin-bottom:12px;"
      >
        <p style="color:#155724;">Child added successfully.</p>
      </div>
    {/if}
    {#if form?.unlinkSuccess}
      <div
        class="card"
        style="background:#d4edda;border:1px solid #c3e6cb;margin-bottom:12px;"
      >
        <p style="color:#155724;">Child unlinked.</p>
      </div>
    {/if}
    {#if form?.linkSuccess}
      <div
        class="card"
        style="background:#d4edda;border:1px solid #c3e6cb;margin-bottom:12px;"
      >
        <p style="color:#155724;">Child linked.</p>
      </div>
    {/if}
    {#if form?.error}
      <p class="error" style="margin-bottom:12px;">{form.error}</p>
    {/if}

    <!-- link existing child form -->
    {#if showLinkChild}
      <div class="card" style="margin-bottom:16px;">
        <h3>Link an Existing Child</h3>
        <p
          style="font-size:0.85rem;color:var(--text-light);margin-top:4px;margin-bottom:12px;"
        >
          If another guardian already added your child, select them here.
        </p>
        {#if data.allChildren.length === 0}
          <p style="color:var(--text-light);">
            No unlinked children available.
          </p>
        {:else}
          <form method="POST" action="?/linkChild" use:enhance>
            <div class="form-group">
              <label for="childId">Select Child</label>
              <select id="childId" name="childId" required>
                <option value="">-- Select --</option>
                {#each data.allChildren as child}
                  <option value={child.id}
                    >{child.firstName}
                    {child.lastName}{child.level ? ` (${child.level})` : ""} — {child.status ===
                    "tryout"
                      ? "Tryout"
                      : "Full Member"}</option
                  >
                {/each}
              </select>
            </div>
            <button type="submit" class="btn btn-accent" style="width:100%;"
              >Link Child</button
            >
          </form>
        {/if}
      </div>
    {/if}

    <!-- add new child form -->
    {#if showAddChild}
      <div class="card" style="margin-bottom:16px;">
        <h3>Add a New Child</h3>
        <form
          method="POST"
          action="?/addChild"
          use:enhance
          style="margin-top:12px;"
        >
          <div class="form-group">
            <label for="firstName">First Name</label><input
              id="firstName"
              name="firstName"
              type="text"
              required
            />
          </div>
          <div class="form-group">
            <label for="lastName">Last Name</label><input
              id="lastName"
              name="lastName"
              type="text"
              required
            />
          </div>
          <div class="form-group">
            <label for="level">Level</label><input
              id="level"
              name="level"
              type="text"
              placeholder="e.g. Beginner, Competitive"
            />
          </div>
          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" name="status"
              ><option value="full_member">Full Member (30 hrs/year)</option
              ><option value="tryout">Tryout (4 hrs)</option></select
            >
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;"
            >Add Child</button
          >
        </form>
      </div>
    {/if}

    <!-- linked children with progress -->
    {#if data.children.length === 0}
      <div class="card">
        <p style="color:var(--text-light);">No children linked yet.</p>
      </div>
    {/if}
    {#each data.children as child (child.id)}
      <div class="card" style="margin-bottom:12px;">
        <div
          style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:4px;"
        >
          <h3>{child.firstName} {child.lastName}</h3>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:0.85rem;color:var(--text-light);"
              >{child.status === "tryout"
                ? "Tryout"
                : "Full Member"}{#if child.level}
                &middot; {child.level}{/if}</span
            >
            <form
              method="POST"
              action="?/unlinkChild"
              use:enhance
              style="display:inline;"
            >
              <input type="hidden" name="childId" value={child.id} />
              <button
                type="submit"
                class="btn btn-danger"
                style="padding:2px 8px;font-size:0.75rem;"
                onclick={(e) => {
                  if (!confirm(`Unlink ${child.firstName}?`))
                    e.preventDefault();
                }}>Unlink</button
              >
            </form>
          </div>
        </div>
        <div class="progress-bar">
          <div
            class="progress-bar-fill"
            style="width:{Math.min(
              100,
              (child.totalHours / child.requiredHours) * 100,
            )}%;{child.totalHours >= child.requiredHours
              ? 'background:#58A4B0'
              : ''}"
          >
            {child.totalHours} / {child.requiredHours} hrs
          </div>
        </div>
        <p style="font-size:0.85rem;color:var(--text-light);margin-top:4px;">
          {#if child.totalHours >= child.requiredHours}Goal reached!{:else}{(
              child.requiredHours - child.totalHours
            ).toFixed(1)} hours remaining{/if}
        </p>
      </div>
    {/each}
  </div>

  <!-- right column: change password -->
  <div>
    <h2>Change Password</h2>
    <div class="card" style="margin-top:12px;">
      {#if form?.passwordSuccess}
        <div
          style="background:#d4edda;border:1px solid #c3e6cb;padding:12px;border-radius:8px;margin-bottom:12px;"
        >
          <p style="color:#155724;">Password changed.</p>
        </div>
      {/if}
      {#if form?.passwordError}<p class="error" style="margin-bottom:12px;">
          {form.passwordError}
        </p>{/if}
      <form method="POST" action="?/changePassword" use:enhance>
        <div class="form-group">
          <label for="currentPassword">Current Password</label><input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
          />
        </div>
        <div class="form-group">
          <label for="newPassword">New Password</label><input
            id="newPassword"
            name="newPassword"
            type="password"
            required
          />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;"
          >Change Password</button
        >
      </form>
    </div>
  </div>
</div>
