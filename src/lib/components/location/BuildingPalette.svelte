<!--
	BuildingPalette - the drag source for adding a building to the map.

	Doubles as a click-to-arm control: HTML5 drag-and-drop never fires on touch
	devices, so the same button toggles appState.placing and the next map click
	consumes it. Dragging supersedes an armed click.

	The dataTransfer.setData call in handleDragStart is not optional - Firefox
	refuses to begin a drag without it.
-->
<script>
	// --- Imports ---
	import { appState, buildings } from "$lib/state/appState.svelte.js";
	import { BUILDING_DRAG_TYPE } from "$lib/state/defaultValues.svelte.js";

	let { onPlaceRequest = () => {} } = $props();

	function handleDragStart(e) {
		// setData is required for Firefox to start the drag at all.
		e.dataTransfer.setData(BUILDING_DRAG_TYPE, "1");
		e.dataTransfer.effectAllowed = "copy";
		appState.placing = false; // dragging supersedes an armed click-to-place
	}

	// Click-to-arm is the touch and keyboard path: HTML5 drag-and-drop does not
	// fire on touch devices, so the same control doubles as a one-shot mode that
	// the next map click consumes.
	function handleClick() {
		appState.placing = !appState.placing;
		if (appState.placing) onPlaceRequest();
	}
</script>

<div class="palette">
	<button
		type="button"
		class="chip"
		class:armed={appState.placing}
		draggable="true"
		ondragstart={handleDragStart}
		ondragend={() => (appState.placing = false)}
		onclick={handleClick}
		aria-pressed={appState.placing}
	>
		<svg class="chip-icon" viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M3 11.5 12 4l9 7.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linejoin="round"
			/>
			<path d="M12 22v-6h0" fill="none" stroke="currentColor" stroke-width="1.8" />
		</svg>
		<span>{appState.placing ? "Click the map" : "Add building"}</span>
	</button>

	<p class="hint">
		{#if appState.placing}
			Click a spot to drop it, or press Esc to cancel.
		{:else if buildings.length === 0}
			Drag onto the map to place your first structure.
		{:else}
			Drag on more, or drag a marker to reposition it.
		{/if}
	</p>
</div>

<style>
	.palette {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		background: white;
		border: 1px solid var(--color-kelly-green);
		border-radius: 8px;
		padding: 0.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		max-width: 240px;
	}

	.chip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.6rem;
		border: 1px dashed var(--color-kelly-green);
		border-radius: 6px;
		background: #f6fbf6;
		color: #2c3e50;
		font-family: inherit;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: grab;
		transition:
			background 0.15s,
			border-color 0.15s,
			transform 0.15s;
	}

	.chip:hover {
		background: #eaf6ea;
		transform: translateY(-1px);
	}

	.chip:active {
		cursor: grabbing;
		transform: none;
	}

	.chip.armed {
		background: var(--color-kelly-green);
		border-style: solid;
		border-color: var(--color-kelly-green);
		color: white;
	}

	.chip-icon {
		width: 22px;
		height: 22px;
		flex-shrink: 0;
	}

	.hint {
		margin: 0;
		font-size: 0.75rem;
		line-height: 1.3;
		color: #666;
	}
</style>
