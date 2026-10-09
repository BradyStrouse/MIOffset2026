import { onMount } from "svelte";
import {
	appState,
	buildings,
	replaceBuildings,
} from "$lib/state/appState.svelte.js";
import { browser } from "$app/environment";
import { encodeState, decodeState } from "$lib/utils/permalink.js";
import { normalizeTechnologies } from "$lib/utils/model/OdorEmissionFactor.js";
import { getAndRun } from "$lib/utils/model/runModel.svelte.ts";

/**
 * Wires a page up to the ?data= permalink. Call once from a page's <script>
 * top level - it registers an $effect and onMount, which must run during
 * component init.
 *
 * Decoding happens synchronously (not in onMount) so appState.location is set
 * before MapView mounts; otherwise the map renders at default coords then jumps
 * to the permalink location.  On the server (SSR) window is unavailable, so
 * decodedState is null and all side-effects are skipped until hydration.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.run=true] run the model after restoring buildings
 * @returns {{ decodedState: ReturnType<typeof decodeState> }}
 */
import { BUILDING_LATLNG_PRECISION } from "$lib/state/defaultValues.svelte.js";

export function usePermalink({ run = true } = {}) {
	const decodedState = browser
		? decodeState(new URLSearchParams(window.location.search).get("data"))
		: null;

	if (decodedState) {
		appState.location.lat = decodedState.location.lat;
		appState.location.lng = decodedState.location.lng;
		appState.location.address = decodedState.location.address;

		// Restore synchronously too: MapView fits its camera to the buildings on
		// mount, so they have to exist before it initialises.
		if (!sameBuildings(buildings, decodedState.buildings))
			replaceBuildings(decodedState.buildings);
	}

	onMount(async () => {
		if (run && buildings.length > 0) await getAndRun();
	});

	$effect(() => {
		const encoded = encodeState(buildings, appState.location);
		window.history.replaceState(null, "", `?data=${encoded}`);
	});

	return { decodedState };
}

/**
 * Cheap identity check so navigating between pages in the same session does not
 * discard and rebuild the buildings the user is already working on - which
 * would drop their ids and therefore the current selection.
 */
function sameBuildings(current, incoming) {
	// Coordinates are compared at the precision the link stores, since the
	// in-memory value carries more digits than the round-trip preserves.
	const coord = (value) => Number(value).toFixed(BUILDING_LATLNG_PRECISION);

	if (current.length !== incoming.length) return false;
	return current.every((b, i) => {
		const other = incoming[i];
		return (
			b.name === other.name &&
			coord(b.lat) === coord(other.lat) &&
			coord(b.lng) === coord(other.lng) &&
			b.formType === other.formType &&
			b.species === other.species &&
			b.animalType === other.animalType &&
			b.housingType === other.housingType &&
			b.storageType === other.storageType &&
			normalizeTechnologies(b.technology).join() ===
				normalizeTechnologies(other.technology).join() &&
			String(b.area) === String(other.area) &&
			b.manualEmission === other.manualEmission
		);
	});
}
