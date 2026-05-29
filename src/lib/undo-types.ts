// Client-safe types shared between the undo engine and UI.
export type UndoState = {
  canUndo: boolean;
  undoLabel: string | null;
  canRedo: boolean;
  redoLabel: string | null;
};
