<!--
	AnimalForm - the step config for an animal housing structure.

	Mostly a data file: the steps array is handed to FormWizard, which does the
	rendering. Species, animal type and housing type together pick the odor
	emission factor out of animalData.json, so the three selects cascade -
	each one's options come from the level above.

	The effects at the bottom clear a child selection that a parent change has
	made invalid, otherwise a stale housing type would survive a species switch.
-->
<script>
	// --- Imports ---
	import data from "$lib/data/animalData.json" with { type: "json" };
	import FormWizard from "../common/FormWizard.svelte";

	// Edits the building in place - no draft, no submit.
	let { building } = $props();

	// --- Dropdown Options ---
	let animalTypeOptions = $derived(
		building.species
			? Object.keys(data.SPECIES[building.species]?.animalTypes || {})
			: [],
	);
	let housingTypeOptions = $derived(
		building.animalType && building.species
			? Object.keys(
					data.SPECIES[building.species]?.animalTypes[building.animalType]
						?.housingType || {},
				)
			: [],
	);
	let technologies = $derived(Object.keys(data.TECH || {}));

	// --- Form Step Config ---
	const odorSteps = $derived([
		{
			key: "species",
			label: "Species:",
			type: "select",
			options: Object.keys(data.SPECIES).map((spec) => ({
				value: spec,
				text: data.SPECIES[spec].display,
			})),
			required: true,
		},
		{
			key: "animalType",
			label: "Animal Type:",
			type: "select",
			options: animalTypeOptions.map((type) => ({ value: type, text: type })),
			required: true,
			disabled: (state) => !state.species,
		},
		{
			key: "housingType",
			label: "Housing Type:",
			type: "select",
			options: housingTypeOptions.map((housing) => ({
				value: housing,
				text: housing,
			})),
			required: true,
			disabled: (state) => !state.animalType,
		},
		{
			key: "technology",
			label: "Technology Adjustment:",
			type: "select",
			options: technologies.map((tech) => ({
				value: tech,
				text: data.TECH[tech].display,
			})),
			required: true,
		},
		{
			key: "area",
			label: "Area (sq. ft.):",
			type: "number",
			min: 0,
			step: 0.01,
			placeholder: "0",
			helpText: "Footprint of this building in square feet",
		},
	]);

	// --- Effects ---
	function resetIfInvalid(options, key) {
		if (building[key] && !options.includes(building[key])) building[key] = "";
	}

	// when species/animalType changes, the previously selected child value may no longer be valid
	$effect(() => resetIfInvalid(animalTypeOptions, "animalType"));
	$effect(() => resetIfInvalid(housingTypeOptions, "housingType"));
</script>

<FormWizard steps={odorSteps} bind:formState={building} />
