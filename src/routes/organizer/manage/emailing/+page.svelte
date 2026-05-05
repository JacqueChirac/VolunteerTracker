<script lang="ts">
  //Imports
  import emailjs from "@emailjs/browser";
  import { singlestoreDatabase } from "drizzle-orm/singlestore-core";
  import { lang } from '$lib/stores/lang';
  import { t } from '$lib/i18n';

  let { data } = $props(); //Imported data from server.ts

  //Variables Declare
  const badEmails = $derived(data.badEmails); //Bad emails as [] strings
  const allMails = data.allMails; //All emails as [] strings
  const allNames = data.allNames; //All names as [] strings
  const volunteers = $derived(data.volunteers);
  let selected = $state("message");
  let messageParams = $state({
    // Parameters defined in the template
    subject: "Morning!",
    name: "Kelp",
    message: "I send you a message!",
    time: 2008,
    recipient: "liuzilin375@gmail.com",
  });
  let inputElement: HTMLInputElement;
  let focus = $state(0);

  let wordSelected = $derived.by(() => {
    const text = messageParams.recipient;
    const cursor = focus;
    const start = text.lastIndexOf(",", cursor - 1) + 1;
    const endIndex = text.indexOf(",", cursor);
    const end = endIndex === -1 ? text.length : endIndex;
    return text.slice(start, end).trim();
  });

  let recipientPrompted = $derived.by(() => {
    const keyword = (wordSelected ?? "").toLowerCase().trim();
    if (!keyword) return [];
    let candidateIDs = [];
    for (let i = 0; i < data.allMails.length; i++) {
      if (data.allMails[i].toLowerCase().includes(keyword)) {
        candidateIDs.push(i);
        continue;
      }
      if (data.allNames[i].toLowerCase().includes(keyword)) {
        candidateIDs.push(i);
      }
    }

    return candidateIDs;
  });

  let promptWord = $derived.by(() => {
    const text = messageParams.recipient;
    const cursor = inputElement?.selectionStart ?? 0;

    const start = text.lastIndexOf(",", cursor - 1) + 1;

    const endIndex = text.indexOf(",", cursor);
    const end = endIndex === -1 ? text.length : endIndex;

    const word = text.slice(start, end).trim();

    return word;
  });

  //Service provider functions.
  (function () {
    emailjs.init({
      publicKey: "InRSRMYq3D8DEYnU9",
    });
  })();

  function init() {
    emailjs.init({
      publicKey: "InRSRMYq3D8DEYnU9",
      blockHeadless: true,
      blockList: {
        list: [], // Blocklist
        watchVariable: "userEmail",
      },
      limitRate: {
        id: "app",
        throttle: 3000, // Cool down in ms
      },
    });
  }

  //Page logic
  function select(option: string) {
    selected = option;
  }

  //Autofill logic (Quality of life)
  function updateCursorPosition() {
    focus = inputElement?.selectionStart ?? 0;
  }

  let showDropdown = $state(false);

  function handleInput() {
    updateCursorPosition();
    if (messageParams.recipient.trim().length > 0) {
      showDropdown = true;
    } else {
      showDropdown = false;
    }
  }

  function handleClick() {
    updateCursorPosition();
    showDropdown = true;
  }

  function selectRecipient(list: number[], index: number) {
    const text = messageParams.recipient;
    const cursor = focus;
    const start = text.lastIndexOf(",", cursor - 1) + 1;
    const endIndex = text.indexOf(",", cursor);
    const end = endIndex === -1 ? text.length : endIndex;
    const firstPart = text.slice(0, start);
    const middlePart = allMails[list[index]];
    const lastPart = text.slice(end);
    if (lastPart)
      messageParams.recipient = firstPart + middlePart + ", " + lastPart;
    else messageParams.recipient = firstPart + middlePart;
    showDropdown = false;
  }

  //Email logics
  function SendEmail(params: any) {
    if (selected === "message") {
      emailjs.send("service_tni7nrg", "template_s341t4v", params).then(
        (response) => {
          console.log("SUCCESS!", response.status, response.text);
        },
        (error) => {
          console.log("FAILED...", error);
        },
      );
    }
  }

  //!Unfishied
  //   else {
  //       emailjs.send("service_tni7nrg", "newTemplate", newParams).then(
  //     (response) => {
  //       console.log("SUCCESS!", response.status, response.text);
  //     },
  //     (error) => {
  //       console.log("FAILED...", error);
  //     },
  //   );
  //   }
  // }

  function selectGroup(group: number) {
    switch (group) {
      case 1:
        loadGroup(allMails);
      case 2:
        loadGroup(badEmails);
      case 3:
        break;
        defualt: break;
    }
  }

  function loadGroup(emails: string[]) {
    // To array, split by comma
    const existing = messageParams.recipient
      ? messageParams.recipient.split(",").map((e) => e.trim())
      : [];

    // combine to kill duplicates via a Set
    const combined = [...new Set([...existing, ...emails])];
    messageParams.recipient = combined.join(", ");
  }
