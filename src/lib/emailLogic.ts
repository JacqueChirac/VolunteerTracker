import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "$env/static/private";

const sql = neon(DATABASE_URL);

export const SERVICES = [
  {
    serviceID: "service_cpwd0",
    publicKey: "InRSRMYq3D8DEYnU9",
  },
  {
    serviceID: "service_cpwd1",
    publicKey: "UmIK54UYI1rc8XP2I",
  },
  {
    serviceID: "service_cpwd2",
    publicKey: "tJvhr_u5xNaHdHRTp",
  },
];

export async function getTime(){
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
    return newDate;
}

export async function init() {
  const nodes = await sql`SELECT service_id, token FROM nodes ORDER BY id ASC`;
  
  const nodeIndex = nodes.findIndex(n => n.token > 0);
  if (nodeIndex === -1) {
    return -1;
  }

  return nodeIndex;
}

export async function initWithNode(node:number) {
  const service = SERVICES[node];

  // Removed browser-specific initialization
  return node;
}

//example message params
  // let messageParams = $state({
  //   // Parameters defined in the template
  //   subject: "Morning!",
  //   name: "Kelp",
  //   message: "I send you a message!",
  //   time: 2008,
  //   recipient: "liuzilin375@gmail.com",
  // });
export async function sendEmailUniversal(node: number, templateId: string, params: any) {
  if(node===-1){
    throw new Error("No tokens available");
  }
  const service = SERVICES[node];
  
  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      service_id: service.serviceID,
      template_id: templateId,
      user_id: service.publicKey,
      template_params: params,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Email failed to send: ${errorBody}`);
  }
  
  // Update tokens in DB
  const cost = params.recipient
    ? params.recipient.split(",").map((s: string) => s.trim()).filter(Boolean).length
    : 1;

  await sql`UPDATE nodes SET token = token - ${cost} WHERE service_id = ${service.serviceID}`;

  return response;
}

export async function dateCheck() {
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