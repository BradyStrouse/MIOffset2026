import animalData from "$lib/data/animalData.json";
import storageData from "$lib/data/storageData.json";
import { CalculateTotalEmission } from "./model/OdorEmissionFactor.js";

function b64Encode(str) {
	return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64Decode(str) {
	const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
	return atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
}

/**
 * Encode current entries + location into a single base64url string for the ?d= URL param.
 * All entries share the same flat shape; fields absent for a given form type are omitted.
 * Used short variable names to help link length
 */
export function encodeState(entries, location) {
	const data = {
		loc: [location.lat, location.lng, location.address],
		e: entries.map((entry) => {
			const e = { ft: entry.formType };
			if (entry.species != null) e.sp = entry.species;
			if (entry.animalType != null) e.at = entry.animalType;
			if (entry.housingType != null) e.ht = entry.housingType;
			if (entry.storageType != null) e.st = entry.storageType;
			if (entry.technology != null) e.tech = entry.technology;
			if (entry.area != null) e.area = entry.area;
			if (entry.totalEmission != null) e.em = entry.totalEmission;
			return e;
		}),
	};
	return b64Encode(JSON.stringify(data));
}

/**
 * Decode a ?d= param back into { location, entries }.
 * Re-derives oenRate, odorControlFactor, and totalEmission from the saved raw inputs.
 * Returns null if the string is invalid.
 */
export function decodeState(encoded) {
	try {
		const parsed = JSON.parse(b64Decode(encoded));
		const location = { lat: parsed.loc[0], lng: parsed.loc[1], address: parsed.loc[2] };

		const entries = (parsed.e || []).map((e) => {
			const {
				ft: formType,
				sp: species,
				at: animalType,
				ht: housingType,
				st: storageType,
				tech: technology,
				area,
				em,
			} = e;

			let oenRate = null;
			let odorControlFactor = null;

			if (formType === "animal") {
				oenRate =
					species && animalType && housingType
						? (animalData.SPECIES[species]?.animalTypes[animalType]
								?.housingType[housingType]?.oen_rate ?? null)
						: null;
				odorControlFactor = technology
					? (animalData.TECH[technology]?.odorControlFactor ?? null)
					: null;
			} else if (formType === "storage") {
				oenRate = storageType
					? (storageData.STORAGE[storageType]?.oen_rate ?? null)
					: null;
				odorControlFactor = technology
					? (animalData.TECH[technology]?.odorControlFactor ?? null)
					: null;
			}

			const totalEmission =
				formType === "manual"
					? em
					: CalculateTotalEmission(oenRate, odorControlFactor, area);

			const formDraft =
				formType === "animal"
					? { species, animalType, housingType, technology, area }
					: formType === "storage"
						? { storageType, technology, area }
						: { manualEmission: em };

			return {
				formType,
				species,
				animalType,
				housingType,
				storageType,
				technology,
				area,
				oenRate,
				odorControlFactor,
				totalEmission,
				location: { lat: location.lat, lng: location.lng, address: location.address },
				snapshot: {
					location: { ...location, address: location.address },
					formDraft,
					activeForm: formType,
				},
			};
		});

		return { location, entries };
	} catch {
		return null;
	}
}
