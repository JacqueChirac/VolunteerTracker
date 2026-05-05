<!-- log hours page — volunteer logs hours or donations -->
<script lang="ts">
  import { today, daysAgo } from "$lib/dateBounds";

  import { enhance } from "$app/forms";
  import type { PageData, ActionData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let tab = $state<"volunteering" | "donation">("volunteering");
  const dateMax = today();
  const dateMin = daysAgo(365); //Can't log events more than a year ago
</script>

<h1>Log Hours</h1>
<p style="color:var(--text-light);margin-bottom:24px;">
  Log your volunteer hours or donations.
</p>

{#if form?.success}
  <div
    class="card"
    style="background:#d4edda;border:1px solid #c3e6cb;margin-bottom:16px;"
  >
    <p style="color:#155724;">{form.message}</p>
  </div>
{/if}
{#if form?.error}<p class="error" style="margin-bottom:16px;">
    {form.error}
  </p>{/if}

<div class="grid-2">
  <!-- left: log form -->
  <div class="card">
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button
        class="btn {tab === 'volunteering' ? 'btn-primary' : 'btn-outline'}"
        style="flex:1;text-align:center;"
        onclick={() => (tab = "volunteering")}>Log Hours</button
      >
      <button
        class="btn {tab === 'donation' ? 'btn-primary' : 'btn-outline'}"
        style="flex:1;text-align:center;"
        onclick={() => (tab = "donation")}>Log Donation</button
      >
    </div>

    //Log events with date constraints
    {#if tab === "volunteering"}
      <form method="POST" action="?/volunteering" use:enhance>
        <div class="form-group">
          <label for="event">Event (optional)</label>
          <select
            id="event"
            name="eventId"
            onchange={(e) => {
              const ev = data.myEvents.find(
                (x) => x.id === Number(e.currentTarget.value),
              );
              if (ev)
                (document.getElementById("date") as HTMLInputElement).value =
                  ev.date;
            }}
          >
            <option value="">— Other / general hours —</option>
            {#each data.myEvents as ev}
              <option value={ev.id}>{ev.date} — {ev.title}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label for="date">Date</label><input
            id="date"
            name="date"
            type="date"
            required
            value={dateMax}
            min={dateMin}
            max={dateMax}
          />
        </div>
        <div class="form-group">
          <label for="hours">Hours</label><input
            id="date"
            name="date"
            type="date"
            required
            value={dateMax}
            min={dateMin}
            max={dateMax}
          />
        </div>
        <div class="form-group">
          <label for="notes">Notes (optional)</label><textarea
            id="notes"
            name="notes"
            rows="2"
          ></textarea>
        </div>
        <button type="submit" class="btn btn-accent" style="width:100%;"
          >Log Hours</button
        >
      </form>
    {:else}
      <form method="POST" action="?/donation" use:enhance>
        <p
          style="font-size:0.85rem;color:var(--text-light);margin-bottom:12px;"
        >
          Rate: ${data.donationRate} = 1 volunteer hour
        </p>
        <div class="form-group">
          <label for="date2">Date</label><input
            id="date2"
            name="date"
            type="date"
            required
            value={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div class="form-group">
          <label for="amount">Amount ($)</label><input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="1"
            required
          />
        </div>
        <div class="form-group">
          <label for="notes2">Notes (optional)</label><textarea
            id="notes2"
            name="notes"
            rows="2"
          ></textarea>
        </div>
        <button type="submit" class="btn btn-accent" style="width:100%;"
          >Log Donation</button
        >
      </form>
    {/if}
  </div>

  <!-- right: recent history -->
  <div>
    <h2>Recent Contributions</h2>
    {#if data.contributions.length === 0}
      <div class="card" style="margin-top:12px;">
        <p style="color:var(--text-light);">No contributions logged yet.</p>
      </div>
    {:else}
      <div class="table-wrap" style="margin-top:12px;">
        <table>
          <thead
            ><tr
              ><th>Date</th><th>Type</th><th>Hours</th><th>Notes</th><th
              ></th></tr
            ></thead
          >
          <tbody>
            {#each data.contributions as c (c.id)}
              <tr>
                <td>{c.date}</td>
                <td>{c.type === "donation" ? `$${c.amount}` : "Vol"}</td>
                <td>{c.hours}h</td>
                <td
                  style="max-width:120px;overflow:hidden;text-overflow:ellipsis;"
                  >{c.notes ?? "-"}</td
                >
                <td>
                  <form
                    method="POST"
                    action="?/deleteContribution"
                    use:enhance
                    style="display:inline;"
                  >
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      class="btn btn-danger"
                      style="padding:2px 8px;font-size:0.75rem;"
                      onclick={(e) => {
                        if (!confirm("Delete?")) e.preventDefault();
                      }}>Delete</button
                    >
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
