<script>
	// --- Imports ---
	import { onMount, onDestroy, untrack, tick } from "svelte";
	import { appState, entries } from "$lib/state/appState.svelte.js";
	import { mapIcons, resolveMarkerIcon } from "$lib/state/mapIcons.svelte.js";
	import { reverseGeocode } from "$lib/utils/map/reverseGeocode.js";
	import {
		LANDMARK_ZOOM,
		MAX_ZOOM,
		MIN_ZOOM,
	} from "$lib/state/defaultValues.svelte.js";
	import LocationSelection from "./LocationSelection.svelte";
	import { renderGEOJSON } from "$lib/utils/map/mapRenderLayers.js";
	import LoadingIcon from "../common/LoadingIcon.svelte";
	import { getAndRun } from "$lib/utils/model/runModel.svelte.ts";

	// --- Props & State ---
	let {
		onLocationSelect = () => {},
		enableNav = true,
		focusOnMount = false,
		interactive = true,
		showLegend = false,
	} = $props();

	let currentSpecies = $derived.by(() => {
		if (appState.activeForm === "animal" && appState.formDrafts.animal.species)
			return appState.formDrafts.animal.species;
		if (
			appState.activeForm === "storage" &&
			appState.formDrafts.storage.storageType
		)
			return "Storage";
		if (entries[0]?.type === "storage") return "Storage";
		return entries[0]?.animal?.species || "default";
	});

	// $state.raw rather than $state: Leaflet objects are large and can break the library
	// raw still signals effects when the top-level variables are reassigned.
	let L = $state.raw(null);
	let mapContainer = $state(null);
	let map = $state.raw(null);
	let locOverlay = $state(null);
	// Plain booleans, deliberately NOT $state - mutating them must not re-trigger the effects
	// that read them.
	let marker;
	let geoJSONLayer;
	let initialized = false;
	let fittedOnMount = false;
	let mapEffectBehind = false;

	// --- Lifecycle ---
	function preloadImages() {
		Object.values(mapIcons).forEach(({ iconUrl }) => {
			const img = new Image();
			img.src = iconUrl;
		});
	}

	onMount(async () => {
		L = (await import("leaflet")).default;
		await import("leaflet/dist/leaflet.css");
		preloadImages();
		initMap();
		registerMapEvents();
	});

	onDestroy(() => map?.remove());

	function initMap() {
		const michiganBounds = L.latLngBounds(
			L.latLng(40.55, -100.5),
			L.latLng(48.3, -70.4),
		);

		map = L.map(mapContainer, {
			minZoom: MIN_ZOOM,
			maxZoom: MAX_ZOOM,
			maxBounds: michiganBounds,
			maxBoundsViscosity: 1.0, // 1.0 = fully rigid boundary, no rubber-band when panning to the edge
		});

		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(map);
		map.fitBounds(michiganBounds);
		appState.location.zoom = map.getZoom(); // sync so first click zooms in

		// Prevent the location overlay (address search) from panning/zooming the map underneath it
		if (locOverlay) {
			L.DomEvent.disableClickPropagation(locOverlay);
			L.DomEvent.disableScrollPropagation(locOverlay);
		}
	}
	function registerMapEvents() {
		if (!interactive) return;

		map.on("click", (e) => {
			const { lat, lng } = e.latlng;
			appState.location.fly = true;
			appState.location.lat = lat;
			appState.location.lng = lng;
			appState.location.markerHidden = false;

			clearGeoJSONLayer(geoJSONLayer);
			onLocationSelect({ lat, lng });

			if (!appState.manualAddress) {
				reverseGeocode(lat, lng).then((address) => {
					if (address !== null && !appState.manualAddress)
						appState.location.address = address;
				});
			}
		});
		map.on("zoom", () => {
			appState.location.zoom = map.getZoom();
		});
	}

	// --- GEOJSON Layer ---
	async function showGeoJSONLayer() {
		clearGeoJSONLayer();
		geoJSONLayer = await renderGEOJSON(map, showLegend);
		if (focusOnMount && !fittedOnMount && geoJSONLayer) {
			map.stop();
			map.fitBounds(geoJSONLayer.getBounds(), { padding: [20, 20], animate: false });
			fittedOnMount = true;
		}
		appState.mapLoading = false;
	}

	function clearGeoJSONLayer() {
		if (!geoJSONLayer) return;
		geoJSONLayer._legend?.remove();
		map.removeLayer(geoJSONLayer);
		geoJSONLayer = null;
	}

	// --- Marker ---

	function placeOrUpdateMarker(lat, lng, icon) {
		if (marker) {
			marker.setLatLng({ lat, lng });
			marker.setIcon(icon);
		} else {
			marker = L.marker({ lat, lng }, { icon }).addTo(map);
		}
	}

	function navigateToLocation(lat, lng, fly) {
		// untrack: reads zoom without creating an effect dependency
		const zoom = untrack(() => appState.location.zoom);
		const zoomedOut = zoom <= MIN_ZOOM;
		map.stop();
		if (fly) {
			zoomedOut
				? map.flyTo([lat, lng], LANDMARK_ZOOM, { duration: 1.5 })
				: map.panTo([lat, lng]);
		} else {
			map.setView([lat, lng], zoomedOut ? LANDMARK_ZOOM : zoom, {
				animate: false,
			});
		}
	}

	// --- Effects ---

	// Keep map div sized correctly upon container resize
	$effect(() => {
		if (!mapContainer || !map) return;
		const observer = new ResizeObserver(() => map.invalidateSize());
		observer.observe(mapContainer);
		return () => observer.disconnect();
	});

	// Clear manualAddress flag when address is emptied so reverse geocode resumes
	$effect(() => {
		if (!appState.location.address) appState.manualAddress = false;
	});

	// Show/hide GeoJSON layer based on whether results are up to date
	$effect(() => {
		if (!map) return;
		if (appState.mapIsUpToDate) {
			showGeoJSONLayer();
		}
	});

	// Mark results stale and auto-run model whenever entries, total OEF, or location change.
	$effect(() => {
		// `void expr` is the Svelte 5 idiom for "track this as a dependency without using the value."
		void entries.length;
		void entries.reduce((sum, e) => sum + (e.totalEmission ?? 0), 0);
		void appState.location.lat;
		void appState.location.lng;

		// Skip the initial run: on first mount these dependencies haven't changed, so there's nothing
		// to stale. Without the skip a footprint already loaded would be
		// immediately invalidated the moment the component mounts.
		if (!mapEffectBehind) {
			mapEffectBehind = true;
			return;
		}
		appState.mapIsUpToDate = false;
		untrack(() => {
			if (appState.location.fly && map) {
				// setTimeout(0) defers past map.stop() in navigateToLocation, which fires
				// moveend synchronously and would trigger the listener too early.
				setTimeout(() => map.once("moveend", () => getAndRun()), 0);
			} else {
				getAndRun();
			}
		});
	});

	// Sync marker position, icon, and camera with appState
	$effect(() => {
		if (!L || !map) return;
		const { lat, lng } = appState.location;

		// fly is read and cleared via untrack so this effect doesn't depend on it.
		// If fly were read normally, clearing fly = false here would re-trigger this
		// same effect in a loop.
		const fly = untrack(() => appState.location.fly);
		untrack(() => {
			appState.location.fly = false;
		});
		placeOrUpdateMarker(
			lat,
			lng,
			resolveMarkerIcon(L, currentSpecies, appState.mapIsUpToDate),
		);

		// skip navigation on first placement unless focusOnMount is set
		if (!initialized) {
			initialized = true;
			if (focusOnMount) navigateToLocation(lat, lng, false);
			return;
		}
		navigateToLocation(lat, lng, fly);
	});
</script>

<!-- Map Container -->
<div class="map-wrapper">
	<div
		bind:this={mapContainer}
		class="map"
		class:blurred={appState.location.searching}
	>
		<!-- Location Overlay -->
		{#if enableNav}
			<div class="overlay" bind:this={locOverlay}>
				<LocationSelection />
			</div>
		{/if}
	</div>

	{#if appState.location.searching}
		<div class="loading-overlay">
			<LoadingIcon />
		</div>
	{/if}
</div>

<style>
	/* Map Container */
	.map-wrapper {
		position: relative;
		width: 100%;
		min-height: 590px;
		height: 100%;
	}

	.map {
		width: 100%;
		height: 100%;
		position: relative;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: filter 0.5s ease;
	}

	.map.blurred {
		filter: blur(4px);
		pointer-events: none;
	}

	.loading-overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1001;
	}
	/* Location Overlay */
	.overlay {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 1000; /* must be above Leaflet's panes */
		background: white;
		border: 1px solid var(--color-kelly-green);
		transition: all 0.3s ease;
		padding: 0.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		max-width: 320px;
		width: max-content;
	}
</style>
