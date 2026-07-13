<script>
	import { usePermalink } from "$lib/utils/linkHandler.svelte.js";

	usePermalink({ run: false });
</script>

<!-- Intro & Description -->
<div class="about-container">
	<div class="hero">
		<h1>Michigan OFFSet 2026</h1>
		<p class="subtitle">
			A tool for evaluating odor setback distance to minimize odor nuisance complaints.
		</p>
	</div>

	<section class="section">
		<p>
			Developed in cooperation with and sponsored by
			<a href="https://www.canr.msu.edu/maaa/">
				Michigan Alliance for Animal Agriculture (M-AAA)</a
			>
			and
			<a href="http://www.michigan.gov/mdard/">
				Michigan Department of Agriculture and Rural Development (MDARD)</a
			>.
		</p>

		<p>
			MI OFFSET is a planning tool for assessing potential odor impacts from livestock facilities.
			Output from this tool, called an odor footprint, is a radial plot which represents
			approximate distances that one must be away from the odor source to detect a noticeable or
			stronger odor up to 1.5%, 3% and 5% of the time for each of the 16 compass directions. MI
			OFFSET 2026 is a revised version of MI OFFSET 2018 that improves its ability to minimize odor
			nuisance risk when siting new or expanding livestock operations.
			<a class="pdf" href="MIOFFSET2018_technicaldocument.pdf"
				>Technical details of the model are available in PDF format</a
			>. MI OFFSET 2018 has been implemented in the
			<a href="https://www.michigan.gov/mdard/0,4610,7-125-1599_1605---,00.html"
				>Site Selection Generally Accepted Agricultural and Management Practices (GAAMPs)
				document.</a
			>
		</p>

		<p>
			MI OFFSET has been approved by MDARD for use in Michigan. Users interested in siting guidance
			for farms outside of Michigan should refer to the regulations and/or guidelines in place in
			those states or provinces. By using this product, you agree to the
			<a href="viewMioffsetTerms.php">Terms of Use</a>.
		</p>

		<p>
			You will receive odor footprint plots and a table of setback distances, and have an
			opportunity to download the odor footprint on the map as a pdf along with the full
			setback distance table
		</p>
	</section>

	<!-- Usage Steps -->
	<section class="section">
		<h2>How to Use This Tool</h2>
		<ol class="steps">
			<li class="step">
				<span class="step-number">1</span>
				<div class="step-content">
					<strong>Enter your location</strong>
					<p>Search for your farm or facility location on the map. Click the map to place the marker on the odor source</p>
				</div>
			</li>
			<li class="step">
				<span class="step-number">2</span>
				<div class="step-content">
					<strong>Enter animal and waste storage details</strong>
					<p>Provide information about animal units and waste storage at your facility.</p>
				</div>
			</li>
			<li class="step">
				<span class="step-number">3</span>
				<div class="step-content">
					<strong>View and download results</strong>
					<p>Review your odor footprint and download it as a pdf or print it physically</p>
				</div>
			</li>
		</ol>
	</section>
</div>

<style>
	.about-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
		line-height: 1.7;
		color: #333;
	}

	/* Hero */
	.hero {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid var(--color-spartan-green);
	}

	h1 {
		color: var(--color-spartan-green);
		font-size: 2rem;
		margin: 0 0 0.5rem 0;
	}

	.subtitle {
		color: #555;
		font-size: 1.1rem;
		margin: 0;
		font-style: italic;
	}

	/* Sections */
	.section {
		margin-bottom: 2rem;
	}

	h2 {
		color: var(--color-spartan-green);
		font-size: 1.25rem;
		margin: 0 0 1rem 0;
	}

	p {
		margin: 0 0 1rem 0;
	}

	/* Links */
	a {
		color: var(--color-kelly-green);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	a:hover {
		color: var(--color-spartan-green);
		text-decoration: underline;
	}

	/* Steps */
	.steps {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.step {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-left: 4px solid var(--color-spartan-green);
		border-radius: 6px;
		padding: 1rem;
	}

	.step-number {
		background: var(--color-spartan-green);
		color: white;
		font-weight: 700;
		font-size: 0.9rem;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	.step-content strong {
		display: block;
		color: var(--color-spartan-green);
		font-size: 1rem;
		margin-bottom: 0.25rem;
	}

	.step-content p {
		margin: 0;
		font-size: 0.9rem;
		color: #555;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.about-container {
			padding: 1rem;
		}

		h1 {
			font-size: 1.5rem;
		}
	}
</style>
