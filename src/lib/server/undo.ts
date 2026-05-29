// Generic undo/redo engine.
//
// Every reversible action records a row in `action_log` whose `changes` field is a
// JSON array of row-level snapshots. Each change captures a single DB row in two
// states: `before` (how it looked prior to the action) and `after` (how it looked
// once the action completed). A null state means the row did not exist then.
//
// Undo = make the DB match every change's `before`. Redo = match every `after`.
// Reconciling a single change:
//   - target state is null            -> delete the row by primary key
//   - target state is an object       -> upsert the row (insert, or overwrite on conflict)
//
// FK safety: parent tables have a lower `depth` than the join/child tables that
// reference them. Upserts run parents-first (ascending depth); deletes run
// children-first (descending depth). All reconciliation queries for one undo/redo
// run atomically through neon-http's `db.batch`.

import { db } from "$lib/server/db";
import {
  actionLog,
  users,
  children,
  childVolunteerLinks,
  events,
  eventSignups,
  contributions,
  activityTypes,
  announcements,
  swimLevelSettings,
  siteSettings,
} from "$lib/server/db/schema";
import { and, desc, asc, eq } from "drizzle-orm";
import type { PgTable, PgColumn } from "drizzle-orm/pg-core";
import type { UndoState } from "$lib/undo-types";

export type { UndoState };

type Row = Record<string, unknown>;

export type Change = {
  table: TableName;
  pk: string | number;
  depth: number;
  before: Row | null;
  after: Row | null;
};

// --- table registry: the only tables undo/redo is allowed to touch ---

type TableMeta = {
  table: PgTable;
  pkCol: PgColumn;
  pkName: string;
  depth: number; // 0 = parent, 1 = references a parent
  tsCols: string[]; // timestamp columns that need Date re-hydration on restore
};

const REGISTRY = {
  users: { table: users, pkCol: users.id, pkName: "id", depth: 0, tsCols: ["createdAt"] },
  children: { table: children, pkCol: children.id, pkName: "id", depth: 0, tsCols: ["createdAt"] },
  events: { table: events, pkCol: events.id, pkName: "id", depth: 0, tsCols: ["createdAt"] },
  activityTypes: { table: activityTypes, pkCol: activityTypes.id, pkName: "id", depth: 0, tsCols: [] },
  announcements: { table: announcements, pkCol: announcements.id, pkName: "id", depth: 0, tsCols: ["createdAt"] },
  swimLevelSettings: { table: swimLevelSettings, pkCol: swimLevelSettings.id, pkName: "id", depth: 0, tsCols: [] },
  siteSettings: { table: siteSettings, pkCol: siteSettings.key, pkName: "key", depth: 0, tsCols: [] },
  childVolunteerLinks: { table: childVolunteerLinks, pkCol: childVolunteerLinks.id, pkName: "id", depth: 1, tsCols: [] },
  eventSignups: { table: eventSignups, pkCol: eventSignups.id, pkName: "id", depth: 1, tsCols: ["signedUpAt"] },
  contributions: { table: contributions, pkCol: contributions.id, pkName: "id", depth: 1, tsCols: ["createdAt", "pendingUntil"] },
} satisfies Record<string, TableMeta>;

export type TableName = keyof typeof REGISTRY;

// --- change builders (used by action handlers) ---

export function chInsert(table: TableName, row: Row): Change {
  const m = REGISTRY[table];
  return { table, pk: row[m.pkName] as string | number, depth: m.depth, before: null, after: row };
}

export function chUpdate(table: TableName, before: Row, after: Row): Change {
  const m = REGISTRY[table];
  return { table, pk: after[m.pkName] as string | number, depth: m.depth, before, after };
}

export function chDelete(table: TableName, row: Row): Change {
  const m = REGISTRY[table];
  return { table, pk: row[m.pkName] as string | number, depth: m.depth, before: row, after: null };
}

// Derive changes by diffing two full row-sets of the same table (keyed by pk).
// Useful for operations that touch an unknown number of rows, e.g. tutorial edits
// that upsert/delete many `tut_`-prefixed settings at once.
export function diffRows(table: TableName, before: Row[], after: Row[]): Change[] {
  const m = REGISTRY[table];
  const beforeMap = new Map(before.map((r) => [r[m.pkName], r]));
  const afterMap = new Map(after.map((r) => [r[m.pkName], r]));
  const changes: Change[] = [];
  for (const [pk, bRow] of beforeMap) {
    const aRow = afterMap.get(pk);
    if (!aRow) changes.push({ table, pk: pk as string | number, depth: m.depth, before: bRow, after: null });
    else if (JSON.stringify(bRow) !== JSON.stringify(aRow))
      changes.push({ table, pk: pk as string | number, depth: m.depth, before: bRow, after: aRow });
  }
  for (const [pk, aRow] of afterMap) {
    if (!beforeMap.has(pk))
      changes.push({ table, pk: pk as string | number, depth: m.depth, before: null, after: aRow });
  }
  return changes;
}

