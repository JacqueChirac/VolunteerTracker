import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "$env/static/private";
import { json } from "@sveltejs/kit";
import { check } from "drizzle-orm/gel-core";
import { fail } from "@sveltejs/kit";

const sql = neon(DATABASE_URL);
const children = await sql`SELECT * FROM children`;
const users = await sql`SELECT * FROM users`;
let volunteers = await sql`SELECT * FROM users WHERE role = 'volunteer'`;

export async function load() {
  const children = await sql`
    SELECT * FROM child_volunteer_links
  `;
  const badEmails = await getBadEmails();

  const allMails = await getAllMails();

  const allNames = await getNames();

  const nodes = await sql`SELECT id, service_id, token FROM nodes`;
  return {
    nodes,
    allNames,
    allMails,
    badEmails,
    volunteers,
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
