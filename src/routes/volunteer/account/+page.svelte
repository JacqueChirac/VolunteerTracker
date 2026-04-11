<script lang="ts">
	import { store, type ChildStatus } from '$lib/store.svelte';

	let showAddChild = $state(false);
	let showLinkChild = $state(false);

	// Add child form state
	let newFirstName = $state('');
	let newLastName = $state('');
	let newLevel = $state('');
	let newStatus = $state<ChildStatus>('full_member');
	let addChildError = $state<string | null>(null);
	let addChildSuccess = $state(false);

	// Link child form state
	let linkChildId = $state<number | ''>('');
	let linkError = $state<string | null>(null);
	let linkSuccess = $state(false);

	let unlinkSuccess = $state(false);

	// Password change
	let currentPassword = $state('');
	let newPassword = $state('');
	let passwordError = $state<string | null>(null);
	let passwordSuccess = $state(false);

	const user = $derived(store.currentUser);

	const myChildren = $derived.by(() => {
		if (!user) return [];
		return store.getLinkedChildren(user.id).map((child) => ({
			...child,
			totalHours: store.getChildTotalHours(child.id),
			requiredHours: store.getHoursRequired(child.status)
		}));
	});

	const unlinkedChildren = $derived(store.getUnlinkedChildrenForCurrentUser());

	function clearFlashes() {
		addChildError = null;
		addChildSuccess = false;
		linkError = null;
		linkSuccess = false;
		unlinkSuccess = false;
	}

	function handleAddChild(e: Event) {
		e.preventDefault();
		clearFlashes();
		if (!newFirstName || !newLastName) {
			addChildError = 'First and last name are required.';
			return;
		}
		store.addChildForCurrentUser({
			firstName: newFirstName.trim(),
			lastName: newLastName.trim(),
			level: newLevel.trim(),
			status: newStatus
		});
		newFirstName = '';
		newLastName = '';
		newLevel = '';
		newStatus = 'full_member';
		addChildSuccess = true;
		showAddChild = false;
	}

	function handleLinkChild(e: Event) {
		e.preventDefault();
		clearFlashes();
		if (!linkChildId) {
			linkError = 'Please select a child.';
			return;
		}
		const result = store.linkChildToCurrentUser(Number(linkChildId));
		if (!result.ok) {
			linkError = result.error;
			return;
		}
		linkChildId = '';
		linkSuccess = true;
		showLinkChild = false;
	}

	function handleUnlink(childId: number, firstName: string) {
		if (!confirm(`Unlink ${firstName} from your account?`)) return;
		clearFlashes();
		store.unlinkChildFromCurrentUser(childId);
		unlinkSuccess = true;
	}

	function handleChangePassword(e: Event) {
		e.preventDefault();
		passwordError = null;
		passwordSuccess = false;
		const result = store.changePassword(currentPassword, newPassword);
		if (!result.ok) {
			passwordError = result.error;
			return;
		}
		currentPassword = '';
		newPassword = '';
		passwordSuccess = true;
	}
</script>

<h1>My Account</h1>
<p style="color:var(--text-light);margin-bottom:24px;">
	Manage your children and account settings.
</p>

