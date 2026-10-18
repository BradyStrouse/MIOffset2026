<!--
	StorageForm - the step config for a manure storage.

	Handed to FormWizard, same as the other two forms. Area here means the
	exposed surface of the storage, not a building footprint, because that is
	the surface odor leaves from. A cover is modelled as a technology
	adjustment rather than by reducing the area.
-->
<script>
	import storageData from "$lib/data/storageData.json";
	import FormWizard from "../common/FormWizard.svelte";
	import { technologyOptions } from "$lib/utils/model/OdorEmissionFactor.js";

	// Edits the building in place - no draft, no submit.
	let { building } = $props();

	// Greyed out when not listed for this storage type or conflicting with a pick
	let technologies = $derived(technologyOptions(building));

	// A storage type change clears the technology picks. `last` is plain (not
	// $state) and carries the building, so switching buildings isn't a change.
	let last = null;
	$effect(() => {
		const key = building.storageType;
		if (last?.building === building && last.key !== key) building.technology = [];
		last = { building, key };
	});

	// --- Form Step Config ---
	const storageSteps = $derived([
		{
			key: "storageType",
			label: "Storage Type:",
			type: "select",
			options: Object.keys(storageData.STORAGE).map((s) => ({
				value: s,
				text: storageData.STORAGE[s].display,
			})),
			required: true,
		},
		{
			key: "technology",
			label: "Technology Adjustment:",
			type: "multiselect",
			options: technologies,
			placeholder: "No technology adjustment",
			helpText: "Select all that apply",
			disabled: (state) => !state.storageType,
		},
		{
			key: "area",
			label: "Area (sq. ft.):",
			type: "number",
			min: 0,
			step: 0.01,
			placeholder: "0",
			helpText: "Surface area of this storage in square feet",
		},
	]);
</script>

<FormWizard steps={storageSteps} bind:formState={building} />
