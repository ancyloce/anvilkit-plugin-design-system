/**
 * @file Off-token warning detection.
 *
 * Walks every primitive leaf in a Puck `Data` tree and flags string
 * values that look like CSS literals (hex color, color function, px /
 * rem / em number, etc.) but are not present in the resolved token
 * tree. The PRD spec calls this the "off-token" guardrail (PRD §6.2):
 * non-blocking warnings emitted on every data change so editors notice
 * when a component prop drifted off the system.
 *
 * Shape-based detection (the chosen v0 scope — see plan §"Locked
 * decisions") means the walker scans every string regardless of
 * which field produced it. Consumers can fully disable the hook via
 * `opts.validation.offToken: false` if false positives prove noisy.
 */

import type { DesignTokens } from "../tokens/types.js";
import { walkPuckData } from "./walk-puck-data.js";

export type OffTokenCategory = "color" | "spacing" | "typography";

export interface OffTokenWarning {
	readonly path: string;
	readonly value: string;
	readonly category: OffTokenCategory;
	readonly componentType: string;
	readonly fieldKey: string;
	readonly message: string;
}

const COLOR_HEX_RE = /^#[0-9a-fA-F]{3,8}$/;
const COLOR_FUNC_RE = /^(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\s*\(/i;
const COLOR_NAMED_RE = /^(transparent|currentcolor|inherit|initial|unset)$/i;
const LENGTH_RE = /^-?\d+(?:\.\d+)?(?:px|rem|em|%)$/;

function isColorLiteral(value: string): boolean {
	if (COLOR_NAMED_RE.test(value)) return false;
	return COLOR_HEX_RE.test(value) || COLOR_FUNC_RE.test(value);
}

function isLengthLiteral(value: string): boolean {
	return LENGTH_RE.test(value);
}

function collectColorValues(tokens: DesignTokens): ReadonlySet<string> {
	const set = new Set<string>();
	for (const ramp of [
		tokens.primitives.brand,
		tokens.primitives.neutral,
		tokens.dark.neutral,
	]) {
		// `ColorRamp` keys are number-typed (`50` | `100` | …), but
		// `Object.values` returns the value array directly without the
		// stringly-typed key handoff that trips noUncheckedIndexedAccess.
		for (const value of Object.values(ramp)) set.add(value);
	}
	return set;
}

function collectLengthValues(tokens: DesignTokens): ReadonlySet<string> {
	const set = new Set<string>();
	for (const value of Object.values(tokens.primitives.space)) set.add(value);
	for (const value of Object.values(tokens.primitives.text)) set.add(value);
	for (const value of Object.values(tokens.primitives.radius)) set.add(value);
	return set;
}

interface FindOffTokenOptions {
	readonly categories?: {
		readonly color?: boolean;
		readonly spacing?: boolean;
		readonly typography?: boolean;
	};
}

interface PuckDataLike {
	readonly root?: { readonly props?: Record<string, unknown> };
	readonly content?: ReadonlyArray<{
		readonly type?: string;
		readonly props?: Record<string, unknown>;
	}>;
	readonly zones?: Record<
		string,
		ReadonlyArray<{
			readonly type?: string;
			readonly props?: Record<string, unknown>;
		}>
	>;
}

/**
 * Scan every primitive string in `data` and return one warning per
 * literal that should have been a token ref. Pure function — the
 * lifecycle hook wraps this and dispatches via `ctx.log("warn", …)`.
 */
export function findOffTokenWarnings(
	data: PuckDataLike,
	tokens: DesignTokens,
	options: FindOffTokenOptions = {},
): ReadonlyArray<OffTokenWarning> {
	const enabled = {
		color: options.categories?.color ?? true,
		spacing: options.categories?.spacing ?? true,
		typography: options.categories?.typography ?? true,
	};
	const knownColors = enabled.color ? collectColorValues(tokens) : null;
	const knownLengths =
		enabled.spacing || enabled.typography ? collectLengthValues(tokens) : null;

	const warnings: OffTokenWarning[] = [];
	for (const leaf of walkPuckData(data)) {
		if (typeof leaf.value !== "string") continue;
		const value = leaf.value.trim();
		if (value.length === 0) continue;

		if (knownColors !== null && isColorLiteral(value)) {
			if (!knownColors.has(value)) {
				warnings.push({
					path: leaf.path,
					value,
					category: "color",
					componentType: leaf.componentType,
					fieldKey: leaf.fieldKey,
					message: `Off-token color literal "${value}" at ${leaf.path} — use a token ref like \`color.brand.500\` or \`semantic.accent\``,
				});
			}
			continue;
		}
		if (knownLengths !== null && isLengthLiteral(value)) {
			if (!knownLengths.has(value)) {
				// A length literal could be either spacing or typography
				// off-token; we bucket as "spacing" if the spacing toggle
				// is on, else typography. This is best-effort grouping
				// for the warning message — both knobs default to true.
				const category: OffTokenCategory = enabled.spacing
					? "spacing"
					: "typography";
				if (
					(category === "spacing" && !enabled.spacing) ||
					(category === "typography" && !enabled.typography)
				) {
					continue;
				}
				warnings.push({
					path: leaf.path,
					value,
					category,
					componentType: leaf.componentType,
					fieldKey: leaf.fieldKey,
					message: `Off-token length literal "${value}" at ${leaf.path} — use a token ref like \`space.4\` or \`text.lg\``,
				});
			}
		}
	}
	return warnings;
}
