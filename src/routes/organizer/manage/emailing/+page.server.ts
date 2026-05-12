import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "$env/static/private";
import { json } from "@sveltejs/kit";
import { check } from "drizzle-orm/gel-core";
import { fail } from "@sveltejs/kit";

const sql = neon(DATABASE_URL);


async function dateCheck() {
  try {
    const date = await sql`SELECT last_login FROM email_settings`;
    if (!date || date.length === 0) {
      throw new Error("No email_settings found");
    }
    const oldDateString = date[0].last_login;
    if (!oldDateString) {
      throw new Error("Invalid last_login value");
    }
    const oldDate = new Date(oldDateString);
    if (isNaN(oldDate.getTime())) {
      throw new Error("Invalid date format in last_login");
    }
    
    const response = await fetch('https://timeapi.io/api/v1/time/current/utc');
    if (!response.ok) {
      throw new Error(`Failed to fetch time: ${response.status}`);
    }
    const newDatePackage = await response.json();
    if (!newDatePackage || !newDatePackage.utc_time) {
      throw new Error("Invalid response from time API");
    }
    const newDate = new Date(newDatePackage.utc_time);
    if (isNaN(newDate.getTime())) {
      throw new Error("Invalid UTC time from API");
    }
    
    // Reset every 20th
    if ((oldDate.getDate() < 20 || oldDate.getMonth() < newDate.getMonth()) && newDate.getDate() >= 20) {
      await sql`UPDATE nodes SET token = 200 WHERE service_id = 'service_cpwd0'`;
    }
    // Reset every 5th
    if ((oldDate.getDate() < 5 || oldDate.getMonth() < newDate.getMonth()) && newDate.getDate() >= 5) {
      await sql`UPDATE nodes SET token = 200 WHERE service_id IN ('service_cpwd1', 'service_cpwd2')`;
    }
    
    await sql`UPDATE email_settings SET last_login = ${newDate.toISOString()}`;
    console.log(newDate);
    return newDate;
  } catch (error) {
    console.error("Error in dateCheck:", error);
    throw error; // Re-throw to handle in load or elsewhere
  }
}

export async function load() {
  try {
    const newDate = await dateCheck();
    const children = await sql`SELECT * FROM child_volunteer_links`;
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
      volunteers: await getVolunteers(), // Moved to function
      newDate,
    };
  } catch (error) {
    console.error("Error in load:", error);
    throw error; // Let SvelteKit handle it
  }
}

async function updateCost(service: string, cost: number) {
  if (!service || typeof service !== 'string' || service.trim() === '') {
    throw new Error("Invalid service ID");
  }
  if (typeof cost !== 'number' || isNaN(cost) || cost < 0) {
    throw new Error("Invalid cost: must be a non-negative number");
  }
  
  try {
    const result = await sql`SELECT token FROM nodes WHERE service_id = ${service}`;
    if (!result || result.length === 0) {
      throw new Error(`Service not found: ${service}`);
    }
    const currentToken = result[0].token;
    if (typeof currentToken !== 'number' || isNaN(currentToken)) {
      throw new Error("Invalid token value in database");
    }
    const newToken = Math.max(currentToken - cost, 0);
    await sql`UPDATE nodes SET token = ${newToken} WHERE service_id = ${service}`;
    return { ok: true };
  } catch (error) {
    console.error("Error in updateCost:", error);
    throw error;
  }
}

async function getAllMails() {
  try {
    const volunteers = await getVolunteers();
    return volunteers.map(v => v.email).filter(email => email); // Filter out null/undefined
  } catch (error) {
    console.error("Error in getAllMails:", error);
    return []; // Return empty array on error
  }
}

async function getBadEmails() {
  try {
    const badChildrenIDs = await badChildren();
    const badEmails = [];
    for (const childID of badChildrenIDs) {
      const badVolunteers = await getParentIDs(childID);
      for (const volID of badVolunteers) {
        const badEmail = await getMail(volID);
        if (badEmail) badEmails.push(badEmail);
      }
    }
    return [...new Set(badEmails)];
  } catch (error) {
    console.error("Error in getBadEmails:", error);
    return [];
  }
}

async function badChildren() {
  try {
    const children = await getChildren();
    return children.filter(c => c.hours < 30).map(c => c.id);
  } catch (error) {
    console.error("Error in badChildren:", error);
    return [];
  }
}

async function getChildren() {
  try {
    return await sql`SELECT * FROM children`;
  } catch (error) {
    console.error("Error in getChildren:", error);
    return [];
  }
}

async function getVolunteers(childID?: number) {
  try {
    if (childID !== undefined) {
      if (typeof childID !== 'number' || isNaN(childID)) {
        throw new Error("Invalid childID");
      }
      return await sql`SELECT * FROM child_volunteer_links WHERE child_id = ${childID}`;
    } else {
      return await sql`SELECT * FROM users WHERE role = 'volunteer'`;
    }
  } catch (error) {
    console.error("Error in getVolunteers:", error);
    return [];
  }
}

async function getParentIDs(childID: number) {
  try {
    const volunteers = await getVolunteers(childID);
    return volunteers.map(v => v.user_id).filter(id => id !== null && id !== undefined);
  } catch (error) {
    console.error("Error in getParentIDs:", error);
    return [];
  }
}

async function getMail(parentID: number) {
  if (typeof parentID !== 'number' || isNaN(parentID)) {
    return null;
  }
  try {
    const users = await sql`SELECT email FROM users WHERE id = ${parentID}`;
    return users.length > 0 ? users[0].email : null;
  } catch (error) {
    console.error("Error in getMail:", error);
    return null;
  }
}

async function getNames() {
  try {
    const volunteers = await getVolunteers();
    return volunteers.map(v => `${v.first_name || ''} ${v.last_name || ''}`.trim()).filter(name => name);
  } catch (error) {
    console.error("Error in getNames:", error);
    return [];
  }
}

export const actions = {
  callCost: async ({ request }) => {
    try {
      const data = await request.formData();
      const service = data.get("service");
      const cost = data.get("cost");
      
      if (!service || typeof service !== 'string') {
        return fail(400, { error: "Invalid service" });
      }
      const costNum = Number(cost);
      if (isNaN(costNum)) {
        return fail(400, { error: "Invalid cost" });
      }
      
      return await updateCost(service, costNum);
    } catch (error) {
      console.error("Error in callCost:", error);
      return fail(500, { error: "Internal server error" });
    }
  },

  updateBudget: async ({ request }) => {
    // Placeholder 
  },
};