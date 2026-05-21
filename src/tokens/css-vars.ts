/**
 * @file CSS variable naming map for design tokens.
 *
 * Single source of truth for the `--ak-ds-*` variable names emitted into
 * the host doc + iframe by `emit-css.ts` and resolved at runtime by
 * `runtime/resolve-ref.ts`. Centralising the names here means the
 * emitter and the resolver cannot drift; the emit-css snapshot test
 * guards the byte-equality of the emitted block against the core
 * `styles.css` / `iframe-theme.ts` lockstep.
 */

import type {
	ColorRamp,
	DesignTokens,
	RadiusScale,
	SpacingScale,
	TypographyScale,
} from "./types.js";

export const RAMP_KEYS = [
	"50",
	"100",
	"200",
	"300",
	"400",
	"500",
	"600",
	"700",
	"800",
	"900",
] as const satisfies ReadonlyArray<`${keyof ColorRamp}`>;

export const SPACE_KEYS = [
	"0",
	"1",
	"2",
	"3",
	"4",
	"6",
	"8",
	"12",
	"16",
	"24",
] as const satisfies ReadonlyArray<`${keyof SpacingScale}`>;

export const TEXT_KEYS = [
	"xs",
	"sm",
	"base",
	"lg",
	"xl",
	"2xl",
	"3xl",
] as const satisfies ReadonlyArray<keyof TypographyScale>;

export const RADIUS_KEYS = ["sm", "md", "lg"] as const satisfies ReadonlyArray<
	keyof RadiusScale
>;

export const SEMANTIC_VAR: Record<keyof DesignTokens["semantics"], string> = {
	bg: "--ak-ds-bg",
	surface: "--ak-ds-surface",
	fg: "--ak-ds-fg",
	fgMuted: "--ak-ds-fg-muted",
	accent: "--ak-ds-accent",
	accentFg: "--ak-ds-accent-fg",
	border: "--ak-ds-border",
	focusRing: "--ak-ds-focus-ring",
};

export const STUDIO_FALLBACK: Record<keyof DesignTokens["semantics"], string> =
	{
		bg: "--ak-studio-bg",
		surface: "--ak-studio-panel",
		fg: "--ak-studio-fg",
		fgMuted: "--ak-studio-muted-fg",
		accent: "--ak-studio-accent",
		accentFg: "--ak-studio-accent-fg",
		border: "--ak-studio-border",
		focusRing: "--ak-studio-ring",
	};

export function rampVar(group: "brand" | "neutral", key: string): string {
	return `--ak-ds-${group}-${key}`;
}

export function spaceVar(key: string): string {
	return `--ak-ds-space-${key}`;
}

export function textVar(key: string): string {
	return `--ak-ds-text-${key}`;
}

export function radiusVar(key: string): string {
	return `--ak-ds-radius-${key}`;
}
