<!-- volunteer↔child network graph: force-directed SVG, drag/zoom/pan/hover -->
<script lang="ts">
	import { untrack } from 'svelte';

	type Volunteer = {
		id: number;
		firstName: string;
		lastName: string;
		email: string;
		totalHours: number;
		children: {
			id: number; firstName: string; lastName: string;
			status: string; totalHours: number; requiredHours: number;
		}[];
	};

	let { volunteers }: { volunteers: Volunteer[] } = $props();

	type Node = {
		id: string;
		type: 'volunteer' | 'child';
		label: string;
		sub: string;
		refId: number;
		degree: number;
		progress: number; // 0..1+ for children, 0 for volunteers
		status?: string;
		x: number; y: number;
		vx: number; vy: number;
		fx: number | null; fy: number | null;
	};
	type Edge = { s: string; t: string };

	const W = 900;
	const H = 560;
	const CX = W / 2;
	const CY = H / 2;

	function buildGraph(vs: Volunteer[]): { nodes: Node[]; edges: Edge[]; idx: Record<string, number> } {
		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];
		const idx: Record<string, number> = {};
		const childSeen = new Map<number, number>();

		vs.forEach((v, i) => {
			const t = vs.length === 1 ? 0.5 : i / (vs.length - 1);
			const id = `v-${v.id}`;
			idx[id] = newNodes.length;
			newNodes.push({
				id,
				type: 'volunteer',
				label: `${v.firstName} ${v.lastName}`,
				sub: `${v.totalHours} hrs`,
				refId: v.id,
				degree: v.children.length,
				progress: 0,
				x: CX - 220 + (Math.random() - 0.5) * 30,
				y: 80 + t * (H - 160) + (Math.random() - 0.5) * 20,
				vx: 0, vy: 0, fx: null, fy: null
			});
		});

		vs.forEach((v) => {
			v.children.forEach((c) => {
				const cid = `c-${c.id}`;
				if (!childSeen.has(c.id)) {
					childSeen.set(c.id, newNodes.length);
					idx[cid] = newNodes.length;
					newNodes.push({
						id: cid,
						type: 'child',
						label: `${c.firstName} ${c.lastName}`,
						sub: c.status === 'tryout' ? 'Tryout' : 'Member',
						refId: c.id,
						degree: 0,
						progress: c.requiredHours > 0 ? c.totalHours / c.requiredHours : 0,
						status: c.status,
						x: CX + 220 + (Math.random() - 0.5) * 30,
						y: CY + (Math.random() - 0.5) * (H - 120),
						vx: 0, vy: 0, fx: null, fy: null
					});
				}
				newEdges.push({ s: `v-${v.id}`, t: cid });
				newNodes[childSeen.get(c.id)!].degree++;
			});
		});

		const childIdxs = newNodes.filter((n) => n.type === 'child');
		childIdxs.forEach((n, k) => {
			const t = childIdxs.length === 1 ? 0.5 : k / (childIdxs.length - 1);
			n.y = 80 + t * (H - 160) + (Math.random() - 0.5) * 20;
		});

		return { nodes: newNodes, edges: newEdges, idx };
	}

	const _initial = untrack(() => buildGraph(volunteers));
	let nodes = $state<Node[]>(_initial.nodes);
	let edges = $state<Edge[]>(_initial.edges);
	let nodeIndex = $state<Record<string, number>>(_initial.idx);

	let hoveredId = $state<string | null>(null);
	let pinnedId = $state<string | null>(null);
	let query = $state('');
	let tx = $state(0);
	let ty = $state(0);
	let scale = $state(1);
	let alpha = $state(1);
	let svgEl: SVGSVGElement | null = $state(null);
	let dragging: { id: string; offX: number; offY: number } | null = null;
	let panning: { sx: number; sy: number; ox: number; oy: number } | null = null;

	// rebuild when volunteers prop reference changes (skips initial run)
	let firstRun = true;
	$effect(() => {
		const vs = volunteers;
		if (firstRun) { firstRun = false; return; }
		const built = buildGraph(vs);
		nodes = built.nodes;
		edges = built.edges;
		nodeIndex = built.idx;
		alpha = 1;
	});

	// derived metrics
	let stats = $derived({
		volunteers: nodes.filter((n) => n.type === 'volunteer').length,
		children: nodes.filter((n) => n.type === 'child').length,
		connections: edges.length,
		isolated: nodes.filter((n) => n.degree === 0).length
	});

	// search match set
	let matched = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return null;
		return new Set(nodes.filter((n) => n.label.toLowerCase().includes(q)).map((n) => n.id));
	});

	// active focus id (hover takes precedence over pin)
	let focusId = $derived(hoveredId ?? pinnedId);

	// neighbor lookup: for highlighting
	let neighbors = $derived.by(() => {
		const m = new Map<string, Set<string>>();
		for (const n of nodes) m.set(n.id, new Set());
		for (const e of edges) {
			m.get(e.s)?.add(e.t);
			m.get(e.t)?.add(e.s);
		}
		return m;
	});

	function isHighlighted(id: string): boolean {
		if (matched && matched.has(id)) return true;
		if (!focusId) return false;
		return id === focusId || (neighbors.get(focusId)?.has(id) ?? false);
	}

	function isDimmed(id: string): boolean {
		if (matched && !matched.has(id)) {
			if (focusId && (id === focusId || neighbors.get(focusId)?.has(id))) return false;
			return true;
		}
		if (!focusId) return false;
		return !(id === focusId || neighbors.get(focusId)?.has(id));
	}

	function isEdgeHighlighted(e: Edge): boolean {
		if (focusId && (e.s === focusId || e.t === focusId)) return true;
		return false;
	}

	function isEdgeDimmed(e: Edge): boolean {
		if (focusId) return !(e.s === focusId || e.t === focusId);
		if (matched) return !(matched.has(e.s) || matched.has(e.t));
		return false;
	}

	// FORCE SIMULATION — runs continuously, decays via alpha
	const REPULSION = 1800;
	const SPRING_LEN = 110;
	const SPRING_K = 0.05;
	const CENTER_K = 0.012;
	const COLUMN_K = 0.025;
	const DAMPING = 0.82;
	const MIN_DIST = 32;

	let raf: number | null = null;

	function tick() {
		if (!nodes.length) {
			raf = requestAnimationFrame(tick);
			return;
		}
		const a = alpha;

		// repulsion (n²)
		for (let i = 0; i < nodes.length; i++) {
			const ni = nodes[i];
			for (let j = i + 1; j < nodes.length; j++) {
				const nj = nodes[j];
				let dx = nj.x - ni.x;
				let dy = nj.y - ni.y;
				let d2 = dx * dx + dy * dy;
				if (d2 < 0.01) {
					dx = (Math.random() - 0.5) * 0.5;
					dy = (Math.random() - 0.5) * 0.5;
					d2 = dx * dx + dy * dy + 0.01;
				}
				const dist = Math.sqrt(d2);
				const f = (REPULSION / d2) * a;
				const fx = (dx / dist) * f;
				const fy = (dy / dist) * f;
				ni.vx -= fx;
				ni.vy -= fy;
				nj.vx += fx;
				nj.vy += fy;
			}
		}

		// edge springs
		for (const e of edges) {
			const s = nodes[nodeIndex[e.s]];
			const t = nodes[nodeIndex[e.t]];
			if (!s || !t) continue;
			const dx = t.x - s.x;
			const dy = t.y - s.y;
			const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
			const delta = (dist - SPRING_LEN) * SPRING_K * a;
			const fx = (dx / dist) * delta;
			const fy = (dy / dist) * delta;
			s.vx += fx;
			s.vy += fy;
			t.vx -= fx;
			t.vy -= fy;
		}

		// centering + column bias (volunteers left, children right)
		for (const n of nodes) {
			n.vx += (CX - n.x) * CENTER_K * a;
			n.vy += (CY - n.y) * CENTER_K * a;
			const targetX = n.type === 'volunteer' ? CX - 180 : CX + 180;
			n.vx += (targetX - n.x) * COLUMN_K * a;
		}

		// integrate
		let energy = 0;
		for (const n of nodes) {
			if (n.fx !== null && n.fy !== null) {
				n.x = n.fx;
				n.y = n.fy;
				n.vx = 0;
				n.vy = 0;
				continue;
			}
			n.vx *= DAMPING;
			n.vy *= DAMPING;
			n.x += n.vx;
			n.y += n.vy;
			// walls (soft)
			const r = nodeRadius(n) + 4;
			if (n.x < r) { n.x = r; n.vx *= -0.4; }
			if (n.x > W - r) { n.x = W - r; n.vx *= -0.4; }
			if (n.y < r) { n.y = r; n.vy *= -0.4; }
			if (n.y > H - r) { n.y = H - r; n.vy *= -0.4; }
			energy += n.vx * n.vx + n.vy * n.vy;
		}

		// minimum distance enforcement (collision)
		for (let i = 0; i < nodes.length; i++) {
			const ni = nodes[i];
			for (let j = i + 1; j < nodes.length; j++) {
				const nj = nodes[j];
				const dx = nj.x - ni.x;
				const dy = nj.y - ni.y;
				const d = Math.sqrt(dx * dx + dy * dy);
				const minD = nodeRadius(ni) + nodeRadius(nj) + 4;
				if (d < minD && d > 0.01) {
					const push = (minD - d) / 2;
					const ux = dx / d;
					const uy = dy / d;
					if (ni.fx === null) { ni.x -= ux * push; ni.y -= uy * push; }
					if (nj.fx === null) { nj.x += ux * push; nj.y += uy * push; }
				}
			}
		}

		// cool
		alpha = Math.max(0.02, alpha * 0.992);
		// trigger reactivity
		nodes = nodes;

		raf = requestAnimationFrame(tick);
	}

	$effect(() => {
		raf = requestAnimationFrame(tick);
		return () => {
			if (raf !== null) cancelAnimationFrame(raf);
		};
	});

	function nodeRadius(n: Node): number {
		if (n.type === 'volunteer') return 18 + Math.min(10, n.degree * 1.6);
		return 14 + Math.min(8, n.degree * 1.4);
	}

	function reheat() { alpha = Math.min(1, alpha + 0.5); }

	// pointer → svg coordinates (after transform)
	function svgPoint(evt: PointerEvent): { x: number; y: number } {
		if (!svgEl) return { x: 0, y: 0 };
		const pt = svgEl.createSVGPoint();
		pt.x = evt.clientX;
		pt.y = evt.clientY;
		const ctm = svgEl.getScreenCTM();
		if (!ctm) return { x: 0, y: 0 };
		const inv = pt.matrixTransform(ctm.inverse());
		// undo our pan/zoom transform
		return { x: (inv.x - tx) / scale, y: (inv.y - ty) / scale };
	}

	function onNodePointerDown(e: PointerEvent, id: string) {
		e.stopPropagation();
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		const i = nodeIndex[id];
		const n = nodes[i];
		const p = svgPoint(e);
		dragging = { id, offX: p.x - n.x, offY: p.y - n.y };
		n.fx = n.x;
		n.fy = n.y;
		pinnedId = id;
		reheat();
	}

	function onNodePointerMove(e: PointerEvent) {
		if (!dragging) return;
		const p = svgPoint(e);
		const i = nodeIndex[dragging.id];
		const n = nodes[i];
		n.fx = p.x - dragging.offX;
		n.fy = p.y - dragging.offY;
		nodes = nodes;
	}

	function onNodePointerUp(e: PointerEvent, id: string) {
		(e.currentTarget as Element).releasePointerCapture(e.pointerId);
		const i = nodeIndex[id];
		const n = nodes[i];
		n.fx = null;
		n.fy = null;
		dragging = null;
		reheat();
	}

	// active touch pointers for pinch-zoom
	const activePointers = new Map<number, { x: number; y: number }>();
	let pinchState: { dist: number; midX: number; midY: number; scale: number; tx: number; ty: number } | null = null;

	function onBgPointerDown(e: PointerEvent) {
		if ((e.target as Element).closest('[data-node]')) return;
		activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		pinnedId = null;

		if (activePointers.size === 2 && svgEl) {
			const pts = Array.from(activePointers.values());
			const dx = pts[1].x - pts[0].x;
			const dy = pts[1].y - pts[0].y;
			const rect = svgEl.getBoundingClientRect();
			const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
			pinchState = {
				dist: Math.hypot(dx, dy),
				midX: ((mid.x - rect.left) / rect.width) * W,
				midY: ((mid.y - rect.top) / rect.height) * H,
				scale, tx, ty
			};
			panning = null;
			return;
		}
		panning = { sx: e.clientX, sy: e.clientY, ox: tx, oy: ty };
	}

	function onBgPointerMove(e: PointerEvent) {
		if (activePointers.has(e.pointerId)) {
			activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		}
		if (pinchState && activePointers.size === 2) {
			const pts = Array.from(activePointers.values());
			const dx = pts[1].x - pts[0].x;
			const dy = pts[1].y - pts[0].y;
			const newDist = Math.hypot(dx, dy);
			const ratio = newDist / pinchState.dist;
			const newScale = Math.max(0.4, Math.min(3, pinchState.scale * ratio));
			const k = newScale / pinchState.scale;
			tx = pinchState.midX - (pinchState.midX - pinchState.tx) * k;
			ty = pinchState.midY - (pinchState.midY - pinchState.ty) * k;
			scale = newScale;
			return;
		}
		if (!panning) return;
		tx = panning.ox + (e.clientX - panning.sx);
		ty = panning.oy + (e.clientY - panning.sy);
	}

	function onBgPointerUp(e?: PointerEvent) {
		if (e) activePointers.delete(e.pointerId);
		else activePointers.clear();
		if (activePointers.size < 2) pinchState = null;
		if (activePointers.size === 0) panning = null;
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		if (!svgEl) return;
		const factor = e.deltaY < 0 ? 1.12 : 0.89;
		zoomAt(factor, e.clientX, e.clientY);
	}

	function zoomAt(factor: number, clientX?: number, clientY?: number) {
		if (!svgEl) return;
		const newScale = Math.max(0.4, Math.min(3, scale * factor));
		const rect = svgEl.getBoundingClientRect();
		const cx = clientX ?? rect.left + rect.width / 2;
		const cy = clientY ?? rect.top + rect.height / 2;
		const mx = ((cx - rect.left) / rect.width) * W;
		const my = ((cy - rect.top) / rect.height) * H;
		tx = mx - (mx - tx) * (newScale / scale);
		ty = my - (my - ty) * (newScale / scale);
		scale = newScale;
	}

	function zoomIn() { zoomAt(1.25); }
	function zoomOut() { zoomAt(0.8); }

	function resetView() {
		tx = 0;
		ty = 0;
		scale = 1;
		pinnedId = null;
		reheat();
	}

	function shuffle() {
		for (const n of nodes) {
			n.x = Math.random() * (W - 100) + 50;
			n.y = Math.random() * (H - 100) + 50;
			n.vx = 0; n.vy = 0;
		}
		alpha = 1;
		nodes = nodes;
	}

	function edgePath(e: Edge): string {
		const s = nodes[nodeIndex[e.s]];
		const t = nodes[nodeIndex[e.t]];
		if (!s || !t) return '';
		const mx = (s.x + t.x) / 2;
		const my = (s.y + t.y) / 2;
		// gentle curve perpendicular to edge
		const dx = t.x - s.x;
		const dy = t.y - s.y;
		const len = Math.sqrt(dx * dx + dy * dy) || 1;
		const nx = -dy / len;
		const ny = dx / len;
		const bow = Math.min(28, len * 0.12);
		const cx = mx + nx * bow;
		const cy = my + ny * bow;
		return `M${s.x},${s.y} Q${cx},${cy} ${t.x},${t.y}`;
	}

