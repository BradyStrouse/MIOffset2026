<!--
	ManualForm - the step config for entering an emission factor directly.

	The escape hatch for a structure the standard categories do not cover, or
	where a measured value is available. The number is used as-is and also
	weights the structure's pull on the site centroid, so it is not merely
	cosmetic.
-->
<script>
	import FormWizard from "../common/FormWizard.svelte";

	// Edits the building in place - no draft, no submit.
	let { building } = $props();

	// --- Form Step Config ---
	const manualSteps = [
		{
			key: "manualEmission",
			label: "Odor Emission Factor:",
			type: "number",
			min: 0,
			step: 1,
			placeholder: "10",
			helpText:
				"Odor Emission Factor for this structure. It is used directly, and also weights the structure's pull on the site centroid.",
			required: true,
		},
	];
</script>

<FormWizard steps={manualSteps} bind:formState={building} />
