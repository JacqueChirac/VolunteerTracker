import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "$env/static/private";
import { dateCheck } from "$lib/emailLogic.js";
import { fail, redirect } from "@sveltejs/kit";
import { RECOVERY_COOKIE, createRecoveryToken } from "$lib/server/auth";
import { sendEmailUniversal } from "$lib/emailLogic";
import {init} from "$lib/emailLogic";
import {SERVICES} from "$lib/emailLogic";
import { getTime } from "$lib/emailLogic";
import crypto from "crypto";
import { error } from '@sveltejs/kit';
import { RateLimiter } from 'sveltekit-rate-limiter/server';


const sql = neon(DATABASE_URL);

const limiter = new RateLimiter({
  IP: [5, 'd'], // IP address limiter
  IPUA: [10, 'd'], // IP + User Agent limiter
  cookie: {
    // Cookie limiter
    name: 'resetLimiter', // Unique cookie name for this limiter
    secret: 'SECRETKEY-SERVER-ONLY', // Use $env/static/private
    rate: [2, 'm'],
    preflight: true // Require preflight call (see load function)
  }
});


export const load = async (event) => {
  await limiter.cookieLimiter?.preflight(event);
  await dateCheck();
  deleteExpiredVerificationLinks();
  return {};
};

async function deleteExpiredVerificationLinks() {
  const now = await getTime();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // One hour in milliseconds
  await sql`DELETE FROM password_reset_tokens WHERE time_created < ${oneHourAgo.toISOString()}`;
}



async function initiatePasswordReset(email:string) {
  const time = await getTime();
  const token = crypto.randomInt(100000, 999999).toString();
  await sql`INSERT INTO password_reset_tokens (email, link, time_created) VALUES (${email}, ${token}, ${time})`;
  return token;
}



export const actions = {
  
  sendKey: async (event) => {
    const request = event.request;
    if (await limiter.isLimited(event)) throw error(429, "too many requests");
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const node = await init();
    if (node === -1) {
      return fail(503, { message: "You cannot reset password at this moment" });
    }

    //Check if email exists
    const user = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (user.length === 0) {
      return { success: true };
    }

    const token = await initiatePasswordReset(email);

    const messageParams = {
      subject: "Recover Password",
      name: "CPWD security",
      message: `There is an attempt to reset your password. If it is not your activity, ignore this message. Do not share this key with anyone. Your reset key is ${token}`,
      time: await getTime(),
      recipient: email,
    };

    try {
      await sendEmailUniversal(node, "message", messageParams);
      return { success: true };
    } catch (error) {
      return fail(401, { message: error instanceof Error ? error.message : "Failed to send email" });
    }
  },

  checkKey: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const key = formData.get("key") as string;

    if (!email || !key) {
      return fail(400, { message: "Email and verification key are required" });
    }

    const results = await sql`
      SELECT time_created FROM password_reset_tokens 
      WHERE email = ${email} AND link = ${key} 
      ORDER BY time_created DESC LIMIT 1
    `;

    if (results.length === 0) {
      return fail(400, { message: "Invalid email or verification key" });
    }

    const timeCreated = new Date(results[0].time_created);
    const now = await getTime();
    const diffInMinutes = (now.getTime() - timeCreated.getTime()) / (1000 * 60);

    if (diffInMinutes > 15) {
      return fail(400, { message: "Verification key has expired" });
    }

    const recoveryToken = createRecoveryToken(email);
    cookies.set(RECOVERY_COOKIE, recoveryToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 10, // 10 minutes
    });

    throw redirect(302, "/login/reset");
  },
};