// --- recording ---

// Record a reversible action. Performing a new action discards the redo branch
// (any `undone` entries in this scope can no longer be redone).
export async function recordAction(scope: string, label: string, changes: Change[]): Promise<void> {
  if (changes.length === 0) return;
  await db
    .update(actionLog)
    .set({ status: "invalidated" })
    .where(and(eq(actionLog.scope, scope), eq(actionLog.status, "undone")));
  await db.insert(actionLog).values({ scope, label, changes: JSON.stringify(changes), status: "active" });
}

// --- reconciliation ---

// Convert a stored snapshot back into a value drizzle can write (timestamps as Date).
function hydrate(table: TableName, row: Row): Row {
  const out: Row = { ...row };
  for (const col of REGISTRY[table].tsCols) {
    if (out[col] != null) out[col] = new Date(out[col] as string);
  }
  return out;
}

// Build the ordered list of queries that make the DB match the chosen side of
// each change. Upserts are ordered parents-first; deletes children-first.
function buildReconcileQueries(changes: Change[], side: "before" | "after") {
  const upserts: { depth: number; q: unknown }[] = [];
  const deletes: { depth: number; q: unknown }[] = [];

  for (const ch of changes) {
    const m = REGISTRY[ch.table];
    const target = side === "before" ? ch.before : ch.after;
    if (target === null) {
      deletes.push({ depth: ch.depth, q: db.delete(m.table).where(eq(m.pkCol, ch.pk)) });
    } else {
      const row = hydrate(ch.table, target);
      upserts.push({
        depth: ch.depth,
        q: db.insert(m.table).values(row).onConflictDoUpdate({ target: m.pkCol, set: row }),
      });
    }
  }

  upserts.sort((a, b) => a.depth - b.depth); // parents first
  deletes.sort((a, b) => b.depth - a.depth); // children first
  return [...upserts, ...deletes].map((x) => x.q);
}

type BatchItem = Parameters<typeof db.batch>[0][number];

async function applyChanges(changes: Change[], side: "before" | "after", statusUpdate: BatchItem) {
  const queries = buildReconcileQueries(changes, side) as BatchItem[];
  // status update first only to satisfy batch's non-empty-tuple type; the data
  // queries keep their FK-safe relative order, and the log table is independent.
  await db.batch([statusUpdate, ...queries]);
}

// --- undo / redo / state ---

export async function getUndoState(scope: string): Promise<UndoState> {
  const [nextUndo] = await db
    .select({ label: actionLog.label })
    .from(actionLog)
    .where(and(eq(actionLog.scope, scope), eq(actionLog.status, "active")))
    .orderBy(desc(actionLog.id))
    .limit(1);
  const [nextRedo] = await db
    .select({ label: actionLog.label })
    .from(actionLog)
    .where(and(eq(actionLog.scope, scope), eq(actionLog.status, "undone")))
    .orderBy(asc(actionLog.id))
    .limit(1);
  return {
    canUndo: !!nextUndo,
    undoLabel: nextUndo?.label ?? null,
    canRedo: !!nextRedo,
    redoLabel: nextRedo?.label ?? null,
  };
}

// Reverse the most recent active action in this scope. Returns its label, or null
// if there was nothing to undo.
export async function undo(scope: string): Promise<string | null> {
  const [entry] = await db
    .select()
    .from(actionLog)
    .where(and(eq(actionLog.scope, scope), eq(actionLog.status, "active")))
    .orderBy(desc(actionLog.id))
    .limit(1);
  if (!entry) return null;

  const changes = JSON.parse(entry.changes) as Change[];
  await applyChanges(
    changes,
    "before",
    db.update(actionLog).set({ status: "undone" }).where(eq(actionLog.id, entry.id)),
  );
  return entry.label;
}

// Re-apply the oldest undone action in this scope. Returns its label, or null if
// there was nothing to redo.
export async function redo(scope: string): Promise<string | null> {
  const [entry] = await db
    .select()
    .from(actionLog)
    .where(and(eq(actionLog.scope, scope), eq(actionLog.status, "undone")))
    .orderBy(asc(actionLog.id))
    .limit(1);
  if (!entry) return null;

  const changes = JSON.parse(entry.changes) as Change[];
  await applyChanges(
    changes,
    "after",
    db.update(actionLog).set({ status: "active" }).where(eq(actionLog.id, entry.id)),
  );
  return entry.label;
}
