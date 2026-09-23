<!--
	Doc - renders a markdown file as HTML.

	The single place markdown becomes HTML in this app. Pages import a file from
	/content with ?raw and pass the text in; this converts with marked and
	sanitizes with DOMPurify. Sanitizing is deliberate even though the content
	is repo-authored - it is the guardrail if content ever comes from elsewhere.

	The styles below are the shared house style for prose. Anything specific to
	one page (the About beta banner, the step cards) is styled from that page.
-->
<script>
	// --- Imports ---
	import { marked } from "marked";
	import DOMPurify from "isomorphic-dompurify";

	// --- Props ---
	// `source` is the text of a markdown file from /content. Pages import the
	// file with ?raw and hand it straight here.
	let { source = "" } = $props();

	const html = $derived(DOMPurify.sanitize(marked.parse(source)));
</script>

<div class="doc">
	{@html html}
</div>

<style>
	/* Content arrives through {@html}, so every rule has to be global.
	   This is the shared house style. Anything specific to one page is styled
	   from that page instead. */

	.doc :global(h1) {
		color: var(--color-spartan-green);
		font-size: 2rem;
		margin: 0 0 0.5rem 0;
	}

	/* The line directly under the title is the page's tagline. */
	.doc :global(h1 + p) {
		color: #555;
		font-size: 1.1rem;
		font-style: italic;
		margin: 0 0 2rem 0;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid var(--color-spartan-green);
	}

	.doc :global(h2) {
		color: var(--color-spartan-green);
		font-size: 1.4rem;
		margin: 2.5rem 0 1rem 0;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid #e9ecef;
	}

	.doc :global(h3) {
		color: var(--color-spartan-green);
		font-size: 1.1rem;
		margin: 1.75rem 0 0.5rem 0;
	}

	.doc :global(p) {
		margin: 0 0 1rem 0;
	}

	.doc :global(p:last-child) {
		margin-bottom: 0;
	}

	.doc :global(a) {
		color: var(--color-kelly-green);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.doc :global(a:hover) {
		color: var(--color-spartan-green);
		text-decoration: underline;
	}

	.doc :global(ul),
	.doc :global(ol) {
		margin: 0 0 1rem 0;
		padding-left: 1.5rem;
	}

	.doc :global(li) {
		margin-bottom: 0.4rem;
	}

	.doc :global(strong) {
		color: var(--color-spartan-green);
	}

	.doc :global(blockquote) {
		margin: 0 0 1rem 0;
		padding: 0.75rem 1rem;
		background: #f8f9fa;
		border-left: 4px solid var(--color-spartan-green);
		border-radius: 0 6px 6px 0;
		color: #555;
	}

	.doc :global(blockquote p:last-child) {
		margin-bottom: 0;
	}

	.doc :global(code) {
		background: #f1f3f5;
		border: 1px solid #e9ecef;
		border-radius: 3px;
		padding: 0.1em 0.35em;
		font-size: 0.9em;
	}

	.doc :global(img) {
		max-width: 100%;
		height: auto;
		border: 1px solid #e9ecef;
		border-radius: 6px;
	}

	.doc :global(hr) {
		border: none;
		border-top: 1px solid #e9ecef;
		margin: 2rem 0;
	}

	.doc :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 0 0 1rem 0;
		font-size: 0.95rem;
	}

	.doc :global(th) {
		text-align: left;
		border-bottom: 2px solid var(--color-spartan-green);
		padding: 0.5rem 0.75rem 0.5rem 0;
	}

	.doc :global(td) {
		border-bottom: 1px solid #e9ecef;
		padding: 0.5rem 0.75rem 0.5rem 0;
		vertical-align: top;
	}
</style>
