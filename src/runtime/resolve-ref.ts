/**
 * @file Pure ref-string → token resolution.
 *
 * Field values, panel rows, and the off-token walker all consume the
 * same resolver so user-facing ref strings round-trip identically
 * through every surface. The resolver is React-free; the React context
 * (`token-context.tsx`) supplies the {@link DesignTokens} tree.
 *
 * Ref grammar (PRD 0005 §1.4, §5.2):
 *
 *   - `color.<ramp>.<step>`  → primitive color (`tokens.primitives[ramp][step]`)
 *   - `semantic.<role>`      → semantic role (`tokens.semantics[role]`),
 *                              which is itself a `<ramp>.<step>` ref
 *                              the resolver dereferences to a CSS value.
 *   - `space.<key>`          → spacing primitive
 *   - `text.<key>`           → typography primitive
 *   - `radius.<key>`         → radius primitive
 *
 * The returned `cssVar` is always the `var(--ak-ds-…)` reference the
 * field renderer plugs into inline `style` (so theme switches and host
 * overrides flow through CSS, not JS state). `value` is the raw value
 * the token resolves to at the time of the call — useful for previews,
 * contrast math, and off-token comparisons.
 */

import {
	radiusVar,
	rampVar,
	SEMANTIC_VAR,
	spaceVar,
	textVar,
} from "../tokens/css-vars.js";
import type {
	ColorRamp,
	DesignTokens,
	RadiusScale,
	SpacingScale,
	TypographyScale,
} from "../tokens/types.js";

export type TokenRefKind =
	| "color"
	| "semantic"
	| "space"
	| "text"
	| "radius"
	| "unknown";

export interface ResolvedTokenRef {
	/** Original ref string the caller passed in. */
	readonly ref: string;
	/** Category the ref resolved against. `"unknown"` for malformed or off-tree refs. */
	readonly kind: TokenRefKind;
	/**
	 * CSS `var(--ak-ds-…)` reference for this token. Undefined when
	 * `kind === "unknown"`.
	 */
	readonly cssVar?: string;
	/**
	 * Resolved raw value at call time (e.g. `"oklch(62% 0.197 254)"`,
	 * `"16px"`). Undefined when `kind === "unknown"`. For semantics,
	 * this is the primitive ramp value the role currently points at.
	 */
	readonly value?: string;
}

const RAMP_STEP_KEYS: ReadonlySet<string> = new Set([
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
]);

const SPACE_KEY_SET: ReadonlySet<string> = new Set([
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
]);

const TEXT_KEY_SET: ReadonlySet<string> = new Set([
	"xs",
	"sm",
	"base",
	"lg",
	"xl",
	"2xl",
	"3xl",
]);

const RADIUS_KEY_SET: ReadonlySet<string> = new Set(["sm", "md", "lg"]);

function unknown(ref: string): ResolvedTokenRef {
	return { ref, kind: "unknown" };
}

function resolveColor(
	ref: string,
	parts: readonly string[],
	tokens: DesignTokens,
): ResolvedTokenRef {
	// "color.<ramp>.<step>" — parts is ["color", ramp, step]
	if (parts.length !== 3) return unknown(ref);
	const ramp = parts[1];
	const step = parts[2];
	if (ramp === undefined || step === undefined) return unknown(ref);
	if (ramp !== "brand" && ramp !== "neutral") return unknown(ref);
	if (!RAMP_STEP_KEYS.has(step)) return unknown(ref);
	const rampObj = tokens.primitives[ramp] as ColorRamp;
	const value = rampObj[Number(step) as keyof ColorRamp];
	return {
		ref,
		kind: "color",
		cssVar: `var(${rampVar(ramp, step)})`,
		value,
	};
}

