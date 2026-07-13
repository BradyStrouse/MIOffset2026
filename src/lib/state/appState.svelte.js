import { DEFAULT_LOCATION, DEFAULT_EMISSION } from "./defaultValues.svelte.js";

const DEFAULT_DRAFTS = {
	animal: { ...DEFAULT_EMISSION },
	storage: { ...DEFAULT_EMISSION },
	manual: { manualEmission: null },
};

// --- State ---
export const appState = $state({
	location: { ...DEFAULT_LOCATION },
	manualAddress: false,
	formDrafts: {
		animal: { ...DEFAULT_EMISSION },
		storage: { ...DEFAULT_EMISSION },
		manual: { manualEmission: null },
	},
	geoJSONData: {},
	activeForm: "animal",
	mapIsUpToDate: false,
	mapLoading: false,
	suppressStale: false,
});

export const entries = $state([]);

// --- Actions ---
export function resetFormState() {
	const form = appState.formDrafts;
	const drafts = DEFAULT_DRAFTS;
	Object.assign(form[appState.activeForm], drafts[appState.activeForm]);
}

/**
 * Populates entries from a permalink URL without running the model.
 * Call getAndRun() from runModel.svelte.ts afterwards to compute the footprint.
 * @param {number} lat
 * @param {number} lng
 * @param {number} odorIndex
 */
export function loadFromPermalink(lat, lng, odorIndex) {
	const currentTotal = entries.reduce((sum, e) => sum + (e.totalEmission ?? 0), 0);

	if (currentTotal !== odorIndex) {
		entries.splice(0, entries.length);
		entries.push({
			animal: { totalEmission: odorIndex },
			location: { lat, lng, address: "" },
			snapshot: {
				location: { ...appState.location },
				formDraft: { manualEmission: odorIndex },
				activeForm: "manual",
			},
		});
	}
}