<div class="grid-2">
	<div>
		<div
			style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;"
		>
			<h2>My Children</h2>
			<div style="display:flex;gap:6px;">
				<button
					class="btn btn-accent"
					style="font-size:0.85rem;padding:6px 14px;"
					onclick={() => {
						showLinkChild = !showLinkChild;
						showAddChild = false;
					}}
				>
					{showLinkChild ? 'Cancel' : 'Link Existing'}
				</button>
				<button
					class="btn btn-primary"
					style="font-size:0.85rem;padding:6px 14px;"
					onclick={() => {
						showAddChild = !showAddChild;
						showLinkChild = false;
					}}
				>
					{showAddChild ? 'Cancel' : '+ New Child'}
				</button>
			</div>
		</div>

		{#if addChildSuccess}
			<div
				class="card"
				style="background:#d4edda;border:1px solid #c3e6cb;margin-bottom:12px;"
			>
				<p style="color:#155724;">Child added successfully.</p>
			</div>
		{/if}

		{#if unlinkSuccess}
			<div
				class="card"
				style="background:#d4edda;border:1px solid #c3e6cb;margin-bottom:12px;"
			>
				<p style="color:#155724;">Child unlinked from your account.</p>
			</div>
		{/if}

		{#if linkSuccess}
			<div
				class="card"
				style="background:#d4edda;border:1px solid #c3e6cb;margin-bottom:12px;"
			>
				<p style="color:#155724;">Child linked to your account.</p>
			</div>
		{/if}

		{#if addChildError}
			<p class="error" style="margin-bottom:12px;">{addChildError}</p>
		{/if}
		{#if linkError}
			<p class="error" style="margin-bottom:12px;">{linkError}</p>
		{/if}

		{#if showLinkChild}
			<div class="card" style="margin-bottom:16px;">
				<h3>Link an Existing Child</h3>
				<p
					style="font-size:0.85rem;color:var(--text-light);margin-top:4px;margin-bottom:12px;"
				>
					If another guardian already added your child, select them here to link to your account.
					Your hours will count toward their goal.
				</p>
				{#if unlinkedChildren.length === 0}
					<p style="color:var(--text-light);">
						No unlinked children available. Use "New Child" to create one.
					</p>
				{:else}
					<form onsubmit={handleLinkChild}>
						<div class="form-group">
							<label for="childId">Select Child</label>
							<select id="childId" bind:value={linkChildId} required>
								<option value="">-- Select a child --</option>
								{#each unlinkedChildren as child}
									<option value={child.id}>
										{child.firstName}
										{child.lastName}
										{child.level ? ` (${child.level})` : ''} -- {child.status === 'tryout'
											? 'Tryout'
											: 'Full Member'}
									</option>
								{/each}
							</select>
						</div>
						<button type="submit" class="btn btn-accent" style="width:100%;">Link Child</button>
					</form>
				{/if}
			</div>
		{/if}

		{#if showAddChild}
			<div class="card" style="margin-bottom:16px;">
				<h3>Add a New Child</h3>
				<form onsubmit={handleAddChild} style="margin-top:12px;">
					<div class="form-group">
						<label for="firstName">First Name</label>
						<input id="firstName" type="text" bind:value={newFirstName} required />
					</div>
					<div class="form-group">
						<label for="lastName">Last Name</label>
						<input id="lastName" type="text" bind:value={newLastName} required />
					</div>
					<div class="form-group">
						<label for="level">Level</label>
						<input
							id="level"
							type="text"
							bind:value={newLevel}
							placeholder="e.g. Beginner, Intermediate, Competitive"
						/>
					</div>
					<div class="form-group">
						<label for="status">Status</label>
						<select id="status" bind:value={newStatus}>
							<option value="full_member">Full Member (30 hrs/year)</option>
							<option value="tryout">Tryout (4 hrs)</option>
						</select>
					</div>
					<button type="submit" class="btn btn-primary" style="width:100%;">Add Child</button>
				</form>
			</div>
		{/if}

		{#if myChildren.length === 0}
			<div class="card">
				<p style="color:var(--text-light);">
					No children linked yet. Add a new child or link an existing one to start tracking
					hours.
				</p>
			</div>
		{/if}

		{#each myChildren as child}
			<div class="card" style="margin-bottom:12px;">
				<div
					style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:4px;"
				>
					<h3>{child.firstName} {child.lastName}</h3>
					<div style="display:flex;align-items:center;gap:8px;">
						<span style="font-size:0.85rem;color:var(--text-light);">
							{child.status === 'tryout' ? 'Tryout' : 'Full Member'}
							{#if child.level}&middot; {child.level}{/if}
						</span>
						<button
							class="btn btn-danger"
							style="padding:2px 8px;font-size:0.75rem;"
							onclick={() => handleUnlink(child.id, child.firstName)}
						>
							Unlink
						</button>
					</div>
				</div>
				<div class="progress-bar">
					<div
						class="progress-bar-fill"
						style="width:{Math.min(
							100,
							(child.totalHours / child.requiredHours) * 100
						)}%;{child.totalHours >= child.requiredHours ? 'background:#27ae60' : ''}"
					>
						{child.totalHours} / {child.requiredHours} hrs
					</div>
				</div>
				<p style="font-size:0.85rem;color:var(--text-light);margin-top:4px;">
					{#if child.totalHours >= child.requiredHours}
						Goal reached!
					{:else}
						{(child.requiredHours - child.totalHours).toFixed(1)} hours remaining
					{/if}
				</p>
			</div>
		{/each}
	</div>

	<div>
		<h2>Change Password</h2>
		<div class="card" style="margin-top:12px;">
			{#if passwordSuccess}
				<div
					style="background:#d4edda;border:1px solid #c3e6cb;padding:12px;border-radius:8px;margin-bottom:12px;"
				>
					<p style="color:#155724;">Password changed successfully.</p>
				</div>
			{/if}
			{#if passwordError}
				<p class="error" style="margin-bottom:12px;">{passwordError}</p>
			{/if}
			<form onsubmit={handleChangePassword}>
				<div class="form-group">
					<label for="currentPassword">Current Password</label>
					<input id="currentPassword" type="password" bind:value={currentPassword} required />
				</div>
				<div class="form-group">
					<label for="newPassword">New Password</label>
					<input id="newPassword" type="password" bind:value={newPassword} required />
				</div>
				<button type="submit" class="btn btn-primary" style="width:100%;">Change Password</button>
			</form>
		</div>
	</div>
</div>
