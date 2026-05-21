/**
 * @file Emit a `:root` + `.dark` CSS variable block from a resolved
 * {@link DesignTokens} tree.
 *
 * Used by `@anvilkit/core`'s host CSS pipeline + `iframe-theme.ts`
 * injection so canvas content resolves identical tokens to chrome.
 * Output for `DEFAULT_TOKENS` matches the static `--ak-ds-*` block in
 * `packages/core/src/react/overrides/styles.css` and the
 * `TOKEN_BLOCK` in
 * `packages/core/src/react/studio/theme/iframe-theme.ts`; the snapshot
 * test guards the byte-equality lockstep.
 *
 * Two-tier resolution model (PRD 0005 §5.2):
 *
 *   - Tier-1 primitives become `--ak-ds-<group>-<key>: <value>`
 *   - Tier-2 semantics dereference primitive refs and emit
 *     `--ak-ds-<role>: var(--ak-ds-<group>-<key>, var(--ak-studio-<fallback>))`
 *     so a host that omits the plugin still renders correctly.
 *
 * Dark mode flips Tier-1 neutrals only; semantics + stored token refs
 * stay theme-stable.
 */

import {
	RADIUS_KEYS,
	RAMP_KEYS,
	radiusVar,
	rampVar,
	SEMANTIC_VAR,
	SPACE_KEYS,
	STUDIO_FALLBACK,
	spaceVar,
	TEXT_KEYS,
	textVar,
} from "./css-vars.js";
import type {
	ColorRamp,
	DesignTokens,
	RadiusScale,
	SpacingScale,
	TypographyScale,
} from "./types.js";

export interface EmitTokensCssOptions {
	/** Selector that hosts the primitives + semantics. Defaults to `:root`. */
	readonly selector?: string;
	/** Selector that hosts the dark-mode primitive overrides. Defaults to `.dark`. */
	readonly darkSelector?: string;
	/** Indent prefix per declaration (default `"\t"`). */
	readonly indent?: string;
}

function emitRamp(
	ramp: ColorRamp,
	group: "brand" | "neutral",
	indent: string,
): string[] {
	return RAMP_KEYS.map(
		(key) =>
			`${indent}${rampVar(group, key)}: ${ramp[Number(key) as keyof ColorRamp]};`,
	);
}

function emitSpaces(scale: SpacingScale, indent: string): string[] {
	return SPACE_KEYS.map(
		(key) =>
			`${indent}${spaceVar(key)}: ${scale[Number(key) as keyof SpacingScale]};`,
	);
}

function emitText(scale: TypographyScale, indent: string): string[] {
	return TEXT_KEYS.map((key) => `${indent}${textVar(key)}: ${scale[key]};`);
}

function emitRadius(scale: RadiusScale, indent: string): string[] {
	return RADIUS_KEYS.map((key) => `${indent}${radiusVar(key)}: ${scale[key]};`);
}

function resolveSemanticRef(ref: string): string | undefined {
	// Refs follow `"<group>.<key>"` — e.g. `"brand.500"`, `"neutral.50"`.
	const [group, key] = ref.split(".");
	if (group === undefined || key === undefined) return undefined;
	if (group === "brand" || group === "neutral") {
		return rampVar(group, key);
	}
	return undefined;
}

function emitSemantic(
	role: keyof DesignTokens["semantics"],
	ref: string,
	indent: string,
): string {
	const primitive = resolveSemanticRef(ref);
	const fallback = STUDIO_FALLBACK[role];
	if (primitive === undefined) {
		// Direct CSS value — wrap it in the studio fallback.
		return `${indent}${SEMANTIC_VAR[role]}: ${ref};`;
	}
	return `${indent}${SEMANTIC_VAR[role]}: var(${primitive}, var(${fallback}));`;
}

export function emitTokensCss(
	tokens: DesignTokens,
	options: EmitTokensCssOptions = {},
): string {
	const selector = options.selector ?? ":root";
	const darkSelector = options.darkSelector ?? ".dark";
	const indent = options.indent ?? "\t";

	const primitiveLines = [
		...emitRamp(tokens.primitives.brand, "brand", indent),
		...emitRamp(tokens.primitives.neutral, "neutral", indent),
		...emitSpaces(tokens.primitives.space, indent),
		...emitText(tokens.primitives.text, indent),
		...emitRadius(tokens.primitives.radius, indent),
	];

	const semanticLines = (
		Object.keys(tokens.semantics) as Array<keyof DesignTokens["semantics"]>
	).map((role) => emitSemantic(role, tokens.semantics[role], indent));

	const lightBlock = `${selector} {\n${[...primitiveLines, ...semanticLines].join("\n")}\n}`;

	const darkLines = emitRamp(tokens.dark.neutral, "neutral", indent);
	const darkBlock = `${darkSelector} {\n${darkLines.join("\n")}\n}`;

	return `${lightBlock}\n\n${darkBlock}\n`;
}
