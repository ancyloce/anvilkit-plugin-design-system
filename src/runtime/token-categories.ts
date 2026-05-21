/**
 * @file Token-reference category prefixes.
 *
 * User-facing field values store the ref string with an explicit
 * category prefix so a single string is self-describing across all
 * field types (PRD 0005 §1.4, §5.2). The category determines which
 * subtree of {@link DesignTokens} a ref resolves against and which
 * CSS variable namespace it maps to.
 *
 *   - `color.<ramp>.<step>` — `color.brand.500`, `color.neutral.300`
 *   - `semantic.<role>`     — `semantic.bg`, `semantic.accent`
 *   - `space.<key>`         — `space.4`
 *   - `text.<key>`          — `text.lg`
 *   - `radius.<key>`        — `radius.md`
 *
 * Field factories filter their dropdown to a single category; the
 * off-token walker uses these prefixes to bucket warnings.
 */

export type TokenCategory = "color" | "semantic" | "space" | "text" | "radius";

export const TOKEN_CATEGORIES = [
	"color",
	"semantic",
	"space",
	"text",
	"radius",
] as const satisfies ReadonlyArray<TokenCategory>;

export const COLOR_CATEGORIES: ReadonlyArray<TokenCategory> = [
	"color",
	"semantic",
];

export const SPACING_CATEGORIES: ReadonlyArray<TokenCategory> = ["space"];

export const TYPOGRAPHY_CATEGORIES: ReadonlyArray<TokenCategory> = ["text"];
