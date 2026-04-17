// seeds the database with test data so we have something to look at
// run with: bun run db:seed

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./db/schema";
import { hashSync } from "bcrypt-ts";

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding database...");

  // admin account — this is the organizer login
  const adminPassword = hashSync("admin123", 10);
  await db
    .insert(schema.users)
    .values({
      passwordHash: adminPassword,
      role: "organizer",
      firstName: "Admin",
      lastName: "Organizer",
      email: "admin@example.com",
    })
    .onConflictDoNothing();
  console.log("Admin account created (email: admin@example.com, password: admin123)");

  // a few parent accounts to test with
  const volunteerPassword = hashSync("password", 10);
  const volunteers = [
    {
      firstName: "Raymond",
      lastName: "Liu",
      email: "raymond@example.com",
    },
    {
      firstName: "Mary",
      lastName: "Liu",
      email: "mary@example.com",
    },
    {
      firstName: "Zilin",
      lastName: "Liu",
      email: "zilin@example.com",
    },
  ];
  for (const v of volunteers) {
    await db
      .insert(schema.users)
      .values({
        ...v,
        passwordHash: volunteerPassword,
        role: "parent",
      })
      .onConflictDoNothing();
  }
  console.log("Sample volunteers created (password: password)");

  // types of volunteer work parents can log
  const activities = [
    "Repair",
    "Trophies",
    "Sort Supplies",
    "Set Up Pool",
    "Cleanup",
    "Concession Stand",
    "Timing",
    "Registration Desk",
  ];
  for (const name of activities) {
    await db
      .insert(schema.activityTypes)
      .values({ name })
      .onConflictDoNothing();
  }
  console.log("Activity types created");

  // wipe old sample events/announcements so re-running seed doesn't duplicate
  await db.delete(schema.events);
  await db.delete(schema.announcements);

  // sample events (mix of past and future)
  const sampleEvents = [
    {
      title: "Pre-Season Meeting",
      date: "2025-09-10",
      startTime: "18:00",
      endTime: "19:30",
      location: "Community Center Room B",
      description: "Kickoff meeting for the 2025-2026 swim season.",
      volunteersNeeded: 4,
      budget: "25.00",
      importance: "high" as const,
    },
    {
      title: "Equipment Inventory",
      date: "2025-10-05",
      startTime: "09:00",
      endTime: "12:00",
      location: "Pool Storage Room",
      description: "Count and catalog all swim team equipment.",
      volunteersNeeded: 3,
      budget: "0.00",
      importance: "medium" as const,
    },
    {
      title: "Fall Swim Meet Setup",
      date: "2025-11-15",
      startTime: "07:00",
      endTime: "09:00",
      location: "Carlton Place Water Dragon Pool",
      description: "Set up lanes, timing boards, and spectator seating.",
      volunteersNeeded: 6,
      budget: "100.00",
      importance: "high" as const,
    },
    {
      title: "Holiday Fundraiser Bake Sale",
      date: "2025-12-12",
      startTime: "10:00",
      endTime: "14:00",
      location: "School Cafeteria",
      description: "Bake sale to raise funds for new lane dividers.",
      volunteersNeeded: 5,
      budget: "75.00",
      importance: "medium" as const,
    },
    {
      title: "Sort Supplies",
      date: "2026-08-05",
      startTime: "14:00",
      endTime: "16:00",
      location: "Pool Storage Room",
      description: "Sort and organize supplies for the upcoming season.",
      volunteersNeeded: 5,
      budget: "50.00",
      importance: "medium" as const,
    },
    {
      title: "Set Up Pool",
      date: "2026-08-11",
      startTime: "09:00",
      endTime: "13:00",
      location: "Carlton Place Water Dragon Pool",
      description:
        "Set up lanes, timing equipment, and seating for the first meet.",
      volunteersNeeded: 8,
      budget: "150.00",
      importance: "high" as const,
    },
    {
      title: "End of Season Cleanup",
      date: "2026-08-28",
      startTime: "10:00",
      endTime: "14:00",
      location: "Carlton Place Water Dragon Pool",
      description: "Pack everything up and clean the pool area.",
      volunteersNeeded: 10,
      importance: "high" as const,
    },
  ];

  for (const event of sampleEvents) {
    await db.insert(schema.events).values(event);
  }
  console.log("Sample events created");

  // sample announcements for the dashboard
  const sampleAnnouncements = [
    {
      title: "Welcome to the 2026 Season!",
      content:
        "We are excited to kick off another great year. Check the events page and sign up to volunteer!",
    },
    {
      title: "Volunteer Hours Reminder",
      content:
        "Full member families need 30 hours, tryout families need 4 hours. Donations of $10 count as 1 hour.",
    },
  ];

  for (const a of sampleAnnouncements) {
    await db.insert(schema.announcements).values(a);
  }
  console.log("Sample announcements created");

  // default site settings
  const defaultSettings = [
    {
      key: "hours_required_full_member",
      value: "30",
      label: "Hours Required (Full Member)",
    },
    {
      key: "hours_required_tryout",
      value: "4",
      label: "Hours Required (Tryout)",
    },
    {
      key: "donation_to_hour_rate",
      value: "10",
      label: "Dollars per Hour (Donation Rate)",
    },
  ];
  for (const s of defaultSettings) {
    await db.insert(schema.siteSettings).values(s).onConflictDoNothing();
  }
  console.log("Site settings created");

  console.log("Done!");
}

seed().catch(console.error);
