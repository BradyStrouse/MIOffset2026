<!--
	MultiSelect - a dropdown of checkboxes for "select all that apply" fields.

	Looks like the native selects around it when closed, and summarises the
	picks in the trigger so the form stays compact. `value` is an array of
	option values. Toggling always assigns a fresh array rather than mutating,
	so a default array shared between buildings is never altered. An option
	with `dimmed: true` is greyed out as a warning but can still be ticked.
-->
<script>
	let {
		id,
		options = [],
		value = $bindable([]),
		placeholder = "Select all that apply",
		ariaLabel,
		disabled = false,
	} = $props();

	let open = $state(false);
	let root;

	let selected = $derived(
		options.filter((option) => value?.includes(option.value)),
	);
	let summary = $derived(
		selected.length === 0
			? placeholder
			: selected.length === 1
				? selected[0].text
				: `${selected.length} selected`,
	);

	function toggle(optionValue, checked) {
		const rest = (value ?? []).filter((v) => v !== optionValue);
		value = checked ? [...rest, optionValue] : rest;
	}

	function clear() {
		value = [];
	}

	// Close when focus or a click lands outside the component
	function handleWindowClick(e) {
		if (open && root && !root.contains(e.target)) open = false;
	}

	// preventDefault stops the native option list from opening
	function handleTriggerMousedown(e) {
		e.preventDefault();
		e.currentTarget.focus();
		open = !open;
	}

	const OPEN_KEYS = ["Enter", " ", "ArrowDown", "ArrowUp"];
	function handleTriggerKeydown(e) {
		if (!OPEN_KEYS.includes(e.key)) return;
		e.preventDefault();
		open = true;
		// move focus into the panel once it has rendered
		requestAnimationFrame(() =>
			root.querySelector(".panel input")?.focus(),
		);
	}

	function handleKeydown(e) {
		if (e.key === "Escape" && open) {
			open = false;
			root.querySelector(".trigger")?.focus();
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="multiselect" bind:this={root} onkeydown={handleKeydown}>
	<!-- A real <select> so the arrow is the browser's own, identical to the
	     other dropdowns; its native popup is suppressed and our panel opens
	     instead. The single option only carries the summary text. -->
	<select
		{id}
		class="trigger"
		class:placeholder={selected.length === 0}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label={ariaLabel}
		{disabled}
		onmousedown={handleTriggerMousedown}
		onkeydown={handleTriggerKeydown}
		title={selected.map((o) => o.text).join(", ")}
	>
		<option>{summary}</option>
	</select>

	{#if open}
		<div class="panel" role="listbox" aria-multiselectable="true">
			{#each options as option (option.value)}
				<label class="option" class:dimmed={option.dimmed}>
					<input
						type="checkbox"
						checked={value?.includes(option.value)}
						onchange={(e) => toggle(option.value, e.currentTarget.checked)}
					/>
					<span>{option.text}</span>
				</label>
			{/each}
			{#if selected.length}
				<button type="button" class="clear" onclick={clear}>Clear all</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.multiselect {
		position: relative;
		width: 100%;
	}

	/* Trigger mirrors FormWizard's select styling */
	.trigger {
		width: 100%;
		padding: 0.55rem 0.65rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 1rem;
		font-family: inherit;
		background: white;
		text-overflow: ellipsis;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.trigger:hover {
		border-color: #999;
	}

	.trigger:focus-visible,
	.trigger[aria-expanded="true"] {
		outline: none;
		border-color: #4caf50;
		box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.12);
	}

	.trigger:disabled {
		background-color: #f5f5f5;
		color: #999;
		cursor: not-allowed;
	}

	.trigger.placeholder {
		color: #777;
	}

	/* Panel */
	.panel {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		z-index: 20;
		max-height: 260px;
		overflow-y: auto;
		background: white;
		border: 1px solid #ccc;
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
		padding: 0.3rem 0;
	}

	.option {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.4rem 0.65rem;
		font-size: 0.92rem;
		font-weight: 400;
		color: #333;
		cursor: pointer;
	}

	.option:hover {
		background-color: #f3faf3;
	}

	/* dimmed options can still be ticked */
	.option.dimmed {
		color: #aaa;
	}

	.option input {
		margin-top: 0.2rem;
		accent-color: #4caf50;
	}

	.clear {
		display: block;
		width: 100%;
		margin-top: 0.2rem;
		padding: 0.4rem 0.65rem;
		border: none;
		border-top: 1px solid #eee;
		background: none;
		color: #c0392b;
		font-size: 0.85rem;
		font-family: inherit;
		text-align: left;
		cursor: pointer;
	}

	.clear:hover {
		background-color: #fdf3f2;
	}
</style>
