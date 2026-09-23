<!--
	NumberInput - a number field that shows thousands separators.

	Building areas run to five and six figures, where "120000" is easy to
	misread. This displays "120,000" while the field is idle and hands a plain
	number back to the caller. The separators are dropped while focused so
	typing and caret position behave normally.
-->
<script>
	let { value = $bindable(), placeholder, id, ariaLabel } = $props();

	// Thousands separators, capped at 2 decimal places.
	function formatDisplay(v) {
		return v != null
			? v.toLocaleString("en-US", { maximumFractionDigits: 2 })
			: "";
	}

	let display = $state(formatDisplay(value));
	let focused = $state(false);

	function handleInput(e) {
		const raw = e.currentTarget.value.replace(/,/g, "");
		const num = parseFloat(raw);
		value = isNaN(num) ? undefined : num;
	}

	// Show the full, unrounded value while editing so typing never re-parses
	// the rounded display and silently drops digits.
	function handleFocus() {
		focused = true;
		display = value != null ? String(value) : "";
	}

	function handleBlur() {
		focused = false;
		display = formatDisplay(value);
	}

	// Sync display from any external value change when the field is not focused.
	$effect(() => {
		if (!focused) display = formatDisplay(value);
	});
</script>

<input
	type="text"
	inputmode="numeric"
	{id}
	bind:value={display}
	oninput={handleInput}
	onfocus={handleFocus}
	onblur={handleBlur}
	{placeholder}
	aria-label={ariaLabel}
/>

<style>
	input {
		padding: 0.55rem 0.65rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		transition: all 0.3s ease;
		width: 100%;
	}

	input:hover {
		border-color: #999;
	}

	input:focus {
		outline: none;
		border-color: #4caf50;
		box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
	}
</style>
