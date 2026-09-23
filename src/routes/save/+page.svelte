<!--
	Save - the printable odor footprint report.

	A report-shaped view of the same site: title block with the date, the map,
	the buildings table (read-only) and the full setback distance table. The
	PDF is produced by window.print() against the print stylesheet rather than
	a PDF library, which is why the layout is built for paper and the toolbar
	is marked screen-only.

	Also assembles the GIS download: a small square polygon around the odor
	source plus the footprint, zipped as a shapefile.
-->
<script>
	import MapView from "$lib/components/location/MapView.svelte";
	import BuildingsTable from "$lib/components/entries/BuildingsTable.svelte";
	import FootprintTable from "$lib/components/results/FootprintTable.svelte";
	import { appState, buildings, site } from "$lib/state/appState.svelte.js";
	import { BUILDING_LATLNG_PRECISION } from "$lib/state/defaultValues.svelte.js";
	import { usePermalink } from "$lib/utils/linkHandler.svelte.js";
	import shpwrite from "@mapbox/shp-write";
	import JSZip from "jszip";
	import { geodeticDistance } from "$lib/utils/model/fodLocalModel/geo.js";

	usePermalink();

	let today = new Date().toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	let centroid = $derived(site.centroid);

	/** Builds a small square polygon centred on the odor source for the GIS layer. */
	function buildSourceGeoJSON(lat, lon) {
		const HALF = 0.05; // miles - ~265 ft each way
		const n = geodeticDistance(lat, lon, HALF, 0);
		const e = geodeticDistance(lat, lon, HALF, 90);
		const s = geodeticDistance(lat, lon, HALF, 180);
		const w = geodeticDistance(lat, lon, HALF, 270);
		return {
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					properties: { name: "Source Location" },
					geometry: {
						type: "Polygon",
						coordinates: [
							[
								[e.lon, n.lat],
								[e.lon, s.lat],
								[w.lon, s.lat],
								[w.lon, n.lat],
								[e.lon, n.lat],
							],
						],
					},
				},
			],
		};
	}

	function downloadBlob(blob, filename) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function downloadShapefile() {
		const { sourceLat, sourceLng, outputs } = appState.geoJSONData;

		const [footprintBuf, sourceBuf] = await Promise.all([
			shpwrite.zip(outputs.map.data, {
				outputType: "arraybuffer",
				types: { polygon: "odor_footprint" },
			}),
			shpwrite.zip(buildSourceGeoJSON(sourceLat, sourceLng), {
				outputType: "arraybuffer",
				types: { polygon: "source_location" },
			}),
		]);

		const [fZip, sZip] = await Promise.all([
			new JSZip().loadAsync(footprintBuf),
			new JSZip().loadAsync(sourceBuf),
		]);

		const merged = new JSZip();
		for (const [name, file] of Object.entries(fZip.files)) {
			merged.file(name, await file.async("arraybuffer"));
		}
		for (const [name, file] of Object.entries(sZip.files)) {
			merged.file(name, await file.async("arraybuffer"));
		}

		const blob = await merged.generateAsync({ type: "blob" });
		downloadBlob(blob, "odor_footprint.zip");
	}

	// Matches the stroke colors mapRenderLayers.js assigns on the map, so the
	// exported file reads the same way in Google Earth as it does on screen.
	const KML_COLORS = {
		"1.5% Frequency": "#22c55e",
		"3% Frequency": "#3b82f6",
		"5% Frequency": "#ef4444",
		"Source Location": "#f59e0b",
	};

	function escapeXml(str) {
		return String(str).replace(
			/[<>&'"]/g,
			(c) =>
				({
					"<": "&lt;",
					">": "&gt;",
					"&": "&amp;",
					"'": "&apos;",
					'"': "&quot;",
				})[c],
		);
	}

	// KML colors are aabbggrr, the reverse byte order of a CSS #rrggbb hex.
	function kmlColor(hex, alpha = 0xff) {
		const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)];
		return alpha.toString(16).padStart(2, "0") + b + g + r;
	}

	function ringToKmlCoordinates(ring) {
		return ring.map(([lon, lat]) => `${lon},${lat},0`).join(" ");
	}

	function polygonPlacemark(feature) {
		const name = feature.properties?.name ?? "";
		const color = KML_COLORS[name] ?? "#888888";
		const coords = ringToKmlCoordinates(feature.geometry.coordinates[0]);
		return `<Placemark>
			<name>${escapeXml(name)}</name>
			<Style>
				<LineStyle><color>${kmlColor(color)}</color><width>2</width></LineStyle>
				<PolyStyle><color>${kmlColor(color, 0x40)}</color></PolyStyle>
			</Style>
			<Polygon>
				<outerBoundaryIs>
					<LinearRing>
						<coordinates>${coords}</coordinates>
					</LinearRing>
				</outerBoundaryIs>
			</Polygon>
		</Placemark>`;
	}

	/** KML export - the footprint and source polygons as styled placemarks,
	 *  for tools (Google Earth, most desktop GIS) that read KML directly. */
	function downloadKML() {
		const { sourceLat, sourceLng, outputs } = appState.geoJSONData;
		const features = [
			...outputs.map.data.features,
			...buildSourceGeoJSON(sourceLat, sourceLng).features,
		];
		const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
	<Document>
		<name>Odor Footprint</name>
		${features.map(polygonPlacemark).join("\n\t\t")}
	</Document>
</kml>`;
		const blob = new Blob([kml], {
			type: "application/vnd.google-earth.kml+xml",
		});
		downloadBlob(blob, "odor_footprint.kml");
	}
</script>

<div class="print-page">
	<!-- Screen-only controls -->
	<div class="screen-only toolbar">
		<button
			class="kml-btn"
			onclick={downloadKML}
			disabled={!appState.mapIsUpToDate || !appState.geoJSONData?.outputs}
			>Download KML</button
		>
		<button
			class="shapefile-btn"
			onclick={downloadShapefile}
			disabled={!appState.mapIsUpToDate || !appState.geoJSONData?.outputs}
			>Download Shapefile</button
		>
		<button class="print-btn" onclick={() => window.print()}
			>Print / Save as PDF</button
		>
	</div>

	<!-- Report Header -->
	<header class="report-header">
		<div class="report-title">
			<h1>Michigan OFFSet</h1>
			<p class="report-subtitle">Odor Footprint Report</p>
		</div>
		<div class="report-meta">
			<div class="meta-row">
				<span class="meta-label">Date:</span>
				<span>{today}</span>
			</div>
			<div class="meta-row">
				<span class="meta-label">Structures:</span>
				<span>{buildings.length}</span>
			</div>
			<div class="meta-row">
				<span class="meta-label">Total OEF:</span>
				<span>{site.totalOEF.toFixed(2)}</span>
			</div>
			<div class="meta-row">
				<span class="meta-label">Source centroid:</span>
				<span>
					{#if centroid}
						{centroid.lat.toFixed(BUILDING_LATLNG_PRECISION)},
						{centroid.lng.toFixed(BUILDING_LATLNG_PRECISION)}
					{:else}
						-
					{/if}
				</span>
			</div>
			<div class="meta-row">
				<span class="meta-label">Address:</span>
				<span>
					{#if appState.location.address !== undefined && appState.location.address !== ""}
						{appState.location.address}
					{:else}
						-
					{/if}
				</span>
			</div>
		</div>
	</header>

	<section class="report-wrapper">
		<!-- Buildings Table -->
		<section class="report-section entries-section-wrapper">
			<BuildingsTable interactive={false} />
		</section>

		<!-- Map -->
		<section class="report-section map-section">
			<h2 class="section-heading">Location Map</h2>
			<div class="map-wrapper">
				<MapView
					enableNav={false}
					focusOnMount={true}
					interactive={false}
					showLegend={true}
				/>
			</div>
		</section>

		<!-- Footprint Table -->
		<section class="report-section footprint-section">
			<FootprintTable />
		</section>
	</section>
</div>

<style>
	.print-page {
		width: 11in;
		min-height: 8.5in;
		margin: 0 auto;
		padding: 0.5in;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
		background: white;
		box-sizing: border-box;
	}

	/* Screen-only toolbar */
	.toolbar {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	.print-btn,
	.shapefile-btn,
	.kml-btn {
		border: none;
		border-radius: 4px;
		padding: 0.6rem 1.2rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		letter-spacing: 0.5px;
		transition: background-color 0.2s;
	}

	.print-btn {
		background-color: var(--color-spartan-green);
		color: white;
	}

	.print-btn:hover {
		background-color: #0f2e26;
	}

	.shapefile-btn,
	.kml-btn {
		background-color: #00897b;
		color: white;
	}

	.shapefile-btn:hover:not(:disabled),
	.kml-btn:hover:not(:disabled) {
		background-color: #00695c;
	}

	.shapefile-btn:disabled,
	.kml-btn:disabled {
		background-color: #90a4ae;
		cursor: not-allowed;
	}

	.report-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
	}
	/* Report Header */
	.report-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		border-bottom: 3px solid var(--color-spartan-green);
		padding-bottom: 1rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.report-title h1 {
		margin: 0;
		font-size: 2rem;
		color: var(--color-spartan-green);
		letter-spacing: 1px;
	}

	.report-subtitle {
		margin: 0.25rem 0 0 0;
		color: #555;
		font-size: 0.95rem;
	}

	.report-meta {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		text-align: right;
		font-size: 0.9rem;
		color: #444;
	}

	.meta-row {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.meta-label {
		font-weight: 600;
		color: #2c3e50;
	}

	/* Sections */
	.report-section {
		display: flex;
		flex-direction: column;
		min-height: none;
	}

	.section-heading {
		margin: 0 0 0.75rem 0;
		font-size: 1.1rem;
		color: #2c3e50;
		border-bottom: 2px solid #4caf50;
		padding-bottom: 0.4rem;
	}

	/* Map */
	.map-wrapper {
		height: 700px;
	}

	/* Override MapView's min-height so the map actually respects the wrapper */
	.map-wrapper :global(.map) {
		min-height: 0;
		height: 100%;
	}

	/* Expand tables to full width - remove scroll containers on this page */
	.print-page :global(.table-wrapper),
	.print-page :global(.table-scroll) {
		overflow: visible;
		max-height: none;
	}

	/* Footprint section grows to fill remaining report space */
	.footprint-section {
		flex: 1;
	}

	.footprint-section :global(.footprint-table-wrapper) {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.footprint-section :global(.table-scroll) {
		flex: 1;
	}

	.print-page :global(.table-wrapper table),
	.print-page :global(.table-scroll table) {
		min-width: 0;
		width: 100%;
	}

	/* Entries table: allow headers to wrap so 10 columns fit in 7.5in */
	.print-page :global(.buildings-section th) {
		white-space: normal;
		font-size: 0.8rem;
	}

	/* CSS for the map legend */
	:global(.geojson-legend) {
		background: white;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
		font-size: 0.85rem;
		line-height: 1.6;
		color: #333;
	}

	:global(.legend-row) {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	:global(.legend-swatch) {
		display: inline-block;
		width: 14px;
		height: 14px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.print-page :global(.buildings-section td) {
		font-size: 0.8rem;
	}
	.print-page :global(.remove-cell) {
		display: none;
	}
	/* Print Styles */
	@page {
		size: letter landscape;
		margin: 0.5in;
	}

	@media print {
		.screen-only {
			display: none;
		}
		.print-page {
			box-shadow: none;
			gap: 1.2rem;
		}

		/* Hide Leaflet location overlay and controls */
		:global(.overlay) {
			display: none !important;
		}

		:global(.leaflet-top),
		:global(.leaflet-bottom.leaflet-right) {
			display: none !important;
		}

		/* Remove interactive styling from entries table */
		:global(tbody tr) {
			cursor: default !important;
		}

		:global(.remove-btn),
		:global(.btn-footprint),
		:global(.submission-btn) {
			display: none !important;
		}

		/* Flatten card shadows */
		:global(.buildings-section),
		:global(.footprint-table-wrapper) {
			box-shadow: none !important;
			border: 1px solid #ddd;
		}

		/* Repeat table headers when a table breaks across pages */
		.print-page :global(thead) {
			display: table-header-group;
		}

		.print-page :global(tr) {
			break-inside: avoid;
		}

		/* Prevent section breaks mid-table */
		.entries-section-wrapper {
			break-after: page;
		}

		.map-section {
			break-after: avoid;
		}
	}
</style>
