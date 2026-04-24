<script lang="ts">
  import emailjs from "@emailjs/browser";
  import { singlestoreDatabase } from "drizzle-orm/singlestore-core";
   let { data } = $props(); //Imported data from server.ts

   const badEmails = data.badEmails;  //Bad emails as [] strings
   const volunteers = data.volunteers;
//Call init
  (function () {
    emailjs.init({
      publicKey: "InRSRMYq3D8DEYnU9",
    });
  })();


//Service provider functions. I don't know what it is and what it does---DO NOT TOUCH uncommented lines
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

  //Parameters seperated


  let messageParams = $state({
    // Parameters defined in the template
    subject: "Morning!",
    name: "Kelp",
    message: "I send you a message!",
    time: 2008,
    recipient: "liuzilin375@gmail.com",
  });

  //FInd Matches
  async function Prompt(input: string) {
  const q = input.toLowerCase().trim();

  const results = volunteers
    .filter(v => {
      const fullName = `${v.first_name} ${v.last_name}`.toLowerCase();
      const initials = `${v.first_name[0]}${v.last_name[0]}`.toLowerCase();
      const email = v.email.toLowerCase();

      return (
        fullName.includes(q) ||
        email.includes(q) ||
        initials === q
      );
    })
    .map(v => ({
      name: `${v.first_name} ${v.last_name}`,
      email: v.email
    }));

  return results;
}



  //Email logics
  function SendEmail(params: any) {
    emailjs.send("service_tni7nrg", "template_s341t4v", params).then(
      (response) => {
        console.log("SUCCESS!", response.status, response.text);
      },
      (error) => {
        console.log("FAILED...", error);
      },
    );
  }

  function selectGroup(group: number){
    switch (group) {
      case 2: loadGroup(badEmails)
      defualt: break;
  }
}
function loadGroup(emails: string[]) {
  // To array, split by comma
  const existing = messageParams.recipient
    ? messageParams.recipient.split(",").map(e => e.trim())
    : [];

  // combine to kill duplicates via a Set
  const combined = [...new Set([...existing, ...emails])];

  messageParams.recipient = combined.join(", ");
}



  
    

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let selected = $state();
  selected = "message";

  function select(option: string) {
    selected = option;
  }
</script>

<div class="top-toggle">
  <div class="toggle-container">
    <button
      class="toggle-option"
      class:active={selected === "message"}
      onclick={() => select("message")}
    >
      Message
    </button>
    <button
      class="toggle-option"
      class:active={selected === "reminder"}
      onclick={() => select("reminder")}
    >
      Reminder
    </button>
  </div>
</div>

{#if selected === "message"}
  <div>
    <label for="recipient">Recipient</label>
    <input type="text" id="recipient" bind:value={messageParams.recipient} />

    <div class="group-select">
  <label>Select Group</label>

  <div class="group-buttons">
    <button class="group-btn">All Volunteers</button>
    <button class="group-btn" onclick={() => selectGroup(2)}>Under Criteria</button>
    <button class="group-btn">Custom Group</button>
  </div>
</div>

    <textarea
      rows="8"
      placeholder="Type your message here..."
      bind:value={messageParams.message}
      style="width: 100%; padding: 0.5rem; font-size: 1rem; resize: vertical;"
    ></textarea>

    <button onclick={() => SendEmail(messageParams)}>Send Email</button>
  </div>
{:else if selected === "reminder"}
  <div>
    <label for="recipient">Recipient</label>
    <input type="text" id="recipient" bind:value={messageParams.recipient} />
    <button onclick={() => SendEmail(messageParams)}>Send Email</button>
  </div>

  <div class="group-select">
  <label>Select Group</label>

  <div class="group-buttons">
    <button class="group-btn">All Volunteers</button>
    <button class="group-btn" onclick={() => selectGroup(2)}>Under Criteria</button>
    <button class="group-btn">Custom Group</button>
  </div>
</div>
{/if}


<pre>{JSON.stringify(data, null, 2)}</pre>
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
</style>
