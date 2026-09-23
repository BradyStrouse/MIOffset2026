<!--
	Navigation - the header links.

	Home, Save, Help, About. Each marks itself active by comparing the current
	pathname, so adding a route means adding a link here and nowhere else.
-->
<script>
	// --- Imports ---
	import { page } from "$app/state";
</script>

<div class="nav-content">
	<a href="/" class="nav-link" class:active={page.url.pathname === "/"}>
		Home
	</a>
	<a
		href="/save"
		class="nav-link"
		class:active={page.url.pathname === "/save"}>Save</a
	>
	<a
		href="/help"
		class="nav-link"
		class:active={page.url.pathname === "/help"}
	>
		Help
	</a>
	<a
		href="/about"
		class="nav-link"
		class:active={page.url.pathname === "/about"}
	>
		About
	</a>
</div>

<style>
	/* Nav Links */
	.nav-content {
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.nav-link {
		text-decoration: none;
		color: white;
		font-size: 0.95rem;
		font-weight: 500;
		transition: color 0.3s ease;
		padding: 0.25rem 0;
		border-bottom: 2px solid transparent;
	}

	.nav-link:hover {
		color: var(--color-kelly-green);
	}

	/* Active State */
	.nav-link.active {
		color: var(--color-kelly-green);
		border-bottom-color: var(--color-kelly-green);
	}
</style>
