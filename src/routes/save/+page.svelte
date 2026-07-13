<script>
	import MapView from "$lib/components/location/MapView.svelte";
	import EntriesTable from "$lib/components/entries/EntriesTable.svelte";
	import FootprintTable from "$lib/components/results/FootprintTable.svelte";
	import { appState } from "$lib/state/appState.svelte.js";
	import { LATLNG_PRECISION } from "$lib/state/defaultValues.svelte.js";
	import { usePermalink } from "$lib/utils/linkHandler.svelte.js";
	import shpwrite from "@mapbox/shp-write";

	usePermalink();

	function toggleMarker(lat, lng) {
		console.log({ lat, lng });
		debugger;
	}

	let today = new Date().toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	async function downloadShapefile() {
		const geojson = appState.geoJSONData.outputs.map.data;
		console.log(geojson)
		const blob = await shpwrite.zip(geojson, {
			folder: "odor_footprint",
			filename: "odor_footprint",
			outputType: "blob",
			types: { polygon: "odor_footprint" },
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "odor_footprint.zip";
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="print-page">
	<!-- Screen-only controls -->
	<div class="screen-only toolbar">
		<button
			class="print-btn"
			onclick={downloadShapefile}
			disabled={!appState.geoJSONData?.outputs}
		>Download Shapefile</button>
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
				<span class="meta-label">Location:</span>
				<span>
					{Number(appState.location.lat).toFixed(LATLNG_PRECISION)}°N,
					{Number(appState.location.lng).toFixed(LATLNG_PRECISION)}°W
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
		<!-- Entries Table -->
		<section class="report-section entries-section-wrapper">
			<EntriesTable interactive={false} />
		</section>

		<!-- Map -->
		<section class="report-section map-section">
			<h2 class="section-heading">Location Map</h2>
			<div class="map-wrapper">
				<MapView
					onLocationSelect={toggleMarker}
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
	.shapefile-btn {
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

	.shapefile-btn {
		background-color: #1565c0;
		color: white;
	}

	.shapefile-btn:hover:not(:disabled) {
		background-color: #0d47a1;
	}

	.shapefile-btn:disabled {
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
	.print-page :global(.entries-section th) {
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

	.print-page :global(.entries-section td) {
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
		:global(.entries-section),
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
