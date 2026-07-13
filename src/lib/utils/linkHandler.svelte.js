import { onMount } from "svelte";
import { appState, entries } from "$lib/state/appState.svelte.js";
import { encodeState, decodeState } from "$lib/utils/permalink.js";
import { getAndRun } from "$lib/utils/model/runModel.svelte.ts";

/**
 * Wires a page up to the ?data= permalink. Call once from a page's <script>
 * top level — it registers an $effect and onMount, which must run during
 * component init.
 *
 * Decoding happens synchronously (not in onMount) so appState.location is set
 * before MapView mounts; otherwise the map renders at default coords then jumps
 * to the permalink location.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.run=true] run the model after restoring entries
 * @returns {{ decodedState: ReturnType<typeof decodeState> }}
 */
export function usePermalink({ run = true } = {}) {
	const decodedState = decodeState(
		new URLSearchParams(window.location.search).get("data"),
	);

	if (decodedState) {
		appState.location.lat = decodedState.location.lat;
		appState.location.lng = decodedState.location.lng;
		appState.location.address = decodedState.location.address;
	}

	onMount(async () => {
		if (decodedState) {
			const permalinkTotal = decodedState.entries.reduce(
				(sum, e) => sum + (e.totalEmission ?? 0),
				0,
			);
			const currentTotal = entries.reduce(
				(sum, e) => sum + (e.totalEmission ?? 0),
				0,
			);
			if (currentTotal !== permalinkTotal) {
				entries.splice(0, entries.length);
				for (const entry of decodedState.entries) entries.push(entry);
			}
			if (run) await getAndRun();
		} else if (run && appState.geoJSONData?.outputs) {
			getAndRun();
		}
	});

	$effect(() => {
		const encoded = encodeState(entries, appState.location);
		window.history.replaceState(null, "", `?data=${encoded}`);
	});

	return { decodedState };
}