</script>

<div class="card graph-card">
	<div class="graph-header">
		<div class="graph-title">
			<h2 style="margin:0;">Connection Map</h2>
			<p class="graph-stats">
				<span><strong>{stats.volunteers}</strong> volunteers</span>
				<span><strong>{stats.children}</strong> children</span>
				<span><strong>{stats.connections}</strong> links</span>
				{#if stats.isolated > 0}<span><strong>{stats.isolated}</strong> unlinked</span>{/if}
			</p>
		</div>
		<div class="graph-controls">
			<input
				type="search"
				placeholder="Highlight by name..."
				bind:value={query}
				aria-label="Highlight nodes by name"
				class="graph-search"
			/>
			<div class="ctrl-group" role="toolbar" aria-label="Graph view controls">
				<button type="button" class="ctrl-btn" onclick={zoomOut} aria-label="Zoom out">−</button>
				<button type="button" class="ctrl-btn" onclick={zoomIn} aria-label="Zoom in">+</button>
				<button type="button" class="ctrl-btn" onclick={shuffle} aria-label="Shuffle layout" title="Shuffle layout">↻</button>
				<button type="button" class="ctrl-btn" onclick={resetView} aria-label="Reset view" title="Reset view">⊙</button>
			</div>
		</div>
	</div>

	<div class="legend">
		<span class="lg-item"><span class="lg-dot lg-vol"></span> Volunteer</span>
		<span class="lg-item"><span class="lg-dot lg-child"></span> Child</span>
		<span class="lg-tip">drag nodes · pinch / scroll to zoom · drag background to pan</span>
	</div>

	{#if nodes.length === 0}
		<div class="graph-empty">No data to visualize yet.</div>
	{:else}
		<div class="graph-wrap">
			<svg
				bind:this={svgEl}
				viewBox="0 0 {W} {H}"
				onpointerdown={onBgPointerDown}
				onpointermove={onBgPointerMove}
				onpointerup={onBgPointerUp}
				onpointerleave={onBgPointerUp}
				onwheel={onWheel}
				role="img"
				aria-label="Volunteer to child connection graph"
			>
				<defs>
					<radialGradient id="bgWash" cx="20%" cy="15%" r="90%">
						<stop offset="0%" stop-color="#FFFFFF" />
						<stop offset="55%" stop-color="#FAFBFD" />
						<stop offset="100%" stop-color="#EEF1F5" />
					</radialGradient>
					<filter id="nodeShadow" x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur in="SourceAlpha" stdDeviation="2" />
						<feOffset dx="0" dy="1.5" result="off" />
						<feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
						<feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
					</filter>
				</defs>

				<rect width={W} height={H} fill="url(#bgWash)" />

				<g transform="translate({tx},{ty}) scale({scale})">
					<!-- edges -->
					<g class="edges">
						{#each edges as e (e.s + '-' + e.t)}
							{@const hl = isEdgeHighlighted(e)}
							{@const dim = isEdgeDimmed(e)}
							<path
								d={edgePath(e)}
								fill="none"
								stroke={hl ? '#58A4B0' : '#A9BCD0'}
								stroke-width={hl ? 2 : 1.2}
								stroke-opacity={dim ? 0.06 : hl ? 0.9 : 0.45}
								stroke-linecap="round"
							/>
						{/each}
					</g>

					<!-- nodes -->
					<g class="nodes">
						{#each nodes as n (n.id)}
							{@const r = nodeRadius(n)}
							{@const hl = isHighlighted(n.id)}
							{@const dim = isDimmed(n.id)}
							{@const isVol = n.type === 'volunteer'}
							{@const fill = isVol ? '#58A4B0' : '#DAA49A'}
							{@const textColor = isVol ? '#FFFFFF' : '#373F51'}
							<g
								data-node
								transform="translate({n.x},{n.y})"
								opacity={dim ? 0.22 : 1}
								onpointerdown={(e) => onNodePointerDown(e, n.id)}
								onpointermove={onNodePointerMove}
								onpointerup={(e) => onNodePointerUp(e, n.id)}
								onmouseenter={() => (hoveredId = n.id)}
								onmouseleave={() => (hoveredId = null)}
								role="button"
								tabindex="0"
								style="cursor:grab;"
							>
								<!-- invisible larger hitbox for easier touch tapping -->
								<circle r={Math.max(r + 8, 22)} fill="transparent" />
								{#if hl}
									<circle r={r + 10} fill={fill} opacity="0.12" style="pointer-events:none;" />
									<circle r={r + 5} fill={fill} opacity="0.18" style="pointer-events:none;" />
								{/if}
								{#if n.type === 'child' && n.progress > 0}
									<!-- track -->
									<circle r={r + 4.5} fill="none" stroke="#E1E5EC" stroke-width="2" />
									<!-- progress arc -->
									<circle
										r={r + 4.5}
										fill="none"
										stroke={n.progress >= 1 ? '#5BAE7F' : '#58A4B0'}
										stroke-width="2"
										stroke-dasharray="{Math.min(1, n.progress) * 2 * Math.PI * (r + 4.5)} {2 * Math.PI * (r + 4.5)}"
										transform="rotate(-90)"
										stroke-linecap="round"
									/>
								{/if}
								<circle
									r={r}
									fill={fill}
									stroke="white"
									stroke-width={hl ? 3 : 2}
									filter="url(#nodeShadow)"
								/>
								<!-- subtle inner highlight -->
								<ellipse
									cx={-r * 0.25}
									cy={-r * 0.35}
									rx={r * 0.55}
									ry={r * 0.35}
									fill="white"
									opacity="0.18"
									style="pointer-events:none;"
								/>
								<text
									text-anchor="middle"
									dy="4"
									font-size={r > 22 ? '12' : '11'}
									font-weight="700"
									fill={textColor}
									letter-spacing="0.5"
									style="pointer-events:none;user-select:none;"
								>{n.label.split(' ').map((p) => p[0]).slice(0, 2).join('')}</text>
								{#if hl || scale > 1.2}
									<g style="pointer-events:none;">
										<rect
											x={-(n.label.length * 3.4 + 10)}
											y={r + 8}
											width={n.label.length * 6.8 + 20}
											height="22"
											rx="11"
											fill="white"
											stroke="#E1E5EC"
											stroke-width="1"
										/>
										<text
											text-anchor="middle"
											y={r + 23}
											font-size="11"
											font-weight="600"
											fill="#373F51"
										>{n.label}</text>
									</g>
								{/if}
							</g>
						{/each}
					</g>
				</g>
			</svg>

			{#if focusId}
				{@const fn = nodes[nodeIndex[focusId]]}
				{#if fn}
					<div class="info-card">
						<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
							<span class="lg-dot {fn.type === 'volunteer' ? 'lg-vol' : 'lg-child'}"></span>
							<strong>{fn.label}</strong>
						</div>
						<div style="font-size:0.8rem;color:var(--text-light);">
							{fn.type === 'volunteer' ? 'Volunteer' : (fn.status === 'tryout' ? 'Tryout swimmer' : 'Full member')}
						</div>
						<div style="font-size:0.85rem;margin-top:6px;">
							{#if fn.type === 'volunteer'}
								Linked to <strong>{fn.degree}</strong> child{fn.degree === 1 ? '' : 'ren'} · <strong>{fn.sub}</strong>
							{:else}
								<strong>{fn.degree}</strong> volunteer{fn.degree === 1 ? '' : 's'} ·
								<strong>{Math.round(fn.progress * 100)}%</strong> of goal
							{/if}
						</div>
						{#if fn.type === 'volunteer'}
							<a href="/organizer/volunteers/{fn.refId}" style="font-size:0.85rem;display:inline-block;margin-top:6px;">View profile →</a>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	.graph-card { margin-bottom: 20px; padding: 20px; }
	.graph-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
		flex-wrap: wrap;
		margin-bottom: 12px;
	}
	.graph-title { min-width: 0; flex: 1 1 auto; }
	.graph-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 14px;
		font-size: 0.85rem;
		color: var(--text-light);
		margin-top: 4px;
	}
	.graph-stats strong { color: var(--text); font-weight: 600; }
	.graph-controls {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
		flex: 0 0 auto;
	}
	.graph-search {
		min-height: 40px;
		padding: 8px 12px;
		font-size: 0.9rem;
		max-width: 220px;
		min-width: 0;
	}
	.ctrl-group {
		display: inline-flex;
		gap: 4px;
		background: white;
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 3px;
	}
	.ctrl-btn {
		appearance: none;
		background: transparent;
		border: none;
		color: var(--text);
		min-width: 38px;
		min-height: 38px;
		padding: 6px 10px;
		font-size: 1rem;
		font-weight: 600;
		border-radius: 9px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-shadow: none;
		transition: background 0.15s;
		-webkit-tap-highlight-color: transparent;
	}
	.ctrl-btn:hover { background: rgba(88,164,176,0.10); transform: none; box-shadow: none; }
	.ctrl-btn:focus-visible { box-shadow: 0 0 0 2px var(--ring); }

	.legend {
		display: flex;
		align-items: center;
		gap: 14px;
		font-size: 0.85rem;
		color: var(--text);
		margin-bottom: 10px;
		flex-wrap: wrap;
	}
	.lg-item { display: inline-flex; align-items: center; gap: 6px; }
	.lg-tip { color: var(--text-light); font-size: 0.78rem; }
	.lg-dot {
		display: inline-block;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.lg-vol { background: #58A4B0; box-shadow: inset 0 0 0 1.5px white; }
	.lg-child { background: #DAA49A; box-shadow: inset 0 0 0 1.5px white; }

	.graph-wrap {
		position: relative;
		width: 100%;
		border-radius: 16px;
		overflow: hidden;
		background: #FAFBFD;
		border: 1px solid #E1E5EC;
	}
	.graph-wrap svg {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 900 / 560;
		max-height: 70vh;
		touch-action: none;
		user-select: none;
		cursor: grab;
	}
	.graph-wrap svg:active { cursor: grabbing; }
	.graph-empty {
		padding: 48px 20px;
		text-align: center;
		color: var(--text-light);
		background: #FAFBFD;
		border: 1px solid #E1E5EC;
		border-radius: 16px;
	}
	.info-card {
		position: absolute;
		top: 12px;
		right: 12px;
		background: white;
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 12px 14px;
		min-width: 200px;
		max-width: 260px;
		box-shadow: var(--shadow-hover);
		pointer-events: auto;
		font-size: 0.9rem;
	}

	@media (max-width: 720px) {
		.graph-controls { width: 100%; justify-content: space-between; }
		.graph-search { flex: 1 1 auto; max-width: none; }
	}
	@media (max-width: 600px) {
		.graph-card { padding: 16px; }
		.graph-wrap svg { aspect-ratio: 1 / 1; max-height: 60vh; }
		.lg-tip { width: 100%; }
		.info-card {
			position: static;
			margin-top: 10px;
			max-width: 100%;
			width: 100%;
		}
	}
	@media (max-width: 380px) {
		.graph-card { padding: 12px; }
		.graph-stats { font-size: 0.78rem; gap: 2px 10px; }
	}
</style>
