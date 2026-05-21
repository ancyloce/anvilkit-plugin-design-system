/**
 * @file WCAG-AA contrast pair detection.
 *
 * On `onBeforePublish`, walk every component's props for known
 * foreground/background prop conventions (`color` + `background[Color]`),
 * resolve the token refs through the live token tree, parse the
 * resolved value as a color, compute the WCAG 2.1 contrast ratio, and
 * abort the publish via `StudioPluginError` if any pair fails the AA
 * threshold (4.5:1 for normal text).
 *
 * v0.1 contract — parse limits:
 *
 *   - Hex strings (`#abc`, `#abcdef`, `#abcdefAA`) are parsed and
 *     contribute to ratio computation.
 *   - `rgb()` / `rgba()` are parsed.
 *   - `oklch()` / `oklab()` / `hsl()` are intentionally NOT parsed in
 *     v0.1 — converting them to sRGB-linear requires more math than
 *     fits this milestone. Pairs whose resolved value can't be parsed
 *     are silently skipped (no false-positive failures). Hosts that
 *     want full coverage today can override their token primitives to
 *     hex values; broader parsing lands in a follow-up.
 */

import { resolveTokenRef } from "../runtime/resolve-ref.js";
import type { DesignTokens } from "../tokens/types.js";

export interface ContrastPair {
	readonly fg: string;
	readonly bg: string;
}

/**
 * The default fg/bg prop conventions checked on every component. v0.1
 * is intentionally narrow; future versions can expose this via
 * `opts.validation.contrastPairs`.
 */
export const DEFAULT_CONTRAST_PAIRS: ReadonlyArray<ContrastPair> = [
	{ fg: "color", bg: "backgroundColor" },
	{ fg: "color", bg: "background" },
];

export const WCAG_AA_NORMAL = 4.5;

export interface ContrastFailure {
	readonly path: string;
	readonly fgPath: string;
	readonly bgPath: string;
	readonly fgRef: string;
	readonly bgRef: string;
	readonly ratio: number;
	readonly threshold: number;
	readonly componentType: string;
	readonly message: string;
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

interface RGB {
	readonly r: number;
	readonly g: number;
	readonly b: number;
}

function expandShortHex(hex: string): string {
	// "#abc" → "#aabbcc", "#abcd" → "#aabbccdd"
	if (hex.length === 4 || hex.length === 5) {
		const r = hex[1] ?? "";
		const g = hex[2] ?? "";
		const b = hex[3] ?? "";
		const a = hex.length === 5 ? (hex[4] ?? "") : "";
		return `#${r}${r}${g}${g}${b}${b}${a}${a}`;
	}
	return hex;
}

function parseHex(value: string): RGB | undefined {
	if (!value.startsWith("#")) return undefined;
	const normalized = expandShortHex(value).toLowerCase();
	if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(normalized)) return undefined;
	const r = Number.parseInt(normalized.slice(1, 3), 16);
	const g = Number.parseInt(normalized.slice(3, 5), 16);
	const b = Number.parseInt(normalized.slice(5, 7), 16);
	return { r, g, b };
}

function parseRgb(value: string): RGB | undefined {
	const m = /^rgba?\s*\(\s*([^)]+)\)$/i.exec(value);
	if (!m) return undefined;
	const parts = (m[1] ?? "").split(/[\s,/]+/).filter((s) => s.length > 0);
	if (parts.length < 3) return undefined;
	const [rs, gs, bs] = parts;
	if (rs === undefined || gs === undefined || bs === undefined)
		return undefined;
	const r = Number.parseFloat(rs.endsWith("%") ? rs : rs);
	const g = Number.parseFloat(gs.endsWith("%") ? gs : gs);
	const b = Number.parseFloat(bs.endsWith("%") ? bs : bs);
	if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return undefined;
	const scale = rs.endsWith("%") ? 2.55 : 1;
	return { r: r * scale, g: g * scale, b: b * scale };
}

export function parseColor(value: string): RGB | undefined {
	const trimmed = value.trim();
	return parseHex(trimmed) ?? parseRgb(trimmed);
}

function srgbToLinear(channel: number): number {
	const c = channel / 255;
	return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(color: RGB): number {
	const r = srgbToLinear(color.r);
	const g = srgbToLinear(color.g);
	const b = srgbToLinear(color.b);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: RGB, bg: RGB): number {
	const lf = luminance(fg);
	const lb = luminance(bg);
	const lighter = Math.max(lf, lb);
	const darker = Math.min(lf, lb);
	return (lighter + 0.05) / (darker + 0.05);
}

function resolveToColor(ref: unknown, tokens: DesignTokens): RGB | undefined {
	if (typeof ref !== "string") return undefined;
	const resolved = resolveTokenRef(ref, tokens);
	if (resolved.kind === "unknown" || resolved.value === undefined) {
		// Try parsing the raw value (it may be a literal off-token color
		// the off-token walker already flagged).
		return parseColor(ref);
	}
	return parseColor(resolved.value);
}

interface ComponentNode {
	readonly type?: string;
	readonly props?: Record<string, unknown>;
}

function* walkComponents(data: PuckDataLike): Generator<{
	readonly node: ComponentNode;
	readonly pathPrefix: string;
}> {
	if (data.root) {
		yield { node: data.root, pathPrefix: "root" };
	}
	if (Array.isArray(data.content)) {
		for (let i = 0; i < data.content.length; i += 1) {
			const node = data.content[i];
			if (node) {
				yield { node, pathPrefix: `content[${i}]` };
			}
		}
	}
	if (data.zones) {
		for (const zoneKey of Object.keys(data.zones)) {
			const zone = data.zones[zoneKey] ?? [];
			for (let i = 0; i < zone.length; i += 1) {
				const node = zone[i];
				if (node) {
					yield { node, pathPrefix: `zones["${zoneKey}"][${i}]` };
				}
			}
		}
	}
}

export function findContrastFailures(
	data: PuckDataLike,
	tokens: DesignTokens,
	options: {
		readonly pairs?: ReadonlyArray<ContrastPair>;
		readonly threshold?: number;
	} = {},
): ReadonlyArray<ContrastFailure> {
	const pairs = options.pairs ?? DEFAULT_CONTRAST_PAIRS;
	const threshold = options.threshold ?? WCAG_AA_NORMAL;
	const failures: ContrastFailure[] = [];

	for (const { node, pathPrefix } of walkComponents(data)) {
		const props = node.props;
		if (!props) continue;
		for (const pair of pairs) {
			const fgRef = props[pair.fg];
			const bgRef = props[pair.bg];
			if (fgRef === undefined || bgRef === undefined) continue;
			const fgColor = resolveToColor(fgRef, tokens);
			const bgColor = resolveToColor(bgRef, tokens);
			if (!fgColor || !bgColor) continue; // Unparseable — skip.
			const ratio = contrastRatio(fgColor, bgColor);
			if (ratio + 0.005 < threshold) {
				const componentType = node.type ?? "root";
				failures.push({
					path: pathPrefix,
					fgPath: `${pathPrefix}.props.${pair.fg}`,
					bgPath: `${pathPrefix}.props.${pair.bg}`,
					fgRef: String(fgRef),
					bgRef: String(bgRef),
					ratio,
					threshold,
					componentType,
					message: `Contrast ${ratio.toFixed(2)}:1 below AA ${threshold}:1 at ${pathPrefix} (${pair.fg}=${String(fgRef)} vs ${pair.bg}=${String(bgRef)})`,
				});
			}
		}
	}

	return failures;
}
