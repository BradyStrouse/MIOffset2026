import animalData from "$lib/data/animalData.json";
import storageData from "$lib/data/storageData.json";

// E = (oenRate * odorControlFactor * area) / 10000
// Equation taken from legacy code; matches column K of the MI OFFSET 2018
// Centroid Worksheet (=G*H*J/10000).
// area in sq ft, odor control factor is transmission fraction (1.0 for no technology)
export function CalculateTotalEmission(oenRate, odorControlFactor, area) {
	// Undefined Check
	if (
		oenRate == null ||
		odorControlFactor == null ||
		area == null ||
		area === "" // area comes from <input type="number"> and arrives as "" before the user types;
		            // other params come from dropdowns and arrive as null
	)
		return null;

	// Number(area) coerces the string input value to a number;
	// the checks above guarantee it is non-null and non-empty here.
	return (oenRate * odorControlFactor * Number(area)) / 10000;
}

/**
 * Odor Emission Number for a building, looked up from the species/housing or
 * storage tables. Returns null when the dropdowns aren't filled in far enough
 * to identify a rate.
 * @param {object} building
 */
export function lookupOenRate(building) {
	const { formType, species, animalType, housingType, storageType } = building;

	if (formType === "animal") {
		if (!species || !animalType || !housingType) return null;
		return (
			animalData.SPECIES[species]?.animalTypes[animalType]?.housingType[
				housingType
			]?.oen_rate ?? null
		);
	}
	if (formType === "storage") {
		if (!storageType) return null;
		return storageData.STORAGE[storageType]?.oen_rate ?? null;
	}
	return null;
}

/**
 * Normalizes a building's technology field to an array of TECH keys. Older
 * buildings and permalinks stored a single key string, with "None" meaning
 * no adjustment.
 * @param {string[]|string|null|undefined} technology
 * @returns {string[]}
 */
export function normalizeTechnologies(technology) {
	const list = Array.isArray(technology) ? technology : [technology];
	return list.filter((tech) => tech && tech !== "None");
}

/**
 * Combined Odor Control Factor for the selected technologies. Factors are
 * multiplied: each technology acts on what the previous ones let through, so
 * Biofilter (0.1) + Wet Scrubbers (0.8) = 0.08. The worksheet falls back to
 * 1.0 (no reduction) when no technology is selected, so we do the same.
 * @param {string[]|string} technology
 */
export function lookupOdorControlFactor(technology) {
	const factor = normalizeTechnologies(technology).reduce(
		(product, tech) =>
			product * (animalData.TECH[tech]?.odorControlFactor ?? 1.0),
		1.0,
	);
	// rounding strips float noise, e.g. 0.1 * 0.3 = 0.030000000000000002
	return Math.round(factor * 1e6) / 1e6;
}

/**
 * Derives the three calculated columns for a building from its raw inputs.
 * Single source of truth shared by the buildings state, the permalink decoder,
 * and the report page, so a building's OEF is never computed two ways.
 *
 * @param {object} building
 * @returns {{oenRate: number|null, odorControlFactor: number|null, totalEmission: number|null}}
 */
export function deriveEmission(building) {
	if (building.formType === "manual") {
		const em = building.manualEmission;
		return {
			oenRate: null,
			odorControlFactor: null,
			totalEmission: em == null || em === "" ? null : Number(em),
		};
	}

	const oenRate = lookupOenRate(building);
	const odorControlFactor = lookupOdorControlFactor(building.technology);

	return {
		oenRate,
		odorControlFactor,
		totalEmission: CalculateTotalEmission(
			oenRate,
			odorControlFactor,
			building.area,
		),
	};
}
