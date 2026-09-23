import { appState } from "$lib/state/appState.svelte.js";

/**
 * Fetches the geoJSON from mapLayer file
 * Returns the GeoJSON layer so the caller can remove it later.
 */
export async function renderGEOJSON(map, showLegend = false) {
	if (!map) {
		return;
	}

	const lineWeight = 2;
	// Tailwind RGB values. pop() assigns from the end, so contours receive colors in order:
	// GREEN (innermost/highest concentration) -> BLUE -> RED (outermost/lowest concentration).
	const RED = "#ef4444";
	const GREEN = "#22c55e";
	const BLUE = "#3b82f6";
	const colors = [RED, BLUE, GREEN];

	window.L = (await import("leaflet")).default;
	let geoJSON = appState.geoJSONData.outputs.map.data;
	let geoJSONLayer = L.geoJSON(geoJSON.features).addTo(map);
	const legendEntries = [];

	geoJSONLayer.eachLayer((l) => {
		const name = l.feature?.properties?.name ?? null;
		let oef = l.feature?.properties?.odor_emission_factor ?? "";
		oef = Math.round((oef + Number.EPSILON) * 100) / 100 // reduce oef to 2 decimal places of precision
		if (name) {
			l.bindTooltip(name + "<br/>OEF: " + oef, {
				sticky: true,
				direction: "top",
			});
		}

		if (!l.setStyle) return;
		const color = colors.pop();
		l.setStyle({ weight: lineWeight, color });
		if (showLegend && name) legendEntries.push({ color, name, oef });

		l.on("mouseover", () => l.setStyle({ weight: lineWeight + 2 }));
		l.on("mouseout", () => l.setStyle({ weight: lineWeight }));
	});

	if (legendEntries.length > 0)
		// _legend is stored on the layer so clearGeoJSONLayer() in MapView can call
		// _legend.remove() before replacing the layer, preventing duplicate legends.
		geoJSONLayer._legend = createLegend(map, legendEntries);

	// centers the json bounds on the map view, interrupting any in-progress animation
	// map.stop();
	// map.fitBounds(geoJSONLayer.getBounds());
	return geoJSONLayer;
}

function createLegend(map, entries) {
	const legend = L.control({ position: "bottomleft" });
	legend.onAdd = () => {
		const div = L.DomUtil.create("div", "geojson-legend");
		entries.forEach(({ color, name }) => {
			div.innerHTML += `<div class="legend-row"><span class="legend-swatch" style="background:${color}"></span><span>${name}</span></div>`;
		});
		return div;
	};
	legend.addTo(map);
	return legend;
}
