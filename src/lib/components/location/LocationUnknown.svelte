<!--
	LocationUnknown - the "we couldn't find that address" notice.

	Dismissible, and re-shows itself whenever the address changes so a second
	failed search is not silent after the user has closed it once.
-->
<script>
	import { appState } from "$lib/state/appState.svelte.js";
	let visible = $state(true);

	function handleClose() {
		visible = false;
	}

	// re-show when the address changes so the user can retry
	$effect(() => {
		appState.location.address;
		visible = true;
	});
</script>

{#if visible}
	<div class="error-wrapper">
		<button class="hide-error" onclick={handleClose}><b>X</b></button>
		<span class="error-message">Address is invalid. Try again</span>
	</div>
{/if}

<style>
	.error-wrapper {
		-webkit-font-smoothing: antialiased;
		display: flex;
		flex-direction: row;
		align-items: baseline;
		gap: 0.5rem;
		color: black;
		cursor: auto;
		padding: 0.5rem 0.2em 0.5rem 0.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border-radius: 4px;
		background-color: #e8abab6f;
		transition: all 0.3s ease;
	}
	.error-wrapper button {
		flex-shrink: 0;
		border-radius: 4px;
		padding: 0.3rem 0.5rem;
		font-family: Tahoma, sans-serif;
		font-size: 1rem;
		line-height: 1;
		transition: all 0.3s ease;
	}
	.error-wrapper button:hover {
		background-color: rgba(228, 131, 131, 0.579);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	.hide-error {
		color: #c00;
		cursor: pointer;
		border: none;
		background-color: rgba(255, 255, 255, 0);
	}

	.error-message {
		font-size: 1rem;
		line-height: 1;
	}
</style>
