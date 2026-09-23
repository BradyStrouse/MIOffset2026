<!--
	ManualCoords - type a latitude and longitude to move the map.

	For users working from surveyed coordinates rather than an address. These
	move the camera only; a building's own position is edited in BuildingPanel.

	Values are drafted while typing and committed on blur or Enter rather than
	per keystroke - otherwise a half-typed "-8" would fly the camera off to
	longitude -8 mid-entry. When not being edited, the fields mirror wherever
	the camera currently is.
-->
<script>
	// --- Imports ---
	import { appState } from "$lib/state/appState.svelte.js";
	import { LATLNG_PRECISION } from "$lib/state/defaultValues.svelte.js";

	// These inputs move the map camera. They are not a building's position -
	// buildings are positioned by dragging their markers.
	let latDraft = $state("");
	let lngDraft = $state("");
	let editing = $state(false);

	// While the user isn't typing, mirror wherever the camera currently is.
	let latDisplay = $derived(
		editing
			? latDraft
			: Number(appState.location.lat).toFixed(LATLNG_PRECISION),
	);
	let lngDisplay = $derived(
		editing
			? lngDraft
			: Number(appState.location.lng).toFixed(LATLNG_PRECISION),
	);

	function beginEdit() {
		latDraft = String(appState.location.lat ?? "");
		lngDraft = String(appState.location.lng ?? "");
		editing = true;
	}

	/**
	 * Commit on blur or Enter rather than per keystroke - otherwise a half-typed
	 * "-8" would fly the camera off to longitude -8 mid-entry.
	 */
	function commit() {
		if (!editing) return;
		editing = false;

		const lat = Number(latDraft);
		const lng = Number(lngDraft);
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
		if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

		appState.location.lat = lat;
		appState.location.lng = lng;
		appState.location.fly = true;
	}

	function handleKeydown(e) {
		if (e.key === "Enter") {
			e.preventDefault();
			e.currentTarget.blur();
		} else if (e.key === "Escape") {
			editing = false;
			e.currentTarget.blur();
		}
	}
</script>

<section class="form-wrapper">
	<div class="coord-row">
		<div class="form-group">
			<label for="latitude">View latitude</label>
			<input
				type="number"
				id="latitude"
				value={latDisplay}
				oninput={(e) => (latDraft = e.currentTarget.value)}
				onfocus={beginEdit}
				onblur={commit}
				onkeydown={handleKeydown}
				min={-90}
				max={90}
				step="any"
				placeholder="e.g. 42.729"
			/>
		</div>

		<div class="form-group">
			<label for="longitude">View longitude</label>
			<input
				type="number"
				id="longitude"
				value={lngDisplay}
				oninput={(e) => (lngDraft = e.currentTarget.value)}
				onfocus={beginEdit}
				onblur={commit}
				onkeydown={handleKeydown}
				min={-180}
				max={180}
				step="any"
				placeholder="e.g. -84.472"
			/>
		</div>
	</div>
</section>

<style>
	/* Layout */
	.form-wrapper {
		width: 100%;
	}

	.coord-row {
		display: flex;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.2rem;
	}

	label {
		font-weight: 500;
		font-size: 0.9rem;
		color: #333;
	}

	/* Inputs */
	input {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-family: inherit;
		width: 100%;
		transition: all 0.3s ease;
	}

	/* Spinner Override */
	/* Chrome, Safari, Edge, Opera */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type="number"] {
		-webkit-appearance: textfield;
		-moz-appearance: textfield;
		appearance: textfield;
	}

	/* Focus & Hover */
	input:hover {
		border-color: #999;
	}

	input:focus {
		outline: none;
		border-color: #4caf50;
		box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
	}
</style>