function resolveSemantic(
	ref: string,
	parts: readonly string[],
	tokens: DesignTokens,
): ResolvedTokenRef {
	// "semantic.<role>" — parts is ["semantic", role]
	if (parts.length !== 2) return unknown(ref);
	const role = parts[1] as keyof DesignTokens["semantics"];
	if (!(role in SEMANTIC_VAR)) return unknown(ref);
	const primitiveRef = tokens.semantics[role];
	// Semantics store an internal `<ramp>.<step>` ref or a raw CSS value.
	const [group, step] = primitiveRef.split(".");
	let value: string | undefined;
	if (
		(group === "brand" || group === "neutral") &&
		step !== undefined &&
		RAMP_STEP_KEYS.has(step)
	) {
		const rampObj = tokens.primitives[group] as ColorRamp;
		value = rampObj[Number(step) as keyof ColorRamp];
	} else {
		value = primitiveRef;
	}
	return {
		ref,
		kind: "semantic",
		cssVar: `var(${SEMANTIC_VAR[role]})`,
		value,
	};
}

function resolveSpace(
	ref: string,
	parts: readonly string[],
	tokens: DesignTokens,
): ResolvedTokenRef {
	if (parts.length !== 2) return unknown(ref);
	const key = parts[1];
	if (key === undefined || !SPACE_KEY_SET.has(key)) return unknown(ref);
	const value = tokens.primitives.space[Number(key) as keyof SpacingScale];
	return {
		ref,
		kind: "space",
		cssVar: `var(${spaceVar(key)})`,
		value,
	};
}

function resolveText(
	ref: string,
	parts: readonly string[],
	tokens: DesignTokens,
): ResolvedTokenRef {
	if (parts.length !== 2) return unknown(ref);
	const key = parts[1];
	if (key === undefined || !TEXT_KEY_SET.has(key)) return unknown(ref);
	const value = tokens.primitives.text[key as keyof TypographyScale];
	return {
		ref,
		kind: "text",
		cssVar: `var(${textVar(key)})`,
		value,
	};
}

function resolveRadius(
	ref: string,
	parts: readonly string[],
	tokens: DesignTokens,
): ResolvedTokenRef {
	if (parts.length !== 2) return unknown(ref);
	const key = parts[1];
	if (key === undefined || !RADIUS_KEY_SET.has(key)) return unknown(ref);
	const value = tokens.primitives.radius[key as keyof RadiusScale];
	return {
		ref,
		kind: "radius",
		cssVar: `var(${radiusVar(key)})`,
		value,
	};
}

/**
 * Resolve a user-facing token ref against the live token tree.
 *
 * Returns `{ kind: "unknown" }` for any malformed or off-tree ref so
 * the off-token walker can flag it without throwing.
 */
export function resolveTokenRef(
	ref: string,
	tokens: DesignTokens,
): ResolvedTokenRef {
	if (typeof ref !== "string" || ref.length === 0) return unknown(ref);
	const parts = ref.split(".");
	const category = parts[0];
	switch (category) {
		case "color":
			return resolveColor(ref, parts, tokens);
		case "semantic":
			return resolveSemantic(ref, parts, tokens);
		case "space":
			return resolveSpace(ref, parts, tokens);
		case "text":
			return resolveText(ref, parts, tokens);
		case "radius":
			return resolveRadius(ref, parts, tokens);
		default:
			return unknown(ref);
	}
}

/**
 * List every legal ref string for a given token tree. Used by the
 * panel + the field dropdowns to populate options without each surface
 * inventing its own enumeration.
 */
export function listTokenRefs(
	tokens: DesignTokens,
): ReadonlyArray<ResolvedTokenRef> {
	const refs: ResolvedTokenRef[] = [];
	for (const ramp of ["brand", "neutral"] as const) {
		for (const step of RAMP_STEP_KEYS) {
			refs.push(resolveTokenRef(`color.${ramp}.${step}`, tokens));
		}
	}
	for (const role of Object.keys(SEMANTIC_VAR)) {
		refs.push(resolveTokenRef(`semantic.${role}`, tokens));
	}
	for (const key of SPACE_KEY_SET) {
		refs.push(resolveTokenRef(`space.${key}`, tokens));
	}
	for (const key of TEXT_KEY_SET) {
		refs.push(resolveTokenRef(`text.${key}`, tokens));
	}
	for (const key of RADIUS_KEY_SET) {
		refs.push(resolveTokenRef(`radius.${key}`, tokens));
	}
	return refs;
}
