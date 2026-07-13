<script>
	import { appState } from "$lib/state/appState.svelte.js";

	let rows = $derived(() => {
		const raw = appState.geoJSONData?.outputs?.table?.data;
		if (!raw) return [];
		return raw
			.trim()
			.split("\n")
			.slice(2) // skip "Toward Distance_in_Miles" and "5%  3%  1.5%" header lines
			.map((line) => {
				const [direction, pct1_5, pct3, pct5] = line.trim().split(/\s+/);
				return { direction, pct1_5, pct3, pct5 };
			})
			.filter((r) => r.direction && r.pct5);
	});
</script>

{#if rows().length}
	<div class="footprint-table-wrapper">
		<h3>Odor Footprint</h3>
		<div class="table-scroll">
			<table>
				<thead>
					<tr>
						<th>Direction</th>
						<th>5% Frequency (mi)</th>
						<th>3% Frequency (mi)</th>
						<th>1.5% Frequency (mi)</th>
					</tr>
				</thead>
				<tbody>
					{#each rows() as row, i}
						<tr class:named={row.direction !== "-"}>
							<td class="dir">{row.direction}</td>
							<td class="numeric">{row.pct5}</td>
							<td class="numeric">{row.pct3}</td>
							<td class="numeric">{row.pct1_5}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}

<style>
	.footprint-table-wrapper {
		margin-top: 1rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		padding: 1rem 1.5rem;
	}

	h3 {
		margin: 0 0 0.75rem 0;
		color: #2c3e50;
		font-size: 1.1rem;
		border-bottom: 2px solid #4caf50;
		padding-bottom: 0.5rem;
	}

	.table-scroll {
		overflow-x: auto;
		max-height: 480px;
		overflow-y: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 0.875rem;
	}

	thead {
		position: sticky;
		top: 0;
		background: #f5f5f5;
		z-index: 1;
	}

	th {
		padding: 0.5rem 0.75rem;
		font-weight: 600;
		color: #2c3e50;
		border-bottom: 2px solid #ddd;
		white-space: nowrap;
	}

	td {
		padding: 0.3rem 0.75rem;
		text-align: left;
		border-bottom: 1px solid #f0f0f0;
		color: #444;
	}

	tr.named td {
		font-weight: 600;
		background-color: #f9fffe;
		border-top: 1px solid #e0f0e0;
		text-align: left;
	}

	.dir {
		font-variant-numeric: tabular-nums;
		color: #2c3e50;
		min-width: 3rem;
	}

	.numeric {
		font-variant-numeric: tabular-nums;
	}

	@media print{
		.footprint-table-wrapper{
			print-color-adjust: exact;
		}
	}
</style>
