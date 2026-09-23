// --- Map Constants ---

// -- Center Michigan --
export const DEFAULT_LAT = 44.347418;
export const DEFAULT_LNG = -85.410177;

export const DEFAULT_ZOOM = 10;
export const MIN_ZOOM = 7;
export const MAX_ZOOM = 18;
export const LANDMARK_ZOOM = 12;
// Camera / address readouts stay short.
export const LATLNG_PRECISION = 3;
// Building coordinates are surveyed positions - the MI OFFSET 2018 worksheet
// asks for the center of each housing or storage structure to six decimals.
export const BUILDING_LATLNG_PRECISION = 6;
// Zoom used when dropping the first building, so the user lands at a scale
// where individual structures are distinguishable.
export const PLACEMENT_ZOOM = 17;

// Drag payload type for the building palette. The map only accepts drops
// carrying this type, so a dragged file or text selection is ignored.
export const BUILDING_DRAG_TYPE = "application/x-mioffset-building";

// --- Default Camera ---
// This is the map view only. It is no longer the odor source - that is the
// emission-weighted centroid derived from the placed buildings.
export const DEFAULT_LOCATION = {
	lat: DEFAULT_LAT,
	lng: DEFAULT_LNG,
	zoom: MIN_ZOOM,
	address: "",
	fly: false,
	searching: false,
};

// --- Default Building ---
export const DEFAULT_BUILDING = {
	name: "",
	formType: "animal",
	species: "",
	animalType: "",
	housingType: "",
	storageType: "",
	technology: "None",
	area: "",
	manualEmission: null,
};

// Fields wiped when a building's source type (tab) changes, so a building can
// never carry stale animal data into a storage calculation.
export const TYPE_SPECIFIC_FIELDS = {
	animal: ["species", "animalType", "housingType"],
	storage: ["storageType"],
	manual: ["manualEmission"],
};
