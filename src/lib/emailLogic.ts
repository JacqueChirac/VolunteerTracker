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
  {
    serviceID: "service_cpwd3",
    publicKey: "_Qizqrs3OM1ySu5oH",
  },{
    serviceID: "service_cpwd4",
    publicKey: "YjLyiRcQ1yGpobedI",
  },
];

// We get the time from an external API instead of the server clock so the
// monthly quota resets below can't be gamed by changing the machine's date.
export async function getTime() {
  const response = await fetch('https://timeapi.io/api/v1/time/current/utc');
  if (!response.ok) {
    throw new Error(`Failed to fetch time: ${response.status}`);
  }
  const { utc_time } = await response.json();
  const newDate = new Date(utc_time);
  if (isNaN(newDate.getTime())) {
    throw new Error("Invalid time from API");
  }
  return newDate;
}

// pick the first EmailJS service that still has quota left; -1 means all exhausted
export async function init() {
  const nodes = await sql`SELECT service_id, token FROM nodes ORDER BY id ASC`;

  const nodeIndex = nodes.findIndex(n => n.token > 0);
  if (nodeIndex === -1) {
    return -1;
  }

  return nodeIndex;
}

export async function initWithNode(node: number) {
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
  // One token is spent per recipient, so count the comma-separated addresses
  // (fall back to 1 if no recipient field was provided).
  const cost = params.recipient
    ? params.recipient.split(",").map((s: string) => s.trim()).filter(Boolean).length
    : 1;

  await sql`UPDATE nodes SET token = token - ${cost} WHERE service_id = ${service.serviceID}`;

  return response;
}

export async function dateCheck() {
  try {
    const rows = await sql`SELECT last_login FROM email_settings`;
    const oldDate = new Date(rows[0]?.last_login);
    if (isNaN(oldDate.getTime())) {
      throw new Error("Invalid last_login in email_settings");
    }

    const newDate = await getTime();

    // EmailJS quotas refill on fixed days of the month. The first time we run on
    // or after a reset day, top the relevant nodes back up to 200. The condition
    // reads: we hadn't reached the reset day yet (or it's a new month), and today
    // is now on or past it.
    // Reset every 20th
    if ((oldDate.getDate() < 20 || oldDate.getMonth() < newDate.getMonth()) && newDate.getDate() >= 20) {
      await sql`UPDATE nodes SET token = 200 WHERE service_id IN ('service_cpwd0', 'service_cpwd3') `;
    }
    // Reset every 5th
    if ((oldDate.getDate() < 5 || oldDate.getMonth() < newDate.getMonth()) && newDate.getDate() >= 5) {
      await sql`UPDATE nodes SET token = 200 WHERE service_id IN ('service_cpwd1', 'service_cpwd2')`;
    }
    // Reset every 27th
        if ((oldDate.getDate() < 27 || oldDate.getMonth() < newDate.getMonth()) && newDate.getDate() >= 27) {
      await sql`UPDATE nodes SET token = 200 WHERE service_id = 'service_cpwd4'`;
    }
    
    await sql`UPDATE email_settings SET last_login = ${newDate.toISOString()}`;
    return newDate;
  } catch (error) {
    console.error("Error in dateCheck:", error);
    throw error;
  }
}