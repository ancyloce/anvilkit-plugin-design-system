/**
 * @file Design token tree types.
 *
 * Two-tier model (PRD 0005 §5.2, generalising PRD 0004 §7):
 *
 *   - **Primitives** carry raw brand + neutral palettes and the
 *     spacing/typography/radius scales. They flip between light and
 *     dark themes.
 *   - **Semantics** map roles (background, surface, foreground, accent,
 *     border, focus-ring) to primitive references. They are
 *     theme-stable so stored token refs (`"color.brand.500"`) survive
 *     a `.dark` toggle without being rewritten.
 *
 * Stored values are CSS strings — the runtime resolves them to
 * `--ak-ds-*` references at emit time (`emit-css.ts`, A5).
 */

export interface ColorRamp {
	readonly 50: string;
	readonly 100: string;
	readonly 200: string;
	readonly 300: string;
	readonly 400: string;
	readonly 500: string;
	readonly 600: string;
	readonly 700: string;
	readonly 800: string;
	readonly 900: string;
}

export interface SpacingScale {
	readonly 0: string;
	readonly 1: string;
	readonly 2: string;
	readonly 3: string;
	readonly 4: string;
	readonly 6: string;
	readonly 8: string;
	readonly 12: string;
	readonly 16: string;
	readonly 24: string;
}

export interface TypographyScale {
	readonly xs: string;
	readonly sm: string;
	readonly base: string;
	readonly lg: string;
	readonly xl: string;
	readonly "2xl": string;
	readonly "3xl": string;
}

export interface RadiusScale {
	readonly sm: string;
	readonly md: string;
	readonly lg: string;
}

export interface PrimitiveTokens {
	readonly brand: ColorRamp;
	readonly neutral: ColorRamp;
	readonly space: SpacingScale;
	readonly text: TypographyScale;
	readonly radius: RadiusScale;
}

export interface SemanticTokens {
	readonly bg: string;
	readonly surface: string;
	readonly fg: string;
	readonly fgMuted: string;
	readonly accent: string;
	readonly accentFg: string;
	readonly border: string;
	readonly focusRing: string;
}

/**
 * Dark-mode primitive overrides. v1 only inverts the neutral ramp —
 * brand stays the same across themes (brand color is brand color) and
 * spacing / type / radius are intrinsically theme-independent.
 *
 * Semantics resolve through primitives, so an unset semantic block in
 * dark mode is intentional: roles re-bind automatically when neutrals
 * flip, keeping stored token refs theme-stable (PRD 0005 §5.2).
 */
export interface DarkPrimitiveOverrides {
	readonly neutral: ColorRamp;
}

export interface DesignTokens {
	readonly primitives: PrimitiveTokens;
	readonly semantics: SemanticTokens;
	readonly dark: DarkPrimitiveOverrides;
}

/**
 * Deep-partial mirror of {@link DesignTokens} for host overrides.
 * Hosts may patch any subset of the bundled defaults — `mergeTokens`
 * deep-merges and preserves structural sharing for untouched subtrees.
 */
export type PartialDesignTokens = {
	readonly primitives?: {
		readonly [P in keyof PrimitiveTokens]?: Partial<PrimitiveTokens[P]>;
	};
	readonly semantics?: Partial<SemanticTokens>;
	readonly dark?: {
		readonly [P in keyof DarkPrimitiveOverrides]?: Partial<
			DarkPrimitiveOverrides[P]
		>;
	};
};
