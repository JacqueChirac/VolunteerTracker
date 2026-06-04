import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "$env/static/private";
import { env } from "$env/dynamic/private";
import { dateCheck } from "$lib/emailLogic.js";
import { fail, redirect } from "@sveltejs/kit";
import {
  RECOVERY_COOKIE,
  RECOVERY_COOKIE_OPTS,
  createRecoveryToken,
  BCRYPT_COST,
} from "$lib/server/auth";
import { sendEmailUniversal } from "$lib/emailLogic";
import {init} from "$lib/emailLogic";
import {SERVICES} from "$lib/emailLogic";
import { getTime } from "$lib/emailLogic";
import crypto from "crypto";
import { error } from '@sveltejs/kit';
import { RateLimiter } from 'sveltekit-rate-limiter/server';
import { hashSync, compareSync } from "bcrypt-ts";


const sql = neon(DATABASE_URL);
const rateSecret = env.SESSION_SECRET ?? 'dev-rate-limit-secret';

const sendLimiter = new RateLimiter({
  IP: [5, 'd'], // IP address limiter
  IPUA: [5, 'd'], // IP + User Agent limiter
  cookie: {
    name: 'resetLimiter',
    secret: rateSecret,
    rate: [2, 'm'],
    preflight: true
  }
});

const checkLimiter = new RateLimiter({
  IP: [5, 'm'], // IP address limiter
  IPUA: [5, 'm'], // IP + User Agent limiter
  cookie: {
    name: 'resetLimiter',
    secret: rateSecret,
    rate: [5, 'm'],
    preflight: true
  }
});


export const load = async (event) => {
  await sendLimiter.cookieLimiter?.preflight(event);
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
  const hashToken = hashSync(token, BCRYPT_COST);
  await sql`INSERT INTO password_reset_tokens (email, link, time_created) VALUES (${email}, ${hashToken}, ${time})`;
  return token;
}



export const actions = {
  
  sendKey: async (event) => {
    const request = event.request;
    if (await sendLimiter.isLimited(event)) throw error(429, "too many requests");
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

  checkKey: async (event) => {
    const cookies = event.cookies;
    const request = event.request;
    if (await checkLimiter.isLimited(event)) throw error(429, "too many requests");
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const key = formData.get("key") as string;

    if (!email || !key) {
      return fail(400, { message: "Email and verification key are required" });
    }
    const results = await sql`
      SELECT link, time_created FROM password_reset_tokens 
      WHERE email = ${email}  
      ORDER BY time_created DESC LIMIT 1
    `;
    if (results.length === 0) {
      return fail(400, { message: "Invalid email or verification key" });
    }
    if(compareSync(key, results[0].link) === false){
      return fail(400, { message: "Invalid email or verification key" });
    }

    const timeCreated = new Date(results[0].time_created);
    const now = await getTime();
    const diffInMinutes = (now.getTime() - timeCreated.getTime()) / (1000 * 60);

    if (diffInMinutes > 15) {
      return fail(400, { message: "Verification key has expired" });
    }

    const recoveryToken = createRecoveryToken(email);
    cookies.set(RECOVERY_COOKIE, recoveryToken, RECOVERY_COOKIE_OPTS);

    throw redirect(302, "/login/reset");
  },
};
