// POST /api/undo — reverse the current user's most recent reversible action.
import type { RequestHandler } from "./$types";
import { json, error } from "@sveltejs/kit";
import { undo, getUndoState } from "$lib/server/undo";

export const POST: RequestHandler = async ({ locals }) => {
  if (!locals.user) throw error(401, "Not authenticated");
  const scope = String(locals.user.id);
  const label = await undo(scope);
  const state = await getUndoState(scope);
  return json({ ok: label !== null, label, state });
};
