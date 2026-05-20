/**
 * @file Deep-merge bundled defaults with host-supplied overrides.
 *
 * Preserves structural sharing for untouched subtrees so equality
 * checks against {@link DEFAULT_TOKENS} stay cheap. Overrides are
 * applied per-group (`primitives.brand`, `semantics`, …) and per-key
 * (`brand.500`, `space.4`, …). Unset keys fall back to the default.
 */

import type {
	ColorRamp,
	DarkPrimitiveOverrides,
	DesignTokens,
	PartialDesignTokens,
	PrimitiveTokens,
	RadiusScale,
	SemanticTokens,
	SpacingScale,
	TypographyScale,
} from "./types.js";

function mergeShape<T>(defaults: T, overrides: Partial<T> | undefined): T {
	if (overrides === undefined) return defaults;
	const keys = Object.keys(defaults as object) as Array<keyof T>;
	const next: Record<string, unknown> = {};
	let anyOverride = false;
	for (const key of keys) {
		const incoming = overrides[key];
		if (incoming !== undefined && incoming !== defaults[key]) {
			next[key as string] = incoming;
			anyOverride = true;
		} else {
			next[key as string] = defaults[key];
		}
	}
	return anyOverride ? (next as T) : defaults;
}

function mergePrimitives(
	defaults: PrimitiveTokens,
	overrides: PartialDesignTokens["primitives"],
): PrimitiveTokens {
	if (overrides === undefined) return defaults;
	const brand = mergeShape<ColorRamp>(defaults.brand, overrides.brand);
	const neutral = mergeShape<ColorRamp>(defaults.neutral, overrides.neutral);
	const space = mergeShape<SpacingScale>(defaults.space, overrides.space);
	const text = mergeShape<TypographyScale>(defaults.text, overrides.text);
	const radius = mergeShape<RadiusScale>(defaults.radius, overrides.radius);
	if (
		brand === defaults.brand &&
		neutral === defaults.neutral &&
		space === defaults.space &&
		text === defaults.text &&
		radius === defaults.radius
	) {
		return defaults;
	}
	return { brand, neutral, space, text, radius };
}

function mergeSemantics(
	defaults: SemanticTokens,
	overrides: PartialDesignTokens["semantics"],
): SemanticTokens {
	return mergeShape<SemanticTokens>(defaults, overrides);
}

function mergeDark(
	defaults: DarkPrimitiveOverrides,
	overrides: PartialDesignTokens["dark"],
): DarkPrimitiveOverrides {
	if (overrides === undefined) return defaults;
	const neutral = mergeShape<ColorRamp>(defaults.neutral, overrides.neutral);
	return neutral === defaults.neutral ? defaults : { neutral };
}

export function mergeTokens(
	defaults: DesignTokens,
	overrides?: PartialDesignTokens,
): DesignTokens {
	if (overrides === undefined) return defaults;
	const primitives = mergePrimitives(defaults.primitives, overrides.primitives);
	const semantics = mergeSemantics(defaults.semantics, overrides.semantics);
	const dark = mergeDark(defaults.dark, overrides.dark);
	if (
		primitives === defaults.primitives &&
		semantics === defaults.semantics &&
		dark === defaults.dark
	) {
		return defaults;
	}
	return { primitives, semantics, dark };
}
