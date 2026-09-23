<!--
	Root layout - the shell every page renders inside.

	Header (logo, beta tagline, Navigation), the page slot, and the footer.
	Also the only place the global color tokens are declared: --color-spartan-green
	and --color-kelly-green in :root here are what every component's styles read,
	so a palette change happens once, in this file.
-->
<script>
	// --- Imports & Props ---
	import Navigation from "$lib/components/common/Navigation.svelte";

	import { dev } from "$app/environment";
	import { injectAnalytics } from "@vercel/analytics/sveltekit";

	injectAnalytics({ mode: dev ? "development" : "production" });

	let { children } = $props();
</script>

<div class="app">
	<!-- Header -->
	<header class="app-header">
		<div class="header-content">
			<h1 class="logo"> Michigan Offset Odor Plume Model - DRAFT</h1>
			<p class="tagline">In-progress web application. Results may be inaccurate and not to be used for decision making.</p>
		</div>
		<Navigation />
	</header>

	<!-- Main Content -->
	<main class="app-main">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="app-footer">
		<p>&copy; 2026 Michigan OFFSet. All rights reserved.</p>
		<p>
			<a href="https://enviroweather.msu.edu">Enviroweather</a> | Michigan State
			University
		</p>
	</footer>
</div>

<style>
	/* Global Styles */
	:root {
		--color-spartan-green: #18453b;
		--color-kelly-green: #4caf50;
		--color-spartan-white: #ffffff;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
			Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
		background-color: #fff;
		color: var(--color-kelly-green);
	}

	:global(*) {
		box-sizing: border-box;
	}

	/* Layout */
	.app {
		display: flex;
		flex-direction: column;
	}

	/* Header */
	.app-header {
		background-color: var(--color-spartan-green);
		color: white;
		padding: 1rem 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-content {
		flex: 1;
	}

	.logo {
		margin: 0;
		font-size: 1.8rem;
		font-weight: 700;
		letter-spacing: 0.5px;
	}

	.tagline {
		margin: 0.5rem 0 0 0;
		font-size: 0.95rem;
		opacity: 0.9;
		font-weight: 300;
	}

	.app-main {
		flex: 1 auto;
	}

	/* Footer */
	.app-footer {
		background-color: var(--color-spartan-green);
		color: white;
		text-align: center;
		padding: 2rem 1rem;
		margin-top: auto;
		margin-bottom: auto;
		border-top: 1px solid #34495e;
	}

	.app-footer p {
		margin: 0.5rem 0;
		font-size: 0.9rem;
	}

	.app-footer a {
		color: #3498db;
		text-decoration: none;
		transition: color 0.3s ease;
	}

	.app-footer a:hover {
		color: #2980b9;
		text-decoration: underline;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.logo {
			font-size: 1.4rem;
		}

		.tagline {
			font-size: 0.85rem;
		}

		.app-header {
			padding: 1.5rem 1rem;
		}

		.app-main {
			padding: 1rem;
		}

		.app-footer {
			padding: 1.5rem 1rem;
		}
	}
	@media print {
		.app-header {
			display: none;
		}
		.app-footer {
			display: none;
		}
	}
</style>
