// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TokenProvider } from "../../runtime/token-context.js";
import { DEFAULT_TOKENS } from "../../tokens/default-tokens.js";
import { createTokenTypographyField } from "../createTokenTypographyField.js";

function renderField(value: string, onChange = vi.fn()) {
	const field = createTokenTypographyField({ label: "Heading size" });
	const element = field.render({
		field,
		name: "headingSize",
		id: "headingSize",
		value,
		onChange,
	});
	return {
		field,
		onChange,
		...render(
			<TokenProvider
				value={{
					tokens: DEFAULT_TOKENS,
					validation: { offToken: true, contrast: true },
				}}
			>
				{element}
			</TokenProvider>,
		),
	};
}

describe("createTokenTypographyField", () => {
	it("returns a Puck CustomField<string> shape", () => {
		const field = createTokenTypographyField({ label: "Heading" });
		expect(field.type).toBe("custom");
		expect(field.label).toBe("Heading");
	});

	it("populates the dropdown with text refs only", () => {
		const { getByTestId } = renderField("text.lg");
		const select = getByTestId("token-typography-select") as HTMLSelectElement;
		const options = Array.from(select.options).map((o) => o.value);
		expect(options).toContain("text.xs");
		expect(options).toContain("text.lg");
		expect(options).toContain("text.3xl");
		expect(options).not.toContain("color.brand.500");
		expect(options).not.toContain("space.4");
	});

	it("round-trips the ref via onChange", () => {
		const { getByTestId, onChange } = renderField("text.lg");
		const select = getByTestId("token-typography-select") as HTMLSelectElement;
		fireEvent.change(select, { target: { value: "text.2xl" } });
		expect(onChange).toHaveBeenCalledWith("text.2xl");
	});

	it("renders the typography swatch with the resolved CSS var font-size", () => {
		const { getByTestId } = renderField("text.lg");
		const swatch = getByTestId("token-typography-swatch");
		expect(swatch.style.fontSize).toContain("--ak-ds-text-lg");
	});
});
