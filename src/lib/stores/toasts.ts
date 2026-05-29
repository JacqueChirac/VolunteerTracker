import { writable } from "svelte/store";

export type Toast = { id: number; message: string; undoable: boolean };

let nextId = 1;

function createToasts() {
  const { subscribe, update } = writable<Toast[]>([]);

  function dismiss(id: number) {
    update((list) => list.filter((t) => t.id !== id));
  }

  function push(message: string, opts: { undoable?: boolean } = {}) {
    const id = nextId++;
    update((list) => [...list, { id, message, undoable: !!opts.undoable }]);
    setTimeout(() => dismiss(id), 8000);
    return id;
  }

  return { subscribe, push, dismiss };
}

export const toasts = createToasts();
