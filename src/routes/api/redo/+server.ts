// POST /api/redo - re-apply the current user's most recently undone action.
import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { redo, getUndoState } from "$lib/server/undo";

export const POST: RequestHandler = async ({ locals }) => {
  if (!locals.user) throw error(401, "Not authenticated");
  const scope = String(locals.user.id);
  const label = await redo(scope);
  const state = await getUndoState(scope);
  return json({ ok: label !== null, label, state });
};
