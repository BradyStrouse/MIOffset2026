<!--
	BuildingsTable - every entered structure, one row each.

	Column order deliberately follows the MI OFFSET 2018 Centroid Worksheet so
	someone transferring a site from that spreadsheet can read the two side by
	side. Also shows the calculated site centroid, which is the odor source the
	footprint is drawn from.

	Used twice: on the home page where a row click selects that building, and
	on the save report with interactive={false} for a static printed table.
-->
<script>
	// --- Imports ---
	import animalData from "$lib/data/animalData.json";
	import storageData from "$lib/data/storageData.json";
	import {
		appState,
		buildings,
		site,
		focusBuilding,
		removeBuilding,
	} from "$lib/state/appState.svelte.js";
	import { deriveEmission } from "$lib/utils/model/OdorEmissionFactor.js";
	import { BUILDING_LATLNG_PRECISION } from "$lib/state/defaultValues.svelte.js";

	let { interactive = true } = $props();

	// --- Column helpers ---
	// Column shapes follow the MI OFFSET 2018 Centroid Worksheet so a user
	// coming from the spreadsheet reads the same table here.
	const SOURCE_LABEL = { storage: "Manure Storage", manual: "Manual Entry" };

	function odorSource(b) {
		return b.formType === "animal"
			? b.species || "-"
			: SOURCE_LABEL[b.formType];
	}

	function productionType(b) {
		return b.formType === "animal" ? b.animalType || "-" : "-";
	}

	function structureType(b) {
		if (b.formType === "animal") return b.housingType || "-";
		if (b.formType === "storage")
			return storageData.STORAGE[b.storageType]?.display || "-";
		return "-";
	}

	function techLabel(b) {
		if (b.formType === "manual") return "-";
		return animalData.TECH[b.technology]?.display || "-";
	}

	function num(value, digits = 2) {
		return value == null || value === "" ? "-" : Number(value).toFixed(digits);
	}

	function handleRowClick(id) {
		if (!interactive) return;
		focusBuilding(id);
	}

	function handleRemove(e, id) {
		e.stopPropagation(); // don't also select the row we're deleting
		removeBuilding(id);
	}

	// --- Derived ---
	let centroid = $derived(site.centroid);
</script>

