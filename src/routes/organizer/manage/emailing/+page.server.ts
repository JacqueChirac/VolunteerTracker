import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "$env/static/private";
import { json } from "@sveltejs/kit";
import { check } from "drizzle-orm/gel-core";
import { fail } from "@sveltejs/kit";

const sql = neon(DATABASE_URL);
const children = await sql`SELECT * FROM children`;
const users = await sql`SELECT * FROM users`;
let volunteers = await sql`SELECT * FROM users WHERE role = 'volunteer'`;

async function dateCheck(){
const date = await sql`SELECT last_login FROM email_settings`;
const oldDateString = await date[0].last_login;
const oldDate = new Date(oldDateString);
const response = await fetch('https://timeapi.io/api/v1/time/current/utc');
const newDatePackage =  await response.json();
const newDate = new Date(newDatePackage.utc_time);
//Reset every 20
if((oldDate.getDate() < 20 || oldDate.getMonth()<newDate.getMonth() ) && newDate.getDate() >= 20){
  await sql`UPDATE nodes
    SET token = 200
    WHERE service_id = 'service_cpwd0'`;
}
//Reset every 5
if((oldDate.getDate() < 5 || oldDate.getMonth()<newDate.getMonth()) && newDate.getDate() >= 5){
  await sql`UPDATE nodes
    SET token = 200
    WHERE service_id IN ('service_cpwd1', 'service_cpwd2')`;
}
await sql`UPDATE email_settings SET last_login = ${newDate}`
console.log(newDate);
return newDate;
}


export async function load() {
  const newDate = await dateCheck();
  const children = await sql`
    SELECT * FROM child_volunteer_links
  `;
  const badEmails = await getBadEmails();

  const allMails = await getAllMails();

  const allNames = await getNames();

  let nodes = await sql`SELECT id, service_id, token FROM nodes`;

  nodes = nodes.sort((a, b) => a.id - b.id);
  return {
    nodes,
    allNames,
    allMails,
    badEmails,
    volunteers,
    newDate,
  };
}

async function updateCost(service: string, cost: number) {
  // Get Current
  const result = await sql`
    SELECT token
    FROM nodes
    WHERE service_id = ${service}
  `;
  if (!result[0]) {
  throw new Error(`Service not found: ${service}`);
}
  const currentToken = result[0].token;
  const newToken = Math.max(currentToken - cost, 0);

  // Set new
  await sql`
    UPDATE nodes
    SET token = ${newToken}
    WHERE service_id = ${service}
  `;
   
  return {
    ok: true
  };
}
async function getAllMails() {
  let allMails = [];
  for (let i = 0; i < volunteers.length; i++) {
    allMails.push(volunteers[i].email);
  }
  return allMails;
}

async function getBadEmails() {
  const badChildrenIDs = await badChildren();
  const badEmails = [];
  for (let i = 0; i < badChildrenIDs.length; i++) {
    const badVolunteers = await getParentIDs(badChildrenIDs[i]);
    for (let j = 0; j < badVolunteers.length; j++) {
      const badEmail = await getMail(badVolunteers[j]);
      badEmails.push(badEmail);
    }
  }
  const uniqueEmails = [...new Set(badEmails)];
  return uniqueEmails;
}

async function badChildren() {
  const children = await getChildren();
  let badChildrenIDs = [];
  for (let i = 0; i < children.length; i++) {
    if (children[i].hours < 30) {
      badChildrenIDs.push(children[i].id);
    }
  }
  return badChildrenIDs;
}

async function getChildren() {
  const children = await sql`
    SELECT * FROM children`;
  return children;
}

async function getVolunteers(childID: number) {
  const volunteers = await sql`
    SELECT * FROM child_volunteer_links
    WHERE child_id = ${childID}
  `;
  return volunteers;
}

async function getParentIDs(childID: number) {
  const volunteers = await getVolunteers(childID);
  let parentIDs = [];
  for (let i = 0; i < volunteers.length; i++) {
    parentIDs.push(volunteers[i].user_id);
  }
  return parentIDs;
}

async function getMail(parentID: number) {
  for (let i = 0; i < users.length; i++) {
    if (users[i].id === parentID) {
      return users[i].email;
    }
  }

  return null;
}

function getNames() {
  let names = [];
  for (let i = 0; i < volunteers.length; i++) {
    names.push(volunteers[i].first_name + " " + volunteers[i].last_name);
  }
  return names;
}

export const actions = {
  callCost: async ({ request }) => {
    const data = await request.formData();

    const service = String(data.get("service"));
    const cost = Number(data.get("cost"));
      if (Number.isNaN(cost)) {
  throw new Error("Invalid cost");
}
    return updateCost(service, cost);
  },

  updateBudget: async ({ request }) => {
    //Nothing yet
  },
};
