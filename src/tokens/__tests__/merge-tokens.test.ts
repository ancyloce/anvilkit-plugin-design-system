import { describe, expect, it } from "vitest";

import { DEFAULT_TOKENS } from "../default-tokens.js";
import { mergeTokens } from "../merge-tokens.js";

describe("mergeTokens", () => {
	it("returns DEFAULT_TOKENS reference when no overrides are supplied", () => {
		expect(mergeTokens(DEFAULT_TOKENS)).toBe(DEFAULT_TOKENS);
		expect(mergeTokens(DEFAULT_TOKENS, {})).toBe(DEFAULT_TOKENS);
	});

	it("applies a single primitive override and leaves the rest reference-equal", () => {
		const merged = mergeTokens(DEFAULT_TOKENS, {
			primitives: { brand: { 500: "oklch(70% 0.2 30)" } },
		});

		expect(merged).not.toBe(DEFAULT_TOKENS);
		expect(merged.primitives.brand[500]).toBe("oklch(70% 0.2 30)");

		// Structural sharing — untouched groups must remain reference-equal.
		expect(merged.primitives.neutral).toBe(DEFAULT_TOKENS.primitives.neutral);
		expect(merged.primitives.space).toBe(DEFAULT_TOKENS.primitives.space);
		expect(merged.primitives.text).toBe(DEFAULT_TOKENS.primitives.text);
		expect(merged.primitives.radius).toBe(DEFAULT_TOKENS.primitives.radius);
		expect(merged.semantics).toBe(DEFAULT_TOKENS.semantics);
	});

	it("applies a single semantic override and leaves primitives reference-equal", () => {
		const merged = mergeTokens(DEFAULT_TOKENS, {
			semantics: { accent: "brand.700" },
		});

		expect(merged).not.toBe(DEFAULT_TOKENS);
		expect(merged.semantics.accent).toBe("brand.700");
		expect(merged.semantics.bg).toBe(DEFAULT_TOKENS.semantics.bg);
		expect(merged.primitives).toBe(DEFAULT_TOKENS.primitives);
	});

	it("supports a deep nested partial without affecting siblings", () => {
		const merged = mergeTokens(DEFAULT_TOKENS, {
			primitives: {
				brand: { 500: "#abcdef" },
				space: { 4: "20px" },
			},
		});

		expect(merged.primitives.brand[500]).toBe("#abcdef");
		expect(merged.primitives.brand[600]).toBe(
			DEFAULT_TOKENS.primitives.brand[600],
		);
		expect(merged.primitives.space[4]).toBe("20px");
		expect(merged.primitives.space[8]).toBe(DEFAULT_TOKENS.primitives.space[8]);
		expect(merged.primitives.neutral).toBe(DEFAULT_TOKENS.primitives.neutral);
		expect(merged.semantics).toBe(DEFAULT_TOKENS.semantics);
	});

	it("ignores overrides that match defaults (structural sharing preserved)", () => {
		const merged = mergeTokens(DEFAULT_TOKENS, {
			primitives: { brand: { 500: DEFAULT_TOKENS.primitives.brand[500] } },
		});
		expect(merged).toBe(DEFAULT_TOKENS);
	});

	it("DEFAULT_TOKENS exposes the expected groups and semantics", () => {
		expect(Object.keys(DEFAULT_TOKENS.primitives).sort()).toEqual([
			"brand",
			"neutral",
			"radius",
			"space",
			"text",
		]);
		expect(Object.keys(DEFAULT_TOKENS.semantics).sort()).toEqual([
			"accent",
			"accentFg",
			"bg",
			"border",
			"fg",
			"fgMuted",
			"focusRing",
			"surface",
		]);
		expect(DEFAULT_TOKENS.semantics.accent).toBe("brand.500");
		expect(DEFAULT_TOKENS.semantics.bg).toBe("neutral.50");
	});
});
