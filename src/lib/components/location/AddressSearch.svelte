<!--
	AddressSearch - the address box and its submit/reset buttons.

	Markup only. The geocoding lookup lives in the parent (LocationSelection)
	and is passed in as `handleSubmit`, so this component stays reusable and
	the network call has a single home. Reset clears the address and returns
	the camera to the Michigan-wide default.
-->
<script>
	// --- Imports ---
	import { appState } from "$lib/state/appState.svelte.js";
	import { DEFAULT_LAT, DEFAULT_LNG } from "$lib/state/defaultValues.svelte.js";
	// --- Props ---
	let { handleSubmit } = $props();

	function handleReset() {
		appState.location.address = "";
		appState.location.lat = DEFAULT_LAT;
		appState.location.lng = DEFAULT_LNG;
	}

</script>

<section class="form-wrapper">
	<form onsubmit={handleSubmit} onreset={handleReset}>
		<div class="form-group">
			<label for="address">Address</label>
			<input
				id="address"
				name="address"
				placeholder=""
				bind:value={appState.location.address}
			/>
		</div>
	</form>
</section>

<style>
	/* Input */
	form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 100%;
	}

	.form-wrapper {
		width: 100%;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		width: 100%;
	}

	label {
		font-weight: 500;
		color: #333;
		font-size: 1rem;
	}

	input {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-family: inherit;
		width: 100%;
		box-sizing: border-box;
		transition: all 0.3s ease;
	}

	/* Spinner Override */
	/* Chrome, Safari, Edge, Opera */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	/* Focus & Hover */
	input:hover {
		border-color: #999;
	}

	input:focus {
		outline: none;
		border-color: #4caf50;
		box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
	}
</style>
