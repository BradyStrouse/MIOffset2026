<!--
	Help - the user documentation.

	Entirely driven by /content/help.md; adding a "## heading" there adds a
	section here and nothing needs wiring up. See EDITING-THE-SITE.md.
-->
<script>
	// --- Imports ---
	// The words on this page live in /content/help.md.
	import Doc from "$lib/components/common/Doc.svelte";
	import help from "$content/help.md?raw";
	import { usePermalink } from "$lib/utils/linkHandler.svelte.js";

	// Keeps ?data= on the address bar so leaving the map for help and coming
	// back does not lose the site being worked on.
	usePermalink({ run: false });
</script>

<svelte:head>
	<title>Help - Michigan OFFSet 2026</title>
</svelte:head>

<div class="help-container">
	<Doc source={help} />
</div>

<style>
	.help-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
		line-height: 1.7;
		color: #333;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.help-container {
			padding: 1rem;
		}
	}
</style>
