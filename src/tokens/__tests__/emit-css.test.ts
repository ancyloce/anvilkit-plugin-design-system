import { describe, expect, it } from "vitest";

import { DEFAULT_TOKENS } from "../default-tokens.js";
import { emitTokensCss } from "../emit-css.js";
import { mergeTokens } from "../merge-tokens.js";

describe("emitTokensCss", () => {
	it("emits a stable snapshot for DEFAULT_TOKENS", () => {
		expect(emitTokensCss(DEFAULT_TOKENS)).toMatchInlineSnapshot(`
			":root {
				--ak-ds-brand-50: oklch(97% 0.013 254);
				--ak-ds-brand-100: oklch(94% 0.029 254);
				--ak-ds-brand-200: oklch(88% 0.059 254);
				--ak-ds-brand-300: oklch(80% 0.099 254);
				--ak-ds-brand-400: oklch(70% 0.149 254);
				--ak-ds-brand-500: oklch(62% 0.197 254);
				--ak-ds-brand-600: oklch(54.6% 0.245 262.881);
				--ak-ds-brand-700: oklch(48% 0.218 263);
				--ak-ds-brand-800: oklch(40% 0.176 263);
				--ak-ds-brand-900: oklch(32% 0.13 263);
				--ak-ds-neutral-50: oklch(98.5% 0 0);
				--ak-ds-neutral-100: oklch(96% 0 0);
				--ak-ds-neutral-200: oklch(92% 0 0);
				--ak-ds-neutral-300: oklch(86% 0 0);
				--ak-ds-neutral-400: oklch(70% 0 0);
				--ak-ds-neutral-500: oklch(58% 0 0);
				--ak-ds-neutral-600: oklch(46% 0 0);
				--ak-ds-neutral-700: oklch(35% 0 0);
				--ak-ds-neutral-800: oklch(22% 0 0);
				--ak-ds-neutral-900: oklch(14% 0 0);
				--ak-ds-space-0: 0;
				--ak-ds-space-1: 4px;
				--ak-ds-space-2: 8px;
				--ak-ds-space-3: 12px;
				--ak-ds-space-4: 16px;
				--ak-ds-space-6: 24px;
				--ak-ds-space-8: 32px;
				--ak-ds-space-12: 48px;
				--ak-ds-space-16: 64px;
				--ak-ds-space-24: 96px;
				--ak-ds-text-xs: 12px;
				--ak-ds-text-sm: 14px;
				--ak-ds-text-base: 16px;
				--ak-ds-text-lg: 18px;
				--ak-ds-text-xl: 20px;
				--ak-ds-text-2xl: 24px;
				--ak-ds-text-3xl: 30px;
				--ak-ds-radius-sm: 4px;
				--ak-ds-radius-md: 8px;
				--ak-ds-radius-lg: 12px;
				--ak-ds-bg: var(--ak-ds-neutral-50, var(--ak-studio-bg));
				--ak-ds-surface: var(--ak-ds-neutral-100, var(--ak-studio-panel));
				--ak-ds-fg: var(--ak-ds-neutral-900, var(--ak-studio-fg));
				--ak-ds-fg-muted: var(--ak-ds-neutral-600, var(--ak-studio-muted-fg));
				--ak-ds-accent: var(--ak-ds-brand-500, var(--ak-studio-accent));
				--ak-ds-accent-fg: var(--ak-ds-neutral-50, var(--ak-studio-accent-fg));
				--ak-ds-border: var(--ak-ds-neutral-200, var(--ak-studio-border));
				--ak-ds-focus-ring: var(--ak-ds-brand-500, var(--ak-studio-ring));
			}

			.dark {
				--ak-ds-neutral-50: oklch(14% 0 0);
				--ak-ds-neutral-100: oklch(22% 0 0);
				--ak-ds-neutral-200: oklch(28% 0 0);
				--ak-ds-neutral-300: oklch(35% 0 0);
				--ak-ds-neutral-400: oklch(50% 0 0);
				--ak-ds-neutral-500: oklch(60% 0 0);
				--ak-ds-neutral-600: oklch(70% 0 0);
				--ak-ds-neutral-700: oklch(80% 0 0);
				--ak-ds-neutral-800: oklch(92% 0 0);
				--ak-ds-neutral-900: oklch(98.5% 0 0);
			}
			"
		`);
	});

	it("declares every Tier-2 semantic with a --ak-studio-* fallback", () => {
		const css = emitTokensCss(DEFAULT_TOKENS);
		const semantics = [
			"--ak-ds-bg",
			"--ak-ds-surface",
			"--ak-ds-fg",
			"--ak-ds-fg-muted",
			"--ak-ds-accent",
			"--ak-ds-accent-fg",
			"--ak-ds-border",
			"--ak-ds-focus-ring",
		];
		for (const semantic of semantics) {
			const pattern = new RegExp(
				`${semantic.replace(/-/g, "\\-")}: var\\([^)]*?--ak-studio-`,
			);
			expect(css).toMatch(pattern);
		}
	});

	it("dark block contains only neutral primitives — no brand, no semantics", () => {
		const css = emitTokensCss(DEFAULT_TOKENS);
		const darkBlockStart = css.indexOf(".dark {");
		expect(darkBlockStart).toBeGreaterThan(-1);
		const darkBlock = css.slice(darkBlockStart);

		expect(darkBlock).toContain("--ak-ds-neutral-50:");
		expect(darkBlock).toContain("--ak-ds-neutral-900:");
		expect(darkBlock).not.toContain("--ak-ds-brand-");
		expect(darkBlock).not.toContain("--ak-ds-bg:");
		expect(darkBlock).not.toContain("--ak-ds-accent:");
	});

	it("respects custom selectors", () => {
		const css = emitTokensCss(DEFAULT_TOKENS, {
			selector: "[data-ak-ds-root]",
			darkSelector: "[data-theme='dark']",
		});
		expect(css).toContain("[data-ak-ds-root] {");
		expect(css).toContain("[data-theme='dark'] {");
		expect(css).not.toContain(":root {");
	});

	it("emits a literal CSS value when a semantic ref is not a primitive ref", () => {
		const tokens = mergeTokens(DEFAULT_TOKENS, {
			semantics: { accent: "#ff0066" },
		});
		const css = emitTokensCss(tokens);
		expect(css).toContain("--ak-ds-accent: #ff0066;");
	});
});
