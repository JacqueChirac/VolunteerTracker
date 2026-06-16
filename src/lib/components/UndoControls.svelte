<!-- Undo/redo affordances: a floating Undo/Redo bar, Ctrl+Z / Ctrl+Y shortcuts,
     and a toast (with an Undo button) shown right after an undoable action. -->
<script lang="ts">
	import { Undo2, Redo2, X } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { lang } from '$lib/stores/lang';
	import { toasts } from '$lib/stores/toasts';
	import type { UndoState } from '$lib/undo-types';

	let { undoState }: { undoState: UndoState } = $props();

	let busy = $state(false);

	const labels = {
		en: { undo: 'Undo', redo: 'Redo', nothingUndo: 'Nothing to undo', nothingRedo: 'Nothing to redo' },
		fr: { undo: 'Annuler', redo: 'Rétablir', nothingUndo: 'Rien à annuler', nothingRedo: 'Rien à rétablir' }
	};
	let L = $derived(labels[$lang as 'en' | 'fr'] ?? labels.en);

	// busy guards against double-firing while a request is in flight; invalidateAll refreshes undoState
	async function doUndo() {
		if (busy || !undoState.canUndo) return;
		busy = true;
		try {
			const res = await fetch('/api/undo', { method: 'POST' });
			if (res.ok) await invalidateAll();
		} finally {
			busy = false;
		}
	}

	async function doRedo() {
		if (busy || !undoState.canRedo) return;
		busy = true;
		try {
			const res = await fetch('/api/redo', { method: 'POST' });
			if (res.ok) await invalidateAll();
		} finally {
			busy = false;
		}
	}

	function undoFromToast(id: number) {
		toasts.dismiss(id);
		doUndo();
	}

	function onKey(e: KeyboardEvent) {
		if (!(e.ctrlKey || e.metaKey)) return;
		const tgt = e.target as HTMLElement | null;
		if (
			tgt &&
			(tgt.tagName === 'INPUT' ||
				tgt.tagName === 'TEXTAREA' ||
				tgt.tagName === 'SELECT' ||
				tgt.isContentEditable)
		)
			return;
		const key = e.key.toLowerCase();
		if (key === 'z' && !e.shiftKey) {
			e.preventDefault();
			doUndo();
		} else if (key === 'y' || (key === 'z' && e.shiftKey)) {
			e.preventDefault();
			doRedo();
		}
	}

	// Surface a toast with an Undo button right after an undoable action succeeds.
	let lastForm: unknown = null;
	$effect(() => {
		const f = page.form as Record<string, unknown> | null;
		// lastForm dedupes so the same action result doesn't re-toast on unrelated reactive runs
		if (f && f !== lastForm) {
			lastForm = f;
			if (f.success && f.undoable) {
				toasts.push((f.message as string) ?? (L.undo + ' available'), { undoable: true });
			}
		}
	});
</script>

<svelte:window onkeydown={onKey} />

{#if undoState.canUndo || undoState.canRedo}
	<div class="undo-bar" role="group" aria-label="Undo and redo">
		<button
			type="button"
			onclick={doUndo}
			disabled={!undoState.canUndo || busy}
			title={undoState.canUndo ? `${L.undo}: ${undoState.undoLabel}` : L.nothingUndo}
		>
			<Undo2 size={16} />
			<span>{L.undo}</span>
		</button>
		<button
			type="button"
			onclick={doRedo}
			disabled={!undoState.canRedo || busy}
			title={undoState.canRedo ? `${L.redo}: ${undoState.redoLabel}` : L.nothingRedo}
		>
			<Redo2 size={16} />
			<span>{L.redo}</span>
		</button>
	</div>
{/if}

<div class="toast-stack" aria-live="polite">
	{#each $toasts as toast (toast.id)}
		<div class="toast">
			<span class="toast-msg">{toast.message}</span>
			{#if toast.undoable}
				<button type="button" class="toast-undo" onclick={() => undoFromToast(toast.id)}>
					<Undo2 size={14} />{L.undo}
				</button>
			{/if}
			<button type="button" class="toast-close" aria-label="Dismiss" onclick={() => toasts.dismiss(toast.id)}>
				<X size={14} />
			</button>
		</div>
	{/each}
</div>

<style>
	.undo-bar {
		position: fixed;
		bottom: 16px;
		right: 16px;
		display: flex;
		gap: 6px;
		z-index: 60;
		background: var(--surface, #fff);
		border: 1px solid var(--border, #d9e1ea);
		border-radius: 10px;
		padding: 4px;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
	}
	.undo-bar button {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: transparent;
		color: var(--text, #1c2733);
		border: none;
		border-radius: 8px;
		padding: 6px 10px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow: none;
		min-height: auto;
	}
	.undo-bar button:hover:not(:disabled) {
		background: rgba(88, 164, 176, 0.18);
		transform: none;
		box-shadow: none;
	}
	.undo-bar button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.toast-stack {
		position: fixed;
		bottom: 16px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: 8px;
		z-index: 70;
		width: max-content;
		max-width: calc(100vw - 32px);
	}
	.toast {
		display: flex;
		align-items: center;
		gap: 12px;
		background: #1c2733;
		color: #fff;
		border-radius: 10px;
		padding: 10px 12px;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
		font-size: 0.9rem;
	}
	.toast-msg { flex: 1; }
	.toast-undo {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: rgba(255, 255, 255, 0.16);
		color: #fff;
		border: none;
		border-radius: 8px;
		padding: 5px 10px;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: none;
		min-height: auto;
		white-space: nowrap;
	}
	.toast-undo:hover { background: rgba(255, 255, 255, 0.3); transform: none; box-shadow: none; }
	.toast-close {
		background: transparent;
		color: rgba(255, 255, 255, 0.7);
		border: none;
		padding: 2px;
		cursor: pointer;
		box-shadow: none;
		min-height: auto;
		display: inline-flex;
	}
	.toast-close:hover { color: #fff; transform: none; box-shadow: none; }

	@media (max-width: 768px) {
		.undo-bar { bottom: 12px; right: 12px; }
		.toast-stack { bottom: 12px; }
	}
</style>