<section class="buildings-section">
	<!-- Section Header -->
	<div class="buildings-header">
		<div class="header-left">
			<h2>Buildings</h2>
			<span class="entry-count"
				>{buildings.length}
				{buildings.length === 1 ? "structure" : "structures"}</span
			>
		</div>
	</div>

	<!-- Data Table -->
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>#</th>
					<th>Name</th>
					<th>Odor Source</th>
					<th>Type</th>
					<th>Housing or Storage Type</th>
					<th class="numeric">Latitude</th>
					<th class="numeric">Longitude</th>
					<th class="numeric">Area (sq ft)</th>
					<th class="numeric">Odor Emission Number</th>
					<th>Odor Control Tech</th>
					<th class="numeric">Odor Control Factor</th>
					<th class="numeric">Odor Emission Factor</th>
					{#if interactive}<th></th>{/if}
				</tr>
			</thead>
			<tbody class:non-interactive={!interactive}>
				{#each buildings as building, i (building.id)}
					{@const emission = deriveEmission(building)}
					<tr
						onclick={() => handleRowClick(building.id)}
						class:selected={interactive && building.id === appState.selectedId}
					>
						<td class="entry-num">{i + 1}</td>
						<td class="name-cell">{building.name || "Unnamed building"}</td>
						<td>{odorSource(building)}</td>
						<td>{productionType(building)}</td>
						<td>{structureType(building)}</td>
						<td class="numeric"
							>{building.lat.toFixed(BUILDING_LATLNG_PRECISION)}</td
						>
						<td class="numeric"
							>{building.lng.toFixed(BUILDING_LATLNG_PRECISION)}</td
						>
						<td class="numeric">{num(building.area, 0)}</td>
						<td class="numeric">{num(emission.oenRate, 0)}</td>
						<td>{techLabel(building)}</td>
						<td class="numeric">{num(emission.odorControlFactor)}</td>
						<td class="numeric">{num(emission.totalEmission)}</td>
						{#if interactive}
							<td class="remove-cell">
								<button
									class="remove-btn"
									onclick={(e) => handleRemove(e, building.id)}
									aria-label={`Remove ${building.name || "building"}`}>×</button
								>
							</td>
						{/if}
					</tr>
				{:else}
					<tr class="empty-row">
						<td colspan={interactive ? 13 : 12}>
							No buildings placed yet - drag <strong>Add building</strong> from the
							map onto each housing or storage structure.
						</td>
					</tr>
				{/each}

				<!-- Totals: worksheet cell K32 -->
				<tr class="total-row">
					<td colspan={11}>Total Odor Emission Factor</td>
					<td class="numeric total-value">{num(site.totalOEF)}</td>
					{#if interactive}<td></td>{/if}
				</tr>

				<!-- Source-weighted centroid: worksheet cells J33 / K33 -->
				{#if centroid}
					<tr class="centroid-row">
						<td colspan={5}>
							Odor source - {"emission-weighted centroid"}
						</td>
						<td class="numeric"
							>{centroid.lat.toFixed(BUILDING_LATLNG_PRECISION)}</td
						>
						<td class="numeric"
							>{centroid.lng.toFixed(BUILDING_LATLNG_PRECISION)}</td
						>
						<td colspan={interactive ? 6 : 5}></td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</section>

<style>
	/* Header */
	.buildings-section {
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		padding: 1rem 1.5rem;
	}

	.buildings-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 2px solid #4caf50;
		padding-bottom: 0.75rem;
		margin-bottom: 1rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.header-left {
		display: flex;
		align-items: baseline;
		width: 100%;
		gap: 0.75rem;
	}

	.buildings-header h2 {
		margin: 0;
		color: #2c3e50;
		font-size: 1.5rem;
	}

	.entry-count {
		color: #666;
		font-size: 0.9rem;
	}

	/* Table */
	.table-wrapper {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
		min-width: 900px;
	}

	thead tr {
		background-color: #f5f5f5;
	}

	th {
		text-align: left;
		padding: 0.6rem 0.75rem;
		font-weight: 600;
		color: #2c3e50;
		border-bottom: 2px solid #ddd;
		vertical-align: bottom;
	}

	td {
		padding: 0.6rem 0.75rem;
		border-bottom: 1px solid #eee;
		color: #333;
	}

	.name-cell {
		font-weight: 600;
		color: #2c3e50;
	}

	tbody:not(.non-interactive)
		tr:not(.total-row):not(.centroid-row):not(.empty-row) {
		cursor: pointer;
	}

	tbody:not(.non-interactive)
		tr:hover:not(.total-row):not(.centroid-row):not(.empty-row) {
		background-color: #f9fffe;
	}

	tr.selected {
		background-color: #eef8ee;
		box-shadow: inset 3px 0 0 var(--color-kelly-green);
	}

	.empty-row td {
		color: #888;
		font-style: italic;
		text-align: center;
		padding: 1.25rem 0.75rem;
	}

	/* Totals Row */
	.total-row td {
		border-top: 2px solid #4caf50;
		background-color: #f5f5f5;
		border-bottom: none;
		font-weight: 600;
		color: #2c3e50;
	}

	.total-value {
		font-weight: 700;
		color: #2c3e50;
	}

	/* Centroid Row */
	.centroid-row td {
		background-color: #fafafa;
		border-bottom: none;
		color: #555;
		font-size: 0.85rem;
	}

	/* Remove Button */
	.remove-cell {
		padding: 0 0.4rem;
		text-align: center;
	}

	.remove-btn {
		background: none;
		border: 1px solid transparent;
		color: #aaa;
		font-size: 1.1rem;
		line-height: 1;
		cursor: pointer;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		transition: 0.2s;
	}

	.remove-btn:hover {
		color: #e74c3c;
		background: #fdf0ee;
		border-color: #e74c3c;
	}

	/* Numeric Cells */
	.entry-num {
		font-weight: 700;
		color: #4caf50;
		text-align: center;
	}

	.numeric {
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
</style>
