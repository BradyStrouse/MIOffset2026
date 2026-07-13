<script>
	let { form } = $props();
</script>

<div class="gate-wrapper">
	<div class="gate-card">
		<div class="gate-header">
			<h1>Michigan OFFSet</h1>
			<p class="subtitle">Odor Footprint & Field Emissions Tracker</p>
		</div>

		<div class="gate-body">
			<p class="notice">
				This application is under active development and is restricted to authorized viewers
			</p>

			<form method="POST">
				<label for="passphrase">Access Passphrase</label>
				<input
					id="passphrase"
					name="passphrase"
					type="password"
					placeholder="Enter passphrase"
					autocomplete="off"
				/>

				{#if form?.incorrect}
					<p class="error">Incorrect passphrase. Please try again</p>
				{/if}

				<button type="submit">Enter</button>
			</form>
		</div>

		<div class="gate-footer">
			<p>
				<a href="https://legacy.enviroweather.msu.edu/legacy/mioffset/">Legacy Version</a>
				- Michigan State University Extension
			</p>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			'Helvetica Neue', sans-serif;
		background-color: #f4f6f4;
	}

	.gate-wrapper {
		min-height: 80vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f4f6f4;
		padding: 1rem;
	}

	.gate-card {
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 420px;
		overflow: hidden;
	}

	.gate-header {
		background-color: #18453b;
		color: #fff;
		padding: 2rem;
		text-align: center;
	}

	.gate-header h1 {
		margin: 0;
		font-size: 1.8rem;
		font-weight: 700;
	}

	.subtitle {
		margin: 0.5rem 0 0;
		font-size: 0.9rem;
		opacity: 0.85;
		font-weight: 300;
	}

	.gate-body {
		padding: 2rem;
	}

	.notice {
		font-size: 0.9rem;
		color: #555;
		margin: 0 0 1.5rem;
		line-height: 1.5;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-size: 0.85rem;
		font-weight: 600;
		color: #333;
	}

	input {
		padding: 0.6rem 0.8rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
		width: 100%;
	}

	input:focus {
		outline: none;
		border-color: #18453b;
		box-shadow: 0 0 0 2px rgba(24, 69, 59, 0.2);
	}

	.error {
		font-size: 0.85rem;
		color: #c0392b;
		margin: 0;
	}

	button {
		margin-top: 0.5rem;
		padding: 0.7rem;
		background-color: #18453b;
		color: #fff;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	button:hover {
		background-color: #1f5c4d;
	}

	.gate-footer {
		background-color: #f4f6f4;
		text-align: center;
		padding: 1rem;
		border-top: 1px solid #e0e0e0;
	}

	.gate-footer p {
		margin: 0;
		font-size: 0.8rem;
		color: #777;
	}

	.gate-footer a {
		color: #18453b;
		text-decoration: none;
	}

	.gate-footer a:hover {
		text-decoration: underline;
	}
</style>
