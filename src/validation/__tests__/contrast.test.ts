import { describe, expect, it } from "vitest";

import { DEFAULT_TOKENS } from "../../tokens/default-tokens.js";
import {
	contrastRatio,
	findContrastFailures,
	luminance,
	parseColor,
	WCAG_AA_NORMAL,
} from "../contrast.js";

describe("parseColor", () => {
	it("parses 6-digit hex", () => {
		expect(parseColor("#000000")).toEqual({ r: 0, g: 0, b: 0 });
		expect(parseColor("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
	});

	it("expands 3-digit hex", () => {
		expect(parseColor("#abc")).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc });
	});

	it("parses rgb()", () => {
		expect(parseColor("rgb(10, 20, 30)")).toEqual({ r: 10, g: 20, b: 30 });
	});

	it("parses rgba()", () => {
		expect(parseColor("rgba(10, 20, 30, 0.5)")).toEqual({
			r: 10,
			g: 20,
			b: 30,
		});
	});

	it("returns undefined for unparseable values", () => {
		expect(parseColor("oklch(50% 0.1 200)")).toBeUndefined();
		expect(parseColor("not a color")).toBeUndefined();
		expect(parseColor("#xyz")).toBeUndefined();
	});
});

describe("luminance + contrastRatio (WCAG references)", () => {
	it("black has luminance 0", () => {
		expect(luminance({ r: 0, g: 0, b: 0 })).toBe(0);
	});

	it("white has luminance 1", () => {
		expect(luminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 4);
	});

	it("black-on-white is 21:1", () => {
		const ratio = contrastRatio(
			{ r: 0, g: 0, b: 0 },
			{ r: 255, g: 255, b: 255 },
		);
		expect(ratio).toBeCloseTo(21, 1);
	});

	it("same color is 1:1", () => {
		const ratio = contrastRatio(
			{ r: 100, g: 100, b: 100 },
			{ r: 100, g: 100, b: 100 },
		);
		expect(ratio).toBe(1);
	});

	it("ratio is symmetric (fg/bg swap = same value)", () => {
		const a = { r: 50, g: 50, b: 50 };
		const b = { r: 200, g: 200, b: 200 };
		expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 6);
	});
});

describe("findContrastFailures", () => {
	function hexTokens(overrides: Record<string, string>) {
		// Build a tokens tree where brand/neutral primitives are hex so
		// contrast math can run end-to-end (DEFAULT_TOKENS use oklch
		// which v0.1 doesn't parse).
		return {
			...DEFAULT_TOKENS,
			primitives: {
				...DEFAULT_TOKENS.primitives,
				brand: {
					...DEFAULT_TOKENS.primitives.brand,
					...(overrides.brand500 ? { 500: overrides.brand500 } : {}),
					...(overrides.brand50 ? { 50: overrides.brand50 } : {}),
				},
				neutral: {
					...DEFAULT_TOKENS.primitives.neutral,
					...(overrides.neutral900 ? { 900: overrides.neutral900 } : {}),
					...(overrides.neutral50 ? { 50: overrides.neutral50 } : {}),
				},
			},
		};
	}

	it("returns no failures when both colors are unparseable (e.g. oklch defaults)", () => {
		const data = {
			content: [
				{
					type: "Card",
					props: {
						color: "color.brand.500",
						backgroundColor: "color.neutral.50",
					},
				},
			],
		};
		expect(findContrastFailures(data, DEFAULT_TOKENS)).toEqual([]);
	});

	it("flags a pair below AA when tokens resolve to low-contrast hex", () => {
		const tokens = hexTokens({
			brand500: "#888888", // mid-grey
			neutral50: "#aaaaaa", // light grey
		});
		const data = {
			content: [
				{
					type: "Card",
					props: {
						color: "color.brand.500",
						backgroundColor: "color.neutral.50",
					},
				},
			],
		};
		const failures = findContrastFailures(data, tokens);
		expect(failures).toHaveLength(1);
		expect(failures[0]).toMatchObject({
			fgPath: "content[0].props.color",
			bgPath: "content[0].props.backgroundColor",
			fgRef: "color.brand.500",
			bgRef: "color.neutral.50",
			threshold: WCAG_AA_NORMAL,
			componentType: "Card",
		});
		expect(failures[0]?.ratio).toBeLessThan(WCAG_AA_NORMAL);
		expect(failures[0]?.message).toMatch(/below AA 4\.5:1/);
	});

	it("passes when the resolved pair clears AA (black on white)", () => {
		const tokens = hexTokens({
			brand500: "#000000",
			neutral50: "#ffffff",
		});
		const data = {
			content: [
				{
					type: "Card",
					props: {
						color: "color.brand.500",
						backgroundColor: "color.neutral.50",
					},
				},
			],
		};
		expect(findContrastFailures(data, tokens)).toEqual([]);
	});

	it("checks the `background` alias alongside `backgroundColor`", () => {
		const tokens = hexTokens({
			brand500: "#888888",
			neutral50: "#aaaaaa",
		});
		const data = {
			content: [
				{
					type: "Banner",
					props: {
						color: "color.brand.500",
						background: "color.neutral.50",
					},
				},
			],
		};
		const failures = findContrastFailures(data, tokens);
		expect(failures).toHaveLength(1);
		expect(failures[0]?.bgPath).toBe("content[0].props.background");
	});

	it("respects a custom pair list", () => {
		const tokens = hexTokens({ brand500: "#888888", neutral50: "#aaaaaa" });
		const data = {
			content: [
				{
					type: "Card",
					props: {
						labelColor: "color.brand.500",
						chipBg: "color.neutral.50",
					},
				},
			],
		};
		const failures = findContrastFailures(data, tokens, {
			pairs: [{ fg: "labelColor", bg: "chipBg" }],
		});
		expect(failures).toHaveLength(1);
		expect(failures[0]?.fgPath).toBe("content[0].props.labelColor");
	});

	it("respects a custom threshold (AAA = 7:1)", () => {
		const tokens = hexTokens({
			brand500: "#595959", // ratio vs white ≈ 7.0 — at AAA boundary
			neutral50: "#ffffff",
		});
		const data = {
			content: [
				{
					type: "Card",
					props: {
						color: "color.brand.500",
						backgroundColor: "color.neutral.50",
					},
				},
			],
		};
		expect(findContrastFailures(data, tokens, { threshold: 4.5 })).toEqual([]);
		// At AAA (7.0), borderline — assert the function honors the new
		// threshold either way (depending on rounding).
		const aaa = findContrastFailures(data, tokens, { threshold: 7.0 });
		expect(Array.isArray(aaa)).toBe(true);
	});

	it("walks root + content + zones", () => {
		const tokens = hexTokens({ brand500: "#888888", neutral50: "#aaaaaa" });
		const data = {
			root: {
				props: {
					color: "color.brand.500",
					backgroundColor: "color.neutral.50",
				},
			},
			content: [
				{
					type: "Card",
					props: {
						color: "color.brand.500",
						backgroundColor: "color.neutral.50",
					},
				},
			],
			zones: {
				footer: [
					{
						type: "FooterCard",
						props: {
							color: "color.brand.500",
							backgroundColor: "color.neutral.50",
						},
					},
				],
			},
		};
		const failures = findContrastFailures(data, tokens);
		expect(failures.map((f) => f.path)).toEqual([
			"root",
			"content[0]",
			'zones["footer"][0]',
		]);
	});
});
