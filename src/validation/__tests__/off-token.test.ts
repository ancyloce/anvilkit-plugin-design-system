import { describe, expect, it } from "vitest";

import { DEFAULT_TOKENS } from "../../tokens/default-tokens.js";
import { findOffTokenWarnings } from "../off-token.js";

describe("findOffTokenWarnings", () => {
	it("returns no warnings when every prop is a token ref or non-CSS string", () => {
		const warnings = findOffTokenWarnings(
			{
				content: [
					{
						type: "Card",
						props: {
							background: "color.brand.500",
							padding: "space.4",
							title: "Hello world",
						},
					},
				],
			},
			DEFAULT_TOKENS,
		);
		expect(warnings).toEqual([]);
	});

	it("flags hex color literals not present in the token tree", () => {
		const warnings = findOffTokenWarnings(
			{
				content: [{ type: "Card", props: { background: "#ff00aa" } }],
			},
			DEFAULT_TOKENS,
		);
		expect(warnings).toHaveLength(1);
		expect(warnings[0]).toMatchObject({
			path: "content[0].props.background",
			value: "#ff00aa",
			category: "color",
			componentType: "Card",
			fieldKey: "background",
		});
		expect(warnings[0]?.message).toMatch(/Off-token color literal "#ff00aa"/);
	});

	it("flags rgb/hsl/oklch function literals not in the tree", () => {
		const warnings = findOffTokenWarnings(
			{
				content: [
					{
						type: "Banner",
						props: {
							a: "rgb(255, 0, 0)",
							b: "hsl(120deg, 50%, 50%)",
							c: "oklch(50% 0.1 200)",
						},
					},
				],
			},
			DEFAULT_TOKENS,
		);
		expect(warnings.map((w) => w.value)).toEqual([
			"rgb(255, 0, 0)",
			"hsl(120deg, 50%, 50%)",
			"oklch(50% 0.1 200)",
		]);
	});

	it("does not flag a value that matches a primitive in the tokens tree", () => {
		// brand.500 resolves to a specific oklch value — using that
		// literal directly is still off-token in spirit (no indirection)
		// but shape-based detection only catches values not in the set
		// of resolved values. To make the test deterministic, override
		// brand.500 to a unique known value and use it as the literal.
		const tokens = {
			...DEFAULT_TOKENS,
			primitives: {
				...DEFAULT_TOKENS.primitives,
				brand: {
					...DEFAULT_TOKENS.primitives.brand,
					500: "#deadbeef",
				},
			},
		};
		const warnings = findOffTokenWarnings(
			{
				content: [{ type: "Card", props: { color: "#deadbeef" } }],
			},
			tokens,
		);
		// The literal matches a known token value, so it's not flagged.
		expect(warnings).toEqual([]);
	});

	it("flags off-token length literals", () => {
		const warnings = findOffTokenWarnings(
			{
				content: [
					{
						type: "Card",
						props: {
							gap: "11px", // not in space scale
							radius: "5px", // not in radius scale
						},
					},
				],
			},
			DEFAULT_TOKENS,
		);
		expect(warnings).toHaveLength(2);
		expect(warnings.map((w) => w.value)).toEqual(["11px", "5px"]);
		expect(warnings[0]?.category).toBe("spacing");
	});

	it("does not flag length values present in the token tree", () => {
		// `16px` is the value of `space.4`. Using it literally is
		// off-token in spirit, but shape-based detection only catches
		// values not in the set; this guards against false positives.
		const warnings = findOffTokenWarnings(
			{
				content: [{ type: "Card", props: { gap: "16px" } }],
			},
			DEFAULT_TOKENS,
		);
		expect(warnings).toEqual([]);
	});

	it("ignores named color keywords (transparent / currentcolor)", () => {
		const warnings = findOffTokenWarnings(
			{
				content: [
					{
						type: "Card",
						props: { bg: "transparent", border: "currentColor" },
					},
				],
			},
			DEFAULT_TOKENS,
		);
		expect(warnings).toEqual([]);
	});

	it("respects category toggles", () => {
		const data = {
			content: [
				{
					type: "Card",
					props: { color: "#abc123", gap: "11px" },
				},
			],
		};
		const onlyColor = findOffTokenWarnings(data, DEFAULT_TOKENS, {
			categories: { color: true, spacing: false, typography: false },
		});
		expect(onlyColor.map((w) => w.category)).toEqual(["color"]);

		const onlySpacing = findOffTokenWarnings(data, DEFAULT_TOKENS, {
			categories: { color: false, spacing: true, typography: false },
		});
		expect(onlySpacing.map((w) => w.category)).toEqual(["spacing"]);

		const none = findOffTokenWarnings(data, DEFAULT_TOKENS, {
			categories: { color: false, spacing: false, typography: false },
		});
		expect(none).toEqual([]);
	});

	it("scans root + content + zones in a single pass", () => {
		const warnings = findOffTokenWarnings(
			{
				root: { props: { headerBg: "#abc123" } },
				content: [{ type: "Card", props: { color: "#def456" } }],
				zones: {
					hero: [{ type: "Banner", props: { padding: "11px" } }],
				},
			},
			DEFAULT_TOKENS,
		);
		expect(warnings.map((w) => w.path)).toEqual([
			"root.props.headerBg",
			"content[0].props.color",
			'zones["hero"][0].props.padding',
		]);
	});
});
