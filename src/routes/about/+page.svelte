<!--
	About - the project description and credits.

	A styled shell only. All the wording comes from /content/about.md and
	/content/notice.md so it can be revised without touching code - see
	EDITING-THE-SITE.md. The two style blocks below are the red beta banner
	and the rule that turns a numbered list into the green step cards.
-->
<script>
	// --- Imports ---
	// The words on this page live in /content/about.md and /content/notice.md.
	import Doc from "$lib/components/common/Doc.svelte";
	import about from "$content/about.md?raw";
	import notice from "$content/notice.md?raw";
	import { usePermalink } from "$lib/utils/linkHandler.svelte.js";

	usePermalink({ run: false });
</script>

<div class="about-container">
	<div class="beta-notice">
		<Doc source={notice} />
	</div>

	<div class="about-body">
		<Doc source={about} />
	</div>
</div>

<style>
	.about-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
		line-height: 1.7;
		color: #333;
	}

	/* Beta banner */
	.beta-notice {
		background: #ffecebdf;
		border: 1px solid #fd928a;
		border-left: 4px solid #b42603e5;
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 2rem;
	}

	.beta-notice :global(strong) {
		display: block;
		color: #920e0e;
		margin-bottom: 0.25rem;
	}

	.beta-notice :global(p) {
		font-size: 0.95rem;
		color: #78350f;
	}

	.beta-notice :global(a) {
		color: #920e0e;
		text-decoration: underline;
	}

	/* Numbered lists on this page render as the green step cards. */
	.about-body :global(ol) {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		counter-reset: step;
	}

	.about-body :global(ol > li) {
		counter-increment: step;
		position: relative;
		margin-bottom: 0;
		padding: 1rem 1rem 1rem 3.75rem;
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-left: 4px solid var(--color-spartan-green);
		border-radius: 6px;
	}

	.about-body :global(ol > li::before) {
		content: counter(step);
		position: absolute;
		left: 1rem;
		top: 1.1rem;
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
	}

	/* Responsive */
	@media (max-width: 640px) {
		.about-container {
			padding: 1rem;
		}
	}
</style>
