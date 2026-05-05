<!-- account page — manage children + change password (server-side forms) -->
<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageData, ActionData } from "./$types";
	// For swim team level dropdown when creating child
  import { swimLevels } from "$lib/swimLevels";
  import { lang } from '$lib/stores/lang';
  import { t } from '$lib/i18n';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let showAddChild = $state(false);
  let showLinkChild = $state(false);
  let showLevelDetails = $state(false);
</script>

<h1>{t[$lang].myAccount}</h1>
<p style="color:var(--text-light);margin-bottom:24px;">
  {t[$lang].myAccountSubtitle}
</p>

<!-- Display conversion rate between money and hours  -->
<p style="font-size: 48px; color:var(--text-light);margin-bottom:48px;">
  {t[$lang].conversionRate(data.donationRate)}
</p>
<div class="grid-2">
  <!-- left column: children -->
  <div>
    <div
      style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;"
    >
      <!-- Handles button click besides "My children" -->
      <h2>{t[$lang].myChildren}</h2>
      <div style="display:flex;gap:6px;">
        <button
          class="btn btn-accent"
          style="font-size:0.85rem;padding:6px 14px;"
          onclick={() => {
            showLinkChild = !showLinkChild;
            showAddChild = false;
          }}
          // If user press on showLinkCHild display cancel other display link existing, same below
        >
          {showLinkChild ? t[$lang].cancel : t[$lang].linkExisting}
        </button>
        <button
          class="btn btn-primary"
          style="font-size:0.85rem;padding:6px 14px;"
          onclick={() => {
            showAddChild = !showAddChild;
            showLinkChild = false;
          }}
        >
          {showAddChild ? t[$lang].cancel : t[$lang].newChild}
        </button>
      </div>
    </div>

    {#if form?.success}
      <div
        class="card"
        style="background:#d4edda;border:1px solid #c3e6cb;margin-bottom:12px;"
      >
        <p style="color:#155724;">{t[$lang].childAddedSuccess}</p>
      </div>
    {/if}
		<!-- If unlinkSuccess in server.ts is true then display "child unlinked" -->
    {#if form?.unlinkSuccess}
      <div
        class="card"
        style="background:#d4edda;border:1px solid #c3e6cb;margin-bottom:12px;"
      >
        <p style="color:#155724;">{t[$lang].childUnlinked}</p>
      </div>
    {/if}
    {#if form?.linkSuccess}
      <div
        class="card"
        style="background:#d4edda;border:1px solid #c3e6cb;margin-bottom:12px;"
      >
        <p style="color:#155724;">{t[$lang].childLinked}</p>
      </div>
    {/if}
    {#if form?.error}
      <p class="error" style="margin-bottom:12px;">{form.error}</p>
    {/if}

    <!-- link existing child form -->
    {#if showLinkChild}
      <div class="card" style="margin-bottom:16px;">
        <h3>{t[$lang].linkExistingChild}</h3>
        <p
          style="font-size:0.85rem;color:var(--text-light);margin-top:4px;margin-bottom:12px;"
        >
          {t[$lang].linkExistingChildDesc}
        </p>
        {#if data.allChildren.length === 0}
          <p style="color:var(--text-light);">
            {t[$lang].noUnlinkedChildren}
          </p>
        {:else}
          <form method="POST" action="?/linkChild" use:enhance>
            <div class="form-group">
              <label for="childId">{t[$lang].selectChild}</label>
              <select id="childId" name="childId" required>
                <option value="">{t[$lang].selectChildOption}</option>
                {#each data.allChildren as child}
                  <option value={child.id}
                    >{child.firstName}
                    {child.lastName}{child.level ? ` (${child.level})` : ""} — {child.status ===
                    "tryout"
                      ? t[$lang].tryoutStatus
                      : t[$lang].fullMemberStatus}</option
                  >
                {/each}
              </select>
            </div>
            <button type="submit" class="btn btn-accent" style="width:100%;"
              >{t[$lang].linkChildBtn}</button
            >
          </form>
        {/if}
      </div>
    {/if}

    <!-- add new child form -->
    {#if showAddChild}
      <div class="card" style="margin-bottom:16px;">
        <h3>{t[$lang].addNewChild}</h3>
        <form
          method="POST"
          action="?/addChild"
          use:enhance
          style="margin-top:12px;"
        >
          <div class="form-group">
            <label for="firstName">{t[$lang].firstNameField}</label><input
              id="firstName"
              name="firstName"
              type="text"
              required
            />
          </div>
          <div class="form-group">
            <label for="lastName">{t[$lang].lastNameField}</label><input
              id="lastName"
              name="lastName"
              type="text"
              required
            />
          </div>
          <div class="form-group">
            <label for="level">{t[$lang].levelField}</label>
            <select id="level" name="level">
              <option value="">{t[$lang].selectLevelOption}</option>
              {#each swimLevels as lvl}
                <option value={lvl.value}>{lvl.name}</option>
              {/each}
            </select>
            <button
              type="button"
              style="background:none;border:none;color:var(--primary);cursor:pointer;font-size:0.8rem;padding:4px 0;text-align:left;"
              onclick={() => (showLevelDetails = !showLevelDetails)}
            >
              {showLevelDetails ? t[$lang].hideDetails : t[$lang].moreDetails}
            </button>
            {#if showLevelDetails}
              <div
                style="margin-top:8px;font-size:0.8rem;color:var(--text-light);max-height:300px;overflow-y:auto;"
              >
							<!-- Options for level come from swimLevels file under lib -->
                {#each swimLevels as lvl}
                  <p style="margin-bottom:8px;">
                    <strong>{lvl.name}</strong> — {lvl.description}
                  </p>
                {/each}
              </div>
            {/if}
          </div>
          <div class="form-group">
            <label for="status">{t[$lang].statusField}</label>
            <select id="status" name="status"
              ><option value="full_member">{t[$lang].fullMemberHours}</option
              ><option value="tryout">{t[$lang].tryoutHours}</option></select
            >
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;"
            >{t[$lang].addChildSubmit}</button
          >
        </form>
      </div>
    {/if}

    <!-- linked children with progress -->
    {#if data.children.length === 0}
      <div class="card">
        <p style="color:var(--text-light);">{t[$lang].noChildrenLinkedYet}</p>
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
                ? t[$lang].tryoutStatus
                : t[$lang].fullMemberStatus}{#if child.level}
                &middot; {child.level}{/if}</span
            >
            <form
              method="POST"
              action="?/unlinkChild"
              use:enhance
              style="display:inline;"
            >
						<!-- Auto loads child ID in the unlink form -->
              <input type="hidden" name="childId" value={child.id} />
							<!-- Confirm before unlink child -->
              <button
                type="submit"
                class="btn btn-danger"
                style="padding:2px 8px;font-size:0.75rem;"
                onclick={(e) => {
                  if (!confirm(t[$lang].unlinkConfirm(child.firstName)))
                    e.preventDefault();
                }}>{t[$lang].unlink}</button
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
          {#if child.totalHours >= child.requiredHours}{t[$lang].goalReached}{:else}{t[$lang].hoursRemaining((child.requiredHours - child.totalHours).toFixed(1))}{/if}
        </p>
      </div>
    {/each}
  </div>

  <!-- right column: change password -->
  <div>
    <h2>{t[$lang].changePassword}</h2>
    <div class="card" style="margin-top:12px;">
      {#if form?.passwordSuccess}
        <div
          style="background:#d4edda;border:1px solid #c3e6cb;padding:12px;border-radius:8px;margin-bottom:12px;"
        >
          <p style="color:#155724;">{t[$lang].passwordChanged}</p>
        </div>
      {/if}
      {#if form?.passwordError}<p class="error" style="margin-bottom:12px;">
          {form.passwordError}
        </p>{/if}
      <form method="POST" action="?/changePassword" use:enhance>
        <div class="form-group">
          <label for="currentPassword">{t[$lang].currentPassword}</label><input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
          />
        </div>
        <div class="form-group">
          <label for="newPassword">{t[$lang].newPassword}</label><input
            id="newPassword"
            name="newPassword"
            type="password"
            required
          />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;"
          >{t[$lang].changePasswordBtn}</button
        >
      </form>
    </div>
  </div>
</div>
