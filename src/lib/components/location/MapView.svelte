<!--
	MapView - the map, and everything drawn on it.

	Owns the app's only Leaflet instance and every layer on it: the basemap,
	a marker per building, the calculated centroid marker, and the odor
	footprint GeoJSON. Buildings arrive either by drag from BuildingPalette or
	by the click-to-place mode it arms; both land here.

	Two things to know before editing:

	- Leaflet objects are held in $state.raw, not $state. Deep proxying a
	  Leaflet map breaks the library; raw still notifies effects when the
	  top-level variable is reassigned.
	- Because forms write straight to the building with no submit, edits are
	  debounced here before they trigger work: AUTO_RUN_DEBOUNCE_MS for the
	  wind fetch and model run, and a longer GEOCODE_DEBOUNCE_MS for the
	  address lookup, which costs an external call and is only cosmetic.

	The effects near the bottom are the camera. They are written to avoid
	feedback loops with Leaflet's own move events - read the comments there
	before changing one.
-->
<script>
	// --- Imports ---
	import { onMount, onDestroy, untrack } from "svelte";
	import {
		appState,
		buildings,
		site,
		addBuilding,
		selectBuilding,
	} from "$lib/state/appState.svelte.js";
	import {
		mapIcons,
		buildingIconKey,
		resolveBuildingIcon,
		createCentroidIcon,
	} from "$lib/state/mapIcons.svelte.js";
	import {
		LANDMARK_ZOOM,
		PLACEMENT_ZOOM,
		MAX_ZOOM,
		MIN_ZOOM,
		BUILDING_DRAG_TYPE,
		BUILDING_LATLNG_PRECISION,
		DEFAULT_ZOOM,
	} from "$lib/state/defaultValues.svelte.js";
	import { reverseGeocode } from "$lib/utils/map/reverseGeocode.js";
	import LocationSelection from "./LocationSelection.svelte";
	import BuildingPalette from "./BuildingPalette.svelte";
	import { renderGEOJSON } from "$lib/utils/map/mapRenderLayers.js";
	import {
		BASEMAPS,
		DEFAULT_BASEMAP,
		createBasemapLayer,
		basemapKeyFromLabel,
	} from "$lib/utils/map/basemaps.js";
	import LoadingIcon from "../common/LoadingIcon.svelte";
	import { getAndRun } from "$lib/utils/model/runModel.svelte.ts";

	// --- Props & State ---
	let {
		enableNav = false,
		focusOnMount = false,
		interactive = true,
		showLegend = false,
	} = $props();

	// Live editing means a single keystroke in the area field would otherwise
	// kick off a full wind-fetch + model run. Coalesce bursts of edits instead.
	const AUTO_RUN_DEBOUNCE_MS = 500;
	// Longer: this one costs an external geocoding call, and the address is only
	// cosmetic, so it can afford to lag behind the model.
	const GEOCODE_DEBOUNCE_MS = 1500;

	// $state.raw rather than $state: Leaflet objects are large and can break the library
	// raw still signals effects when the top-level variables are reassigned.
	let L = $state.raw(null);
	let mapContainer = $state(null);
	let map = $state.raw(null);
	let locOverlay = $state(null);
	let paletteOverlay = $state(null);
	let recenterOverlay = $state(null);

	// Plain values, deliberately NOT $state - mutating them must not re-trigger the
	// effects that read them.
	let markers = new Map(); // building id -> L.Marker
	let centroidMarker = null;
	let geoJSONLayer;
	let baseLayers = {}; // label -> L.TileLayer, in the shape L.control.layers expects
	let activeBaseLayer = null;
	let fittedOnMount = false;
	let autoRunPrimed = false;

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
		if (buildings.length > 0) fitToBuildings();
	});

	onDestroy(() => map?.remove());

	function initMap() {
		const michiganBounds = L.latLngBounds(
			L.latLng(40.55, -90.5),
			L.latLng(48.3, -80.4),
		);

		map = L.map(mapContainer, {
			minZoom: MIN_ZOOM,
			maxZoom: MAX_ZOOM,
			zoom: DEFAULT_ZOOM,
			maxBounds: michiganBounds,
			maxBoundsViscosity: 0.5, // 1.0 = fully rigid boundary, no rubber-band when panning to the edge
		});

		initBasemaps();
		map.fitBounds(michiganBounds);
		appState.location.zoom = map.getZoom();
	}

	// --- Basemaps ---

	/**
	 * Builds one tile layer per entry in BASEMAPS and adds the one appState selected.
	 * The layers control is only offered on the interactive map; the report map inherits
	 * whatever was chosen there via appState.basemap.
	 */
	function initBasemaps() {
		baseLayers = Object.fromEntries(
			Object.entries(BASEMAPS).map(([key, { label }]) => [
				label,
				createBasemapLayer(L, key),
			]),
		);

		activeBaseLayer =
			baseLayers[BASEMAPS[appState.basemap]?.label] ??
			baseLayers[BASEMAPS[DEFAULT_BASEMAP].label];
		activeBaseLayer.addTo(map);

		if (!interactive) return;

		L.control.layers(baseLayers, null, { position: "topleft" }).addTo(map);
		map.on("baselayerchange", (e) => {
			// Leaflet already swapped the layer; just record the choice so it persists
			// across pages. The $effect below no-ops because the layer is on the map.
			activeBaseLayer = e.layer;
			appState.basemap = basemapKeyFromLabel(e.name);
		});
	}

	function setBasemap(key) {
		const layer = baseLayers[BASEMAPS[key]?.label];
		if (!layer || map.hasLayer(layer)) return;
		if (activeBaseLayer) map.removeLayer(activeBaseLayer);
		layer.addTo(map);
		activeBaseLayer = layer;
	}

	function registerMapEvents() {
		map.on("zoom", () => {
			appState.location.zoom = map.getZoom();
		});

		// Mirror the camera into appState so the coordinate readout tracks the
		// view. Safe against feedback: the camera effect below only acts when the
		// `fly` flag is set, which panning never sets.
		map.on("moveend", () => {
			const center = map.getCenter();
			appState.location.lat = center.lat;
			appState.location.lng = center.lng;
		});

		if (!interactive) return;

		map.on("click", (e) => {
			if (appState.placing) {
				placeBuilding(e.latlng.lat, e.latlng.lng);
				appState.placing = false;
			} else {
				// Edits save live, so dropping the selection costs nothing.
				selectBuilding(null);
			}
		});
	}

	// --- Placement ---

	/**
	 * Drops a new building and frames it. The first structure on an empty map
	 * gets a zoom-in, because the Michigan-wide default view is far too coarse
	 * to position a barn at the precision the worksheet expects.
	 */
	function placeBuilding(lat, lng) {
		const isFirst = buildings.length === 0;
		addBuilding(lat, lng);

		if (isFirst && map.getZoom() < PLACEMENT_ZOOM) {
			map.flyTo([lat, lng], PLACEMENT_ZOOM, { duration: 1.2 });
		}
	}

	function fitToBuildings({ animate = false } = {}) {
		if (!map || buildings.length === 0) return;
		const bounds = L.latLngBounds(buildings.map((b) => [b.lat, b.lng]));
		map.stop();
		map.fitBounds(bounds, {
			padding: [60, 60],
			maxZoom: PLACEMENT_ZOOM,
			animate,
		});
	}

	/**
	 * Frames every placed building again after the user has panned away. The
	 * camera effect below is bypassed deliberately: it only ever centres on a
	 * point, which would clip a site whose buildings are spread out.
	 */
	function handleRecenter() {
		fitToBuildings({ animate: true });
	}

	function handleDragOver(e) {
		if (!interactive) return;
		if (!e.dataTransfer.types.includes(BUILDING_DRAG_TYPE)) return;
		// Both preventDefault calls are required for the drop event to fire.
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
	}

	function handleDrop(e) {
		if (!interactive || !map) return;
		if (!e.dataTransfer.types.includes(BUILDING_DRAG_TYPE)) return;
		e.preventDefault();

		// DragEvent extends MouseEvent, so Leaflet can resolve it against the
		// container without any manual offset arithmetic.
		const { lat, lng } = map.mouseEventToLatLng(e);
		placeBuilding(lat, lng);
		appState.placing = false;
	}

	function handleKeydown(e) {
		if (e.key === "Escape" && appState.placing) appState.placing = false;
	}

	// --- GEOJSON Layer (Odor Footprint) ---
	async function showGeoJSONLayer() {
		clearGeoJSONLayer();
		geoJSONLayer = await renderGEOJSON(map, showLegend);
		if (focusOnMount && !fittedOnMount && geoJSONLayer) {
			map.stop();
			map.fitBounds(geoJSONLayer.getBounds(), {
				padding: [20, 20],
				animate: false,
			});
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

	// --- Markers ---
	function createMarker(building) {
		const marker = L.marker([building.lat, building.lng], {
			icon: resolveBuildingIcon(
				L,
				building,
				building.id === appState.selectedId,
			),
			draggable: interactive,
			autoPan: true,
		}).addTo(map);

		marker.on("click", (e) => {
			L.DomEvent.stopPropagation(e); // don't let the map's click deselect it again
			selectBuilding(building.id);
		});

		// dragend only, for two reasons: updating on every `drag` frame would
		// restart the debounced model run on each mousemove, and selecting
		// mid-drag would swap this marker's icon - which replaces the DOM element
		// Leaflet is currently dragging and drops the gesture.
		marker.on("dragend", () => {
			const { lat, lng } = marker.getLatLng();
			const target = buildings.find((b) => b.id === building.id);
			if (!target) return;
			target.lat = lat;
			target.lng = lng;
			selectBuilding(building.id);
		});

		return marker;
	}

	function markerTooltip(building) {
		const name = building.name || "Unnamed building";
		return `${name}<br><span class="tooltip-coords">${building.lat.toFixed(
			BUILDING_LATLNG_PRECISION,
		)}, ${building.lng.toFixed(BUILDING_LATLNG_PRECISION)}</span>`;
	}

	// --- Effects ---

	// Keep the overlays from panning/zooming the map underneath them. This is an
	// effect rather than part of initMap because the location overlay mounts only
	// once the first building is placed, well after the map is built.
	$effect(() => {
		if (!L || !map) return;
		for (const overlay of [locOverlay, paletteOverlay, recenterOverlay]) {
			if (!overlay) continue;
			L.DomEvent.disableClickPropagation(overlay);
			L.DomEvent.disableScrollPropagation(overlay);
		}
	});

	// Keep map div sized correctly upon container resize
	$effect(() => {
		if (!mapContainer || !map) return;
		const observer = new ResizeObserver(() => map.invalidateSize());
		observer.observe(mapContainer);
		return () => observer.disconnect();
	});

	// Follow basemap changes made elsewhere (e.g. picked on the map page, then the
	// report page mounts its own map with the same selection)
	$effect(() => {
		const key = appState.basemap;
		if (!map) return;
		untrack(() => setBasemap(key));
	});

	// Clear manualAddress flag when address is emptied so reverse geocode resumes
	$effect(() => {
		if (!appState.location.address) appState.manualAddress = false;
	});

	// Name the site from its own source point.
	// with buildings, the centroid is the thing worth labelling, and it is what
	// the report header prints. Skipped once the user has typed or searched an
	// address of their own.
	$effect(() => {
		if (!interactive || appState.manualAddress) return;
		const centroid = site.centroid;
		if (!centroid) return;

		const timer = setTimeout(() => {
			reverseGeocode(centroid.lat, centroid.lng).then((address) => {
				if (address !== null && !appState.manualAddress)
					appState.location.address = address;
			});
		}, GEOCODE_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	});

	// Show the footprint once results are up to date. While they are merely
	// stale the previous footprint deliberately stays on screen - with live
	// editing, tearing it down on each keystroke would make the map flicker.
	// It is only removed once there is genuinely nothing left to draw.
	$effect(() => {
		if (!map) return;
		if (appState.mapIsUpToDate) {
			showGeoJSONLayer();
		} else if (!site.centroid || site.totalOEF <= 0) {
			clearGeoJSONLayer();
		}
	});

	// Reconcile building markers with state: add, remove, move, re-icon, re-label.
	$effect(() => {
		if (!L || !map) return;

		const selectedId = appState.selectedId;
		const seen = new Set();

		for (const building of buildings) {
			seen.add(building.id);
			let marker = markers.get(building.id);

			if (!marker) {
				marker = createMarker(building);
				markers.set(building.id, marker);
			} else {
				const current = marker.getLatLng();
				if (current.lat !== building.lat || current.lng !== building.lng)
					marker.setLatLng([building.lat, building.lng]);
			}

			// setIcon replaces the marker's DOM element, so only call it when the
			// icon actually changes - otherwise every unrelated edit would rebuild
			// every marker and restart its CSS transition.
			const signature = `${buildingIconKey(building)}|${building.id === selectedId}`;
			if (marker._iconSignature !== signature) {
				marker._iconSignature = signature;
				marker.setIcon(
					resolveBuildingIcon(L, building, building.id === selectedId),
				);
			}

			marker.bindTooltip(markerTooltip(building), { direction: "bottom" });
		}

		for (const [id, marker] of markers) {
			if (seen.has(id)) continue;
			map.removeLayer(marker);
			markers.delete(id);
		}
	});

	// The odor source: an emission-weighted centroid of every placed building.
	$effect(() => {
		if (!L || !map) return;
		const centroid = site.centroid;

		if (!centroid) {
			if (centroidMarker) {
				map.removeLayer(centroidMarker);
				centroidMarker = null;
			}
			return;
		}

		if (!centroidMarker) {
			centroidMarker = L.marker([centroid.lat, centroid.lng], {
				icon: createCentroidIcon(L),
				interactive: true,
				keyboard: false,
				zIndexOffset: 500,
			}).addTo(map);
		} else {
			centroidMarker.setLatLng([centroid.lat, centroid.lng]);
		}

		centroidMarker.bindTooltip(
			`Odor source &mdash; ${
				centroid.weighted
					? "emission-weighted centroid"
					: "centre of placed buildings"
			}<br><span class="tooltip-coords">${centroid.lat.toFixed(
				BUILDING_LATLNG_PRECISION,
			)}, ${centroid.lng.toFixed(BUILDING_LATLNG_PRECISION)}</span>`,
			{ direction: "bottom" },
		);
	});

	// Mark results stale and re-run the model whenever the source point or the
	// site's total emission changes. The returned cleanup runs before the next
	// pass, which is what debounces a burst of keystrokes into one run.
	$effect(() => {
		const centroid = site.centroid;
		void centroid?.lat;
		void centroid?.lng;
		void site.totalOEF;

		// Skip the initial pass: on first mount nothing has changed, and without
		// the skip a footprint restored from a permalink would be invalidated the
		// moment this component mounts.
		if (!autoRunPrimed) {
			autoRunPrimed = true;
			return;
		}

		appState.mapIsUpToDate = false;
		const timer = setTimeout(
			() => untrack(() => getAndRun()),
			AUTO_RUN_DEBOUNCE_MS,
		);
		return () => clearTimeout(timer);
	});

	// Camera moves, driven by the address search / reset controls only.
	$effect(() => {
		if (!map) return;
		const { lat, lng } = appState.location;

		// fly is read and cleared via untrack so this effect doesn't depend on it.
		// If fly were read normally, clearing it here would re-trigger this same
		// effect in a loop.
		const fly = untrack(() => appState.location.fly);
		if (!fly) return;
		untrack(() => {
			appState.location.fly = false;
		});

		map.stop();
		map.flyTo(
			[lat, lng],
			Math.max(
				untrack(() => appState.location.zoom),
				LANDMARK_ZOOM,
			),
			{ duration: 1.5 },
		);
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Map Container -->
<div class="map-wrapper">
	<!-- svelte-ignore a11y_no_static_element_interactions -- drop target for the building palette; keyboard users place via the palette's click-to-arm mode -->
	<div
		bind:this={mapContainer}
		class="map"
		class:blurred={appState.location.searching}
		class:placing={appState.placing}
		ondragover={handleDragOver}
		ondrop={handleDrop}
	>
		<!-- Location Overlay. Until the first building is placed these controls
		     live in the side panel instead, where the empty state has room for
		     them and finding the property is the only task on offer. -->
		{#if enableNav && buildings.length > 0}
			<div class="overlay overlay-top" bind:this={locOverlay}>
				<LocationSelection />
			</div>
		{/if}

		<!-- Building Palette -->
		{#if interactive}
			<div class="overlay overlay-bottom" bind:this={paletteOverlay}>
				<BuildingPalette onPlaceRequest={() => selectBuilding(null)} />
			</div>

			<!-- Recenter -->
			<div class="overlay overlay-bottom-right" bind:this={recenterOverlay}>
				<button
					type="button"
					class="recenter"
					onclick={handleRecenter}
					disabled={buildings.length === 0}
					title={buildings.length === 0
						? "Place a building to enable recentering"
						: "Recenter the map on the site"}
				>
					<!-- Tabler Icons "focus-centered" (MIT) - https://tabler.io/icons -->
					<svg
						class="recenter-icon"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
						<path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
						<path d="M4 16v2a2 2 0 0 0 2 2h2" />
						<path d="M16 4h2a2 2 0 0 1 2 2v2" />
						<path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
					</svg>
					<span>Recenter</span>
				</button>
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

	/* Armed placement mode - the whole canvas becomes a target */
	.map.placing :global(.leaflet-container) {
		cursor: crosshair;
	}

	.map.placing {
		outline: 2px dashed var(--color-kelly-green);
		outline-offset: -2px;
	}

	.loading-overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1001;
	}

	/* Overlays */
	.overlay {
		position: absolute;
		z-index: 1000; /* must be above Leaflet's panes */
		transition: all 0.3s ease;
	}

	.overlay-top {
		top: 1rem;
		right: 1rem;
		background: white;
		border: 1px solid var(--color-kelly-green);
		padding: 0.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		max-width: 320px;
		width: max-content;
	}

	.overlay-bottom {
		bottom: 1.5rem;
		left: 1rem;
	}

	/* Lifted clear of Leaflet's attribution strip in the same corner */
	.overlay-bottom-right {
		bottom: 1.5rem;
		right: 1rem;
	}

	.recenter {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0.6rem;
		background: white;
		border: 1px solid var(--color-kelly-green);
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		color: #2c3e50;
		font-family: inherit;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.15s,
			transform 0.15s;
	}

	.recenter:hover:not(:disabled) {
		background: #eaf6ea;
		transform: translateY(-1px);
	}

	.recenter:active:not(:disabled) {
		transform: none;
	}

	.recenter:disabled {
		border-color: #ccc;
		color: #999;
		cursor: not-allowed;
	}

	.recenter-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	/* Leaflet markers live outside the component tree, so these must be global. */
	.map :global(.building-marker) {
		transition:
			filter 0.15s ease,
			transform 0.15s ease;
		cursor: grab;
		opacity: 80%;
	}

	.map :global(.building-marker.is-selected) {
		filter: drop-shadow(0 0 5px var(--color-kelly-green))
			drop-shadow(0 0 5px var(--color-spartan-green));
			opacity: 100%;
	}

	.map :global(.centroid-marker) {
		filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.9));
	}

	.map :global(.tooltip-coords) {
		font-variant-numeric: tabular-nums;
		color: #666;
		font-size: 0.8em;
	}
</style>
