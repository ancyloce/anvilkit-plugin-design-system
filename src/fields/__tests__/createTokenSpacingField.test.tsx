// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TokenProvider } from "../../runtime/token-context.js";
import { DEFAULT_TOKENS } from "../../tokens/default-tokens.js";
import { createTokenSpacingField } from "../createTokenSpacingField.js";

function renderField(value: string, onChange = vi.fn()) {
	const field = createTokenSpacingField({ label: "Gap" });
	const element = field.render({
		field,
		name: "gap",
		id: "gap",
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

describe("createTokenSpacingField", () => {
	it("returns a Puck CustomField<string> shape", () => {
		const field = createTokenSpacingField({ label: "Gap" });
		expect(field.type).toBe("custom");
		expect(field.label).toBe("Gap");
	});

	it("populates the dropdown with space refs only", () => {
		const { getByTestId } = renderField("space.4");
		const select = getByTestId("token-spacing-select") as HTMLSelectElement;
		const options = Array.from(select.options).map((o) => o.value);
		expect(options).toContain("space.0");
		expect(options).toContain("space.4");
		expect(options).toContain("space.24");
		expect(options).not.toContain("color.brand.500");
		expect(options).not.toContain("text.lg");
	});

	it("round-trips the ref via onChange", () => {
		const { getByTestId, onChange } = renderField("space.4");
		const select = getByTestId("token-spacing-select") as HTMLSelectElement;
		fireEvent.change(select, { target: { value: "space.8" } });
		expect(onChange).toHaveBeenCalledWith("space.8");
	});

	it("renders the spacing swatch with the resolved CSS var width", () => {
		const { getByTestId } = renderField("space.4");
		const swatch = getByTestId("token-spacing-swatch");
		// Inner bar's width inherits from the resolved var.
		const bar = swatch.firstElementChild as HTMLElement;
		expect(bar.style.width).toContain("--ak-ds-space-4");
	});
});
