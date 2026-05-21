import { describe, expect, it } from "vitest";

import { DEFAULT_TOKENS } from "../../tokens/default-tokens.js";
import { listTokenRefs, resolveTokenRef } from "../resolve-ref.js";

describe("resolveTokenRef", () => {
	it("resolves a primitive color ref to a var() + raw value", () => {
		const ref = resolveTokenRef("color.brand.500", DEFAULT_TOKENS);
		expect(ref.kind).toBe("color");
		expect(ref.cssVar).toBe("var(--ak-ds-brand-500)");
		expect(ref.value).toBe(DEFAULT_TOKENS.primitives.brand[500]);
	});

	it("resolves a neutral color ref across both ramps", () => {
		const ref = resolveTokenRef("color.neutral.300", DEFAULT_TOKENS);
		expect(ref.kind).toBe("color");
		expect(ref.cssVar).toBe("var(--ak-ds-neutral-300)");
		expect(ref.value).toBe(DEFAULT_TOKENS.primitives.neutral[300]);
	});

	it("resolves a semantic role through its primitive indirection", () => {
		const ref = resolveTokenRef("semantic.accent", DEFAULT_TOKENS);
		expect(ref.kind).toBe("semantic");
		expect(ref.cssVar).toBe("var(--ak-ds-accent)");
		// semantics.accent → "brand.500" → primitives.brand[500]
		expect(ref.value).toBe(DEFAULT_TOKENS.primitives.brand[500]);
	});

	it("resolves a kebab-case semantic role (fgMuted, accentFg, focusRing)", () => {
		expect(resolveTokenRef("semantic.fgMuted", DEFAULT_TOKENS).cssVar).toBe(
			"var(--ak-ds-fg-muted)",
		);
		expect(resolveTokenRef("semantic.accentFg", DEFAULT_TOKENS).cssVar).toBe(
			"var(--ak-ds-accent-fg)",
		);
		expect(resolveTokenRef("semantic.focusRing", DEFAULT_TOKENS).cssVar).toBe(
			"var(--ak-ds-focus-ring)",
		);
	});

	it("resolves spacing / text / radius primitives", () => {
		expect(resolveTokenRef("space.4", DEFAULT_TOKENS)).toMatchObject({
			kind: "space",
			cssVar: "var(--ak-ds-space-4)",
			value: "16px",
		});
		expect(resolveTokenRef("text.lg", DEFAULT_TOKENS)).toMatchObject({
			kind: "text",
			cssVar: "var(--ak-ds-text-lg)",
			value: "18px",
		});
		expect(resolveTokenRef("radius.md", DEFAULT_TOKENS)).toMatchObject({
			kind: "radius",
			cssVar: "var(--ak-ds-radius-md)",
			value: "8px",
		});
	});

	it('rejects malformed refs as kind="unknown"', () => {
		for (const bad of [
			"",
			"color",
			"color.brand",
			"color.unknownRamp.500",
			"color.brand.999",
			"semantic.unknownRole",
			"space.foo",
			"text.foo",
			"radius.foo",
			"banana.split",
			"color..500",
		]) {
			const result = resolveTokenRef(bad, DEFAULT_TOKENS);
			expect(result.kind, `expected "${bad}" to be unknown`).toBe("unknown");
			expect(result.cssVar).toBeUndefined();
			expect(result.value).toBeUndefined();
		}
	});

	it("threads host overrides through into the resolved value", () => {
		const tokens = {
			...DEFAULT_TOKENS,
			primitives: {
				...DEFAULT_TOKENS.primitives,
				brand: { ...DEFAULT_TOKENS.primitives.brand, 500: "#abcdef" },
			},
		};
		expect(resolveTokenRef("color.brand.500", tokens).value).toBe("#abcdef");
	});
});

describe("listTokenRefs", () => {
	it("enumerates one resolved ref per primitive + semantic entry", () => {
		const refs = listTokenRefs(DEFAULT_TOKENS);
		// brand(10) + neutral(10) + semantics(8) + space(10) + text(7) + radius(3) = 48
		expect(refs).toHaveLength(48);
		expect(refs.every((r) => r.kind !== "unknown")).toBe(true);
	});

	it("includes a stable color ref for every brand step", () => {
		const refs = listTokenRefs(DEFAULT_TOKENS).map((r) => r.ref);
		for (const step of [
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
		]) {
			expect(refs).toContain(`color.brand.${step}`);
		}
	});
});
