import { tick } from "svelte";
import {
	geodeticDistance,
	closestGridPoint,
} from "$lib/utils/model/fodLocalModel/geo.js";

import {
	WindData,
	type WindDataRecord,
} from "$lib/utils/model/fodLocalModel/windData";

import {
	legacyFodModel,
	type ModelOutput,
} from "$lib/utils/model/fodLocalModel/fodModel";

import { appState, site } from "$lib/state/appState.svelte.js";

// ── wind data ─────────────────────────────────────────────────────────────
let gridX = $state<number | null>(null);
let gridY = $state<number | null>(null);
let windData = $state<WindDataRecord | null>(null);
let flattenedByDataset = $derived(
	windData ? WindData.flattenAll(windData) : null,
);
let errorMsg = $state("");

// ── GeoJSON builder (written by copoilet, trust with caution) ────────────

// Each of the 80 model rows corresponds to a bearing at 4.5° increments
// clockwise from North (row 0 = N = 0°, row 5 = NNE = 22.5°, …).
const ROW_BEARINGS = Array.from({ length: 80 }, (_, i) => i * 4.5);

/**
 * Converts raw model output into the GeoJSON FeatureCollection and plain-text
 * setback table that the rest of the app consumes.
 *
 * Each of the three threshold frequencies (1.5 %, 3 %, 5 %) becomes a separate
 * Polygon feature whose vertices are the geodetic destination points computed
 * by walking every one of the 80 bearing rows out to the model's predicted
 * setback distance.  The resulting object is written to appState.geoJSONData
 * and drives both the map layer (outputs.map.data) and the FootprintTable
 * component (outputs.table.data).
 */
function buildGeoJSONData(
	result: ModelOutput,
	lat: number,
	lon: number,
	E: number,
) {
	const thresholds = [
		{ col: 0, name: "Frequency: 1.5%" },
		{ col: 1, name: "Frequency: 3%" },
		{ col: 2, name: "Frequency: 5%" },
	];

	const features = thresholds.map(({ col, name }) => {
		const ring: [number, number][] = ROW_BEARINGS.map((bearing, i) => {
			const point = geodeticDistance(lat, lon, result.D[i][col], bearing);
			return [point.lon, point.lat]; // GeoJSON is [lon, lat]
		});
		ring.push(ring[0]); // close the polygon
		return {
			type: "Feature" as const,
			properties: { name, odor_emission_factor: E },
			geometry: { type: "Polygon" as const, coordinates: [ring] },
		};
	});


	// Table rows: label + 3 threshold distances, space-separated.
	// FootprintTable.svelte slices off the first 2 header lines then splits
	// each remaining line on whitespace to get [direction, pct5, pct3, pct1_5].
	const tableRows = result.setbackTable
		.map(
			(r) =>
				`${r.label}  ${r.d5pct.toFixed(2)}  ${r.d3pct.toFixed(2)}  ${r.d1_5pct.toFixed(2)}`,
		)
		.join("\n");

	return {
		sourceLat: lat,
		sourceLng: lon,
		outputs: {
			map: { data: { type: "FeatureCollection", features } },
			table: { data: `Toward  Distance_in_Miles\n5%  3%  1.5%\n${tableRows}` },
		},
	};
}

// ── wind data cache ───────────────────────────────────────────────────────

const WIND_CACHE_SIZE = 10;
const windCache = new Map<string, WindDataRecord>();
const windCacheOrder: string[] = [];

// ── internal helpers ──────────────────────────────────────────────────────

/**
 * Finds the reanalysis grid cell (gridX, gridY) closest to the source point and
 * stores it in module state.  Must be called before fetchWindData() so the
 * correct grid coordinates are used when building the S3 request URL.
 */
function updateGridCoords(lat: number, lon: number) {
	const result = closestGridPoint(lat, lon);
	gridX = result[0];
	gridY = result[1];
}

/**
 * Fetches historical wind data for the current grid cell from the /api/wind
 * endpoint and stores it in the module-level windData reactive variable.
 *
 * Results are cached by grid coordinates (up to WIND_CACHE_SIZE entries) so
 * that navigating back to a previously visited location avoids a redundant
 * network round-trip.  On error, sets errorMsg and leaves windData null so
 * the caller can bail out cleanly.
 */
async function fetchWindData() {
	errorMsg = "";
	windData = null;

	const x = gridX;
	const y = gridY;

	if (x === null || x < 0 || x > 276) {
		errorMsg = "Grid X must be an integer between 0 and 276.";
		return;
	}
	if (y === null || y < 0 || y > 348) {
		errorMsg = "Grid Y must be an integer between 0 and 348.";
		return;
	}

	const cacheKey = `${x},${y}`;
	if (windCache.has(cacheKey)) {
		windData = windCache.get(cacheKey)!;
		return;
	}

	try {
		const res = await fetch(`/api/wind?x=${x}&y=${y}`);
		const body = await res.json();
		if (!res.ok) {
			errorMsg = body.error ?? `Server error ${res.status}`;
			return;
		}
		windData = body as WindDataRecord;

		windCache.set(cacheKey, windData);
		windCacheOrder.push(cacheKey);
		if (windCacheOrder.length > WIND_CACHE_SIZE) {
			windCache.delete(windCacheOrder.shift()!);
		}
	} catch (err) {
		errorMsg =
			err instanceof Error ? err.message : "Unknown error fetching data.";
	}
}

/**
 * Runs the synchronous FOD odor dispersion model on a background task queue
 * tick so the browser can repaint (e.g. show a loading spinner) before the
 * heavy computation blocks the main thread.
 *
 * Returns the model output, or null if wind data is unavailable or the model
 * throws.
 */
function runModelDeferred(E: number): Promise<ModelOutput | null> {
	const data = flattenedByDataset;
	if (!data) return Promise.resolve(null);

	// setTimeout(0) yields to the browser so the spinner paints before
	// the synchronous model computation blocks the main thread.
	return new Promise((resolve) => {
		setTimeout(() => {
			try {
				resolve(legacyFodModel(data.wd, data.ws, data.pc, E));
			} catch {
				resolve(null);
			}
		}, 0);
	});
}

// ── public API ────────────────────────────────────────────────────────────

/**
 * Main entry point for running the odor footprint model.
 *
 * Orchestrates the full pipeline: resolve the source point → resolve the grid
 * cell → fetch wind data → run the FOD model → write GeoJSON output to
 * appState.  Sets mapLoading during the run and mapIsUpToDate when complete so
 * reactive consumers (MapView, FootprintTable) update automatically.
 *
 * The footprint is centred on the emission-weighted centroid of the placed
 * buildings and driven by their summed Odor Emission Factor - the two values
 * the MI OFFSET 2018 worksheet had the user carry over by hand.
 *
 * Returns immediately if the map is already up to date, if no buildings are
 * placed, or if total emission is zero (nothing to model).
 */
export async function getAndRun() {
	if (appState.mapIsUpToDate) return;
	appState.mapLoading = true;

	try {
		const centroid = site.centroid;
		if (!centroid) return;

		const E = site.totalOEF;
		if (E <= 0) return;

		updateGridCoords(centroid.lat, centroid.lng);
		await fetchWindData();
		if (errorMsg) return;

		const result = await runModelDeferred(E);
		if (!result) return;

		appState.geoJSONData = buildGeoJSONData(
			result,
			centroid.lat,
			centroid.lng,
			E,
		);
		// tick() lets geoJSONData propagate before mapIsUpToDate = true triggers
		// the MapView effect that calls showGeoJSONLayer().
		await tick();
		appState.mapIsUpToDate = true;
	} finally {
		appState.mapLoading = false;
	}
}
