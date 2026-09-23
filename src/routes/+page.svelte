<!--
	Home - the tool itself.

	Lays out the four working panels: BuildingPanel (edit the selected building),
	MapView, and below them BuildingsTable plus FootprintTable once a run has
	produced results. No logic of its own beyond the grid.

	SSR is disabled for this route in +page.js because Leaflet needs a real
	browser. State is restored from the ?data= permalink before MapView mounts.
-->
<script>
	// --- Imports ---
	import MapView from "$lib/components/location/MapView.svelte";
	import BuildingPanel from "$lib/components/entries/BuildingPanel.svelte";
	import BuildingsTable from "$lib/components/entries/BuildingsTable.svelte";
	import FootprintTable from "$lib/components/results/FootprintTable.svelte";
	import { appState } from "$lib/state/appState.svelte.js";
	import { usePermalink } from "$lib/utils/linkHandler.svelte.js";

	const { decodedState } = usePermalink();
</script>

<div class="page-container">
	<section class="section emission-wrapper">
		<BuildingPanel />
	</section>

	<section class="section map-wrapper">
		<MapView focusOnMount={decodedState || !!appState.geoJSONData?.outputs} />
	</section>

	<div class="entries-wrapper">
		<BuildingsTable />
		{#if appState.mapIsUpToDate}
			<FootprintTable />
		{/if}
	</div>
</div>

<style>
	/* allow for font weight resizing on chrome */
	* {
		-webkit-font-smoothing: antialiased;
	}
	/* Grid Layout */
	.page-container {
		display: grid;
		grid-template-columns: minmax(500px, 0.6fr) 2fr;
		grid-template-areas:
			"emission    map"
			"entries entries";
		gap: 0rem;
	}

	.section {
		padding: 1rem;
	}

	/* Section Wrappers */
	.entries-wrapper {
		grid-area: entries;
		display: flex;
		flex-direction: column;
		padding: 1rem;
	}
	.emission-wrapper {
		grid-area: emission;
	}
	.map-wrapper {
		grid-area: map;
	}
	/* Responsive */
	@media (max-width: 768px) {
		.page-container {
			grid-template-columns: 1fr;
			grid-template-areas:
				"emission"
				"entries"
				"map";
		}
		.entries-wrapper,
		.emission-wrapper,
		.map-wrapper {
			min-width: 0;
		}
	}
</style>
