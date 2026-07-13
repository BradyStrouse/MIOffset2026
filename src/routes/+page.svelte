<script>
	// --- Imports ---
	import MapView from "$lib/components/location/MapView.svelte";
	import EmissionForm from "$lib/components/entries/EmissionForm.svelte";
	import EntriesTable from "$lib/components/entries/EntriesTable.svelte";
	import FootprintTable from "$lib/components/results/FootprintTable.svelte";
	import { appState } from "$lib/state/appState.svelte.js";
	import { usePermalink } from "$lib/utils/linkHandler.svelte.js";

	const { decodedState } = usePermalink();
</script>

<div class="page-container">
	<section class="section emission-wrapper">
		<EmissionForm />
	</section>

	<section class="section map-wrapper">
		<MapView focusOnMount={decodedState || !!appState.geoJSONData?.outputs} />
	</section>

	<div class="entries-wrapper">
		<EntriesTable />
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
		grid-template-columns: 0.5fr 2fr;
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
