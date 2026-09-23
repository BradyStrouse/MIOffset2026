<!--
	FormWizard - renders a form from a step config array.

	The shared engine behind AnimalForm, StorageForm and ManualForm: each of
	those is just a list of step definitions, so the three stay consistent in
	layout, help text and validation without repeating markup.

	There is no submit. `formState` is bound to the selected building itself,
	so every keystroke is already saved - which is also why MapView debounces
	the model run rather than waiting for a commit.
-->
<script>
	// --- Props ---
	import NumberInput from "./NumberInput.svelte";

	// Renders a list of step definitions against a target object, writing each
	// field straight back. There is no submit: the target is the selected
	// building itself, so every edit is already saved.
	let { steps, formState = $bindable() } = $props();

	// Auto-fill when only one option is available
	$effect(() => {
		for (const step of steps) {
			if (step.type === "select" && step.options?.length === 1) {
				formState[step.key] = step.options[0].value;
			}
		}
	});
</script>

<div class="fields">
	{#each steps as step}
		<div class="field">
			<label for={step.key}>
				{step.label.replace(":", "")}
				{#if step.required}<span class="required" aria-hidden="true">*</span
					>{/if}
			</label>

			{#if step.type === "select"}
				<select
					id={step.key}
					bind:value={formState[step.key]}
					disabled={step.disabled ? step.disabled(formState) : false}
					required={step.required}
					aria-label={step.label}
				>
					<option value=""
						>{step.placeholder ||
							"Select " + step.label.toLowerCase().replace(":", "")}</option
					>
					{#each step.options as option}
						<option value={option.value}>{option.text}</option>
					{/each}
				</select>
			{:else if step.type === "number"}
				<NumberInput
					id={step.key}
					bind:value={formState[step.key]}
					placeholder={step.placeholder}
					ariaLabel={step.label}
				/>
			{/if}
			{#if step.helpText}
				<p class="help-text">{step.helpText}</p>
			{/if}
		</div>
	{/each}
</div>

<style>
	.fields {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	label {
		font-size: 0.9rem;
		font-weight: 600;
		color: #2c3e50;
	}

	.required {
		color: #c0392b;
		margin-left: 0.15rem;
	}

	.help-text {
		margin: 0;
		color: #888;
		font-size: 0.82rem;
		line-height: 1.4;
	}

	/* Inputs */
	select {
		padding: 0.55rem 0.65rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 1rem;
		font-family: inherit;
		background: white;
		width: 100%;
		transition: all 0.2s ease;
	}

	select:hover {
		border-color: #999;
	}

	select:focus {
		outline: none;
		border-color: #4caf50;
		box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.12);
	}

	select:disabled {
		background-color: #f5f5f5;
		color: #999;
		cursor: not-allowed;
	}
</style>
