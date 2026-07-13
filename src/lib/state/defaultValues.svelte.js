// --- Map Constants ---

// -- Center Michigan --
// export const DEFAULT_LAT = 44.347418;
// export const DEFAULT_LNG = -85.410177;
// -- MSU Geography Building --
// export const DEFAULT_LAT = 42.729256;
// export const DEFAULT_LNG = -84.472938;

// TODO: GEOJSON TESTING VARIABLES, REMOVE
export const DEFAULT_LAT = 42;
export const DEFAULT_LNG = -84;

export const DEFAULT_ZOOM = 6.5;
export const MIN_ZOOM = 7;
export const MAX_ZOOM = 18;
export const LANDMARK_ZOOM = 12;
export const LATLNG_PRECISION = 3;
// --- Default Location ---
export const DEFAULT_LOCATION = {
	lat: DEFAULT_LAT,
	lng: DEFAULT_LNG,
	zoom: MIN_ZOOM,
	address: "",
	mode: "address",
	fly: false,
	searching: false,
	markerHidden: false,
};

// --- Default Emission ---
export const DEFAULT_EMISSION = {
	species: "",
	animalType: "",
	housingType: "",
	technology: "",
	area: "",
	storageType: "",
	oenRate: null,
	odorControlFactor: null,
	totalEmission: null,
};