</script>

<div class="top-toggle">
  <div class="toggle-container">
    <button
      class="toggle-option"
      class:active={selected === "message"}
      onclick={() => select("message")}
    >
      {t[$lang].message}
    </button>
    <button
      class="toggle-option"
      class:active={selected === "reminder"}
      onclick={() => select("reminder")}
    >
      {t[$lang].reminder}
    </button>
  </div>
</div>

<div>
  <label for="recipient">{t[$lang].recipient}</label>

  <!-- Autofill Suggestions -->
  <div class="recipient-wrapper">
    <input
      class="recipient-input"
      type="text"
      autocomplete="off"
      id="recipient"
      bind:value={messageParams.recipient}
      bind:this={inputElement}
      oninput={handleInput}
      onclick={handleClick}
    />

    <div class="dropdown-wrapper">
      <!-- your input or trigger element here -->

      {#if showDropdown === true && recipientPrompted.length > 0}
        {@render promptList(recipientPrompted)}
      {/if}
    </div>
  </div>

  <div class="group-select">
    <h4>{t[$lang].quickSelect}</h4>

    <div class="group-buttons">
      <button class="group-btn" onclick={() => selectGroup(1)}
        >{t[$lang].allVolunteers}</button
      >
      <button class="group-btn" onclick={() => selectGroup(2)}
        >{t[$lang].underCriteria}</button
      >
      <button class="group-btn">{t[$lang].customGroup}</button>
      <button class="group-btn">{t[$lang].clearAll}</button>
    </div>
  </div>

  {#if selected === "message"}
    <textarea
      rows="8"
      placeholder={t[$lang].typeMessageHere}
      bind:value={messageParams.message}
      style="width: 100%; padding: 0.5rem; font-size: 1rem; resize: vertical;"
    ></textarea>
  {/if}
  <button onclick={() => SendEmail(messageParams)}>{t[$lang].sendEmail}</button>
</div>

<pre> {focus}, {wordSelected}  </pre>

<pre> {recipientPrompted}  </pre>

<pre> {allNames[recipientPrompted[0]]}  </pre>

<pre> {allMails[recipientPrompted[0]]}  </pre>

{#snippet promptList(storedPrompts: number[])}
  <div class="dropdown">
    <div class="dropdown-header">
      <span>{t[$lang].suggestions}</span>
      <button
        type="button"
        class="close-btn"
        onclick={() => (showDropdown = false)}
      >
        ×
      </button>
    </div>

    <div class="dropdown-list">
      {#each Array(6) as _, i}
        {#if storedPrompts.length >= i}
          {@render promptBox({ order: i, storedPrompts })}
        {/if}
      {/each}
    </div>
  </div>
{/snippet}

{#snippet promptBox({
  order,
  storedPrompts,
}: {
  order: number;
  storedPrompts: number[];
})}
  <article>
    <button
      type="button"
      class="dropdown-item"
      onclick={() => selectRecipient(storedPrompts, order)}
    >
      <div class="name">{data.allNames[storedPrompts[order]]}</div>
      <div class="email">{data.allMails[storedPrompts[order]]}</div>
    </button>
  </article>
{/snippet}

<style>
  .top-toggle {
    width: 100%;
    background: transparent;
    padding: 10px 0;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .toggle-container {
    max-width: 92%;
    margin: 0 auto;
    display: flex;
    background: rgba(30, 30, 30, 0.85); /* subtle dark with transparency */
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 9999px;
    padding: 5px;
    width: 100%;
    max-width: 420px; /* limits overall width while allowing buttons to grow */
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
  }

  .toggle-option {
    flex: 1 1 40%; /* Takes about 40% each */
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #ccc;
    background: transparent;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.25s ease;
    text-align: center;
    margin: 0 3px;
  }

  .toggle-option:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.08);
  }

  .toggle-option.active {
    background: #3b82f6;
    color: white;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
  }

  .dropdown-wrapper {
    position: relative;
  }

  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1000;

    width: 40%;
    min-width: 260px;

    background: #fff;
    border: 1px solid #e6e6e6;
    border-radius: 6px;
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);

    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    padding: 8px 10px;

    border-bottom: 1px solid #eee;
    background: #fff;

    position: sticky;
    top: 0;
    z-index: 2;
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 16px;
    cursor: pointer;
    line-height: 1;
    opacity: 0.7;
  }

  .close-btn:hover {
    opacity: 1;
  }

  .dropdown-list {
    display: flex;
    flex-direction: column;

    max-height: 220px;
    overflow-y: auto;
  }

  .dropdown-item {
    width: 100%;
    padding: 8px 10px;

    display: flex;
    flex-direction: column;
    align-items: flex-start;

    text-align: left;
    cursor: pointer;

    border: none;
    background: transparent;
  }

  .dropdown-item:hover {
    background: #f5f5f5;
  }

  .name {
    font-size: 14px;
    line-height: 1.2;
  }

  .email {
    font-size: 12px;
    line-height: 1.2;
    opacity: 0.6;
  }
</style>
