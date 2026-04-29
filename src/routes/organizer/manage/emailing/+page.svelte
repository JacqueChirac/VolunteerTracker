<script lang="ts">
//Imports
  import emailjs from "@emailjs/browser";
  import { singlestoreDatabase } from "drizzle-orm/singlestore-core";
  let { data } = $props(); //Imported data from server.ts

//Variables Declare
   const badEmails = $derived(data.badEmails);  //Bad emails as [] strings
   const allMails = $derived(data.allMails);  //All emails as [] strings
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

function handleClick(): void {
	updateCursorPosition();
  
}

function handleInput(): void {
	updateCursorPosition();
}

function findMatch(): string[] {
	const query = (wordSelected ?? "").toLowerCase().trim();
	if (!query) return [];

	const list = [...(data.allMails ?? []), ...(data.allNames ?? [])];

	return list.filter(item =>
		item.toLowerCase().includes(query)
	);
}

function findWord() {
	const text = messageParams.recipient;
	const cursor = inputElement?.selectionStart ?? 0;

	const start = text.lastIndexOf(",", cursor - 1) + 1;

	const endIndex = text.indexOf(",", cursor);
	const end = endIndex === -1 ? text.length : endIndex;

	const word = text.slice(start, end).trim();

	wordSelected = word;
	return word;
}






  //Email logics
  function SendEmail(params: any) {
    if(selected==="message"){
    emailjs.send("service_tni7nrg", "template_s341t4v", params).then(
      (response) => {
        console.log("SUCCESS!", response.status, response.text);
      },
      (error) => {
        console.log("FAILED...", error);
      },
    );
    }

    //!Unfishied
    else {
        emailjs.send("service_tni7nrg", "newTemplate", newparams).then(
      (response) => {
        console.log("SUCCESS!", response.status, response.text);
      },
      (error) => {
        console.log("FAILED...", error);
      },
    );
    }
  }


  function selectGroup(group: number){
    switch (group) {
      case 1: loadGroup(allMails);
      case 2: loadGroup(badEmails);
      case 3: break;
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

  <div>
    <label for="recipient">Recipient</label>
<input
	type="text"
	id="recipient"
	bind:this={inputElement}
	bind:value={messageParams.recipient}
	onclick={handleClick}
	oninput={handleInput}
/>

    <div class="group-select">
  <h4>Quick Select</h4>

  <div class="group-buttons">
    <button class="group-btn" onclick={() => selectGroup(1)}>All Volunteers</button>
    <button class="group-btn" onclick={() => selectGroup(2)}>Under Criteria</button>
    <button class="group-btn">Custom Group</button>
    <button class="group-btn">Clear All</button>
  </div>
</div>

{#if selected === "message"}
    <textarea
      rows="8"
      placeholder="Type your message here..."
      bind:value={messageParams.message}
      style="width: 100%; padding: 0.5rem; font-size: 1rem; resize: vertical;"
    ></textarea>
{/if}
    <button onclick={() => SendEmail(messageParams)}>Send Email</button>
  </div>




<pre>{JSON.stringify(data, null, 2)}</pre>

<pre> {focus}, {wordSelected} </pre>
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
