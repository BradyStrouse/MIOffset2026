import {
	BUILDING_LATLNG_PRECISION,
	DEFAULT_BUILDING,
} from "$lib/state/defaultValues.svelte.js";
import { normalizeTechnologies } from "$lib/utils/model/OdorEmissionFactor.js";

const FORMAT_VERSION = 2;

function b64Encode(str) {
	return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function b64Decode(str) {
	const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
	return atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
}

function round(value) {
	return Number(Number(value).toFixed(BUILDING_LATLNG_PRECISION));
}

/**
 * Encode the site's buildings into a single base64url string for the ?data= URL
 * param. Only raw inputs are stored - Odor Emission Number, Odor Control Factor
 * and Odor Emission Factor are all re-derived on decode, so a link can never
 * carry a stale calculation. Short keys keep the URL manageable.
 */
export function encodeState(buildings, location) {
	const data = {
		v: FORMAT_VERSION,
		c: [round(location.lat), round(location.lng), location.address ?? ""],
		b: buildings.map((building) => {
			const b = {
				n: building.name,
				la: round(building.lat),
				lo: round(building.lng),
				ft: building.formType,
			};
			if (building.species) b.sp = building.species;
			if (building.animalType) b.at = building.animalType;
			if (building.housingType) b.ht = building.housingType;
			if (building.storageType) b.st = building.storageType;
			const tech = normalizeTechnologies(building.technology);
			if (tech.length) b.tech = tech;
			if (building.area !== "" && building.area != null) b.ar = building.area;
			if (building.manualEmission != null) b.em = building.manualEmission;
			return b;
		}),
	};
	return b64Encode(JSON.stringify(data));
}

function toBuilding(raw, index) {
	return {
		id: crypto.randomUUID(),
		...DEFAULT_BUILDING,
		name: raw.n ?? `Building ${index + 1}`,
		lat: raw.la,
		lng: raw.lo,
		formType: raw.ft ?? "animal",
		species: raw.sp ?? "",
		animalType: raw.at ?? "",
		housingType: raw.ht ?? "",
		storageType: raw.st ?? "",
		technology: normalizeTechnologies(raw.tech), // older links store a single key
		area: raw.ar ?? "",
		manualEmission: raw.em ?? null,
	};
}

/**
 * Version 1 links predate per-building placement: they carried one site location
 * and a list of emission entries sharing it. Each entry becomes a building
 * stacked at that location, which keeps the total OEF and the resulting
 * footprint identical - the centroid of co-located points is that point.
 */
function upgradeV1(parsed) {
	const [lat, lng, address = ""] = parsed.loc ?? [];
	if (lat == null || lng == null) return null;

	return {
		location: { lat, lng, address },
		buildings: (parsed.e ?? []).map((e, i) =>
			toBuilding(
				{
					n: `Building ${i + 1}`,
					la: lat,
					lo: lng,
					ft: e.ft,
					sp: e.sp,
					at: e.at,
					ht: e.ht,
					st: e.st,
					tech: e.tech,
					ar: e.area,
					em: e.em,
				},
				i,
			),
		),
	};
}

/**
 * Decode a ?data= param back into { location, buildings }.
 * Returns null if the string is missing or invalid.
 */
export function decodeState(encoded) {
	if (!encoded) return null;
	try {
		const parsed = JSON.parse(b64Decode(encoded));

		if (parsed.v !== FORMAT_VERSION) return upgradeV1(parsed);

		const [lat, lng, address = ""] = parsed.c ?? [];
		return {
			location: { lat, lng, address },
			buildings: (parsed.b ?? [])
				.filter((raw) => Number.isFinite(raw.la) && Number.isFinite(raw.lo))
				.map(toBuilding),
		};
	} catch {
		return null;
	}
}
