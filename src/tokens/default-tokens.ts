/**
 * @file Bundled default design tokens.
 *
 * Values mirror the `--ak-ds-*` CSS block in
 * `packages/core/src/react/overrides/styles.css` and the
 * `TOKEN_BLOCK` in
 * `packages/core/src/react/studio/theme/iframe-theme.ts`. Lockstep
 * is enforced by the `emit-css` snapshot test (A5) — keep them in sync.
 *
 * Semantics reference primitives via the runtime ref-string convention
 * (`"<group>.<key>"`). `emit-css.ts` (A5) resolves these to
 * `var(--ak-ds-…, var(--ak-studio-…))` declarations so unthemed hosts
 * still render correctly.
 */

import type { DesignTokens } from "./types.js";

export const DEFAULT_TOKENS: DesignTokens = {
	primitives: {
		brand: {
			50: "oklch(97% 0.013 254)",
			100: "oklch(94% 0.029 254)",
			200: "oklch(88% 0.059 254)",
			300: "oklch(80% 0.099 254)",
			400: "oklch(70% 0.149 254)",
			500: "oklch(62% 0.197 254)",
			600: "oklch(54.6% 0.245 262.881)",
			700: "oklch(48% 0.218 263)",
			800: "oklch(40% 0.176 263)",
			900: "oklch(32% 0.13 263)",
		},
		neutral: {
			50: "oklch(98.5% 0 0)",
			100: "oklch(96% 0 0)",
			200: "oklch(92% 0 0)",
			300: "oklch(86% 0 0)",
			400: "oklch(70% 0 0)",
			500: "oklch(58% 0 0)",
			600: "oklch(46% 0 0)",
			700: "oklch(35% 0 0)",
			800: "oklch(22% 0 0)",
			900: "oklch(14% 0 0)",
		},
		space: {
			0: "0",
			1: "4px",
			2: "8px",
			3: "12px",
			4: "16px",
			6: "24px",
			8: "32px",
			12: "48px",
			16: "64px",
			24: "96px",
		},
		text: {
			xs: "12px",
			sm: "14px",
			base: "16px",
			lg: "18px",
			xl: "20px",
			"2xl": "24px",
			"3xl": "30px",
		},
		radius: {
			sm: "4px",
			md: "8px",
			lg: "12px",
		},
	},
	semantics: {
		bg: "neutral.50",
		surface: "neutral.100",
		fg: "neutral.900",
		fgMuted: "neutral.600",
		accent: "brand.500",
		accentFg: "neutral.50",
		border: "neutral.200",
		focusRing: "brand.500",
	},
	dark: {
		neutral: {
			50: "oklch(14% 0 0)",
			100: "oklch(22% 0 0)",
			200: "oklch(28% 0 0)",
			300: "oklch(35% 0 0)",
			400: "oklch(50% 0 0)",
			500: "oklch(60% 0 0)",
			600: "oklch(70% 0 0)",
			700: "oklch(80% 0 0)",
			800: "oklch(92% 0 0)",
			900: "oklch(98.5% 0 0)",
		},
	},
};
