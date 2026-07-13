<script>
	// --- Imports ---
	import { tick } from "svelte";
	import ManualCoords from "$lib/components/location/ManualCoords.svelte";
	import Address from "$lib/components/location/AddressSearch.svelte";
	import LocationUnknown from "./LocationUnknown.svelte";
	import { appState } from "$lib/state/appState.svelte.js";
	import {
		DEFAULT_LAT,
		DEFAULT_LNG,
	} from "$lib/state/defaultValues.svelte.js";
	import CollapsibleButton from "../common/CollapsibleButton.svelte";

	// --- State ---
	let noResults = $state(false);

	// --- Handlers ---
	async function handleSubmit(e) {
		e.preventDefault();
		noResults = false;
		appState.location.searching = true;
		try {
			const res = await fetch(
				`/api/geocode?query=${encodeURIComponent(appState.location.address)}`,
			);

			if (!res.ok) {
				throw new Error(`API call failed with status ${res.status}`);
			}

			const data = await res.json();
			const results = data.results || [];
			if (results.length > 0) {
				appState.location.fly = true;
				appState.location.lat = parseFloat(results[0].position.lat);
				appState.location.lng = parseFloat(results[0].position.lon);
				appState.location.address = results[0].address.freeformAddress ?? appState.location.address;
				appState.manualAddress = true;
				appState.location.markerHidden = false;
			} else {
				noResults = true;
			}
		} catch (error) {
			console.error("Geocoding error:", error);
			noResults = true;
		} finally {
			appState.location.searching = false;
		}
	}

	async function handleReset(e) {
		e.preventDefault();
		noResults = false;
		appState.location.address = "";
		if (appState.geoJSONData?.outputs) {
			appState.location.lat = appState.geoJSONData.sourceLat;
			appState.location.lng = appState.geoJSONData.sourceLng;
			appState.location.markerHidden = false;
			await tick();
			appState.mapIsUpToDate = true;
		} else {
			appState.location.fly = true;
			appState.location.lat = DEFAULT_LAT;
			appState.location.lng = DEFAULT_LNG;
		}
	}

	// subscribe to address changes to clear the no-results state
	$effect(() => {
		appState.location.address;
		noResults = false;
	});
</script>

<div class="collapse-wrapper">
	<CollapsibleButton>
		<!-- Address Search Row -->
		{#if noResults}
			<LocationUnknown />
		{/if}
		<div class="address-wrapper">
			<Address {handleSubmit} />
			<div class="form-actions">
				<label class="spacer" for="spacing">&nbsp;</label>
				<button type="submit" class="btn btn-primary" onclick={handleSubmit}
					>Search</button
				>
			</div>
		</div>
		<!-- Manual Coords & Reset -->
		<div class="local-footer-wrapper">
			<div class="latlng-wrapper">
				<ManualCoords />
			</div>
			<div class="form-actions">
				<label class="spacer" for="spacing">&nbsp;</label>
				<div class="button-row">
					<button type="reset" class="btn btn-secondary" onclick={handleReset}
						>Reset</button
					>
				</div>
			</div>
		</div>
	</CollapsibleButton>
</div>

<style>
	/* Layout */
	.address-wrapper {
		display: flex;
		gap: 1rem;
		flex-direction: row;
	}
	.local-footer-wrapper {
		display: flex;
		padding-top: 1rem;
		gap: 1rem;
	}
	.latlng-wrapper {
		flex: 1;
	}

	.form-actions {
		display: flex;
		align-items: center;
		flex-direction: column;
		gap: 0.2rem;
	}

	.spacer {
		visibility: hidden;
	}
	.button-row {
		display: flex;
		gap: 1rem;
	}
	/* Buttons */
	.btn {
		padding: 0.5rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-top: auto;
	}

	.btn-primary {
		background-color: var(--color-kelly-green);
		color: white;
	}

	.btn-primary:hover {
		background-color: #008934;
		box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
		transform: scaleX(1.03);
	}

	.btn-primary:active {
		background-color: #008934;
		transform: translateY(1px);
	}

	.btn-secondary {
		background-color: #95a5a6;
		color: white;
	}

	.btn-secondary:hover {
		background-color: #7f8c8d;
		transform: scaleX(1.03);
	}

	.btn-secondary:active {
		background-color: #6c7a7b;
	}
</style>
