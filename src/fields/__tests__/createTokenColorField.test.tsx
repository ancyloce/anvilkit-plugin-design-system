// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TokenProvider } from "../../runtime/token-context.js";
import { DEFAULT_TOKENS } from "../../tokens/default-tokens.js";
import { createTokenColorField } from "../createTokenColorField.js";

function renderField(
	field: ReturnType<typeof createTokenColorField>,
	args: {
		value: string;
		onChange?: (next: string) => void;
		readOnly?: boolean;
	},
) {
	const onChange = args.onChange ?? vi.fn();
	const element = field.render({
		field,
		name: "color",
		id: "color",
		value: args.value,
		onChange,
		readOnly: args.readOnly,
	});
	return {
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

describe("createTokenColorField", () => {
	it("returns a Puck CustomField<string> shape", () => {
		const field = createTokenColorField({ label: "Surface color" });
		expect(field.type).toBe("custom");
		expect(field.label).toBe("Surface color");
		expect(typeof field.render).toBe("function");
	});

	it("renders the color swatch + dropdown inside a TokenProvider", () => {
		const field = createTokenColorField({ label: "Surface" });
		const { getByTestId, getByLabelText } = renderField(field, {
			value: "color.brand.500",
		});
		expect(getByTestId("token-color-swatch")).toBeInTheDocument();
		const select = getByLabelText("Surface") as HTMLSelectElement;
		expect(select.value).toBe("color.brand.500");
	});

	it("populates the dropdown with color + semantic refs only", () => {
		const field = createTokenColorField({ label: "Color" });
		const { getByTestId } = renderField(field, { value: "color.brand.500" });
		const select = getByTestId("token-color-select") as HTMLSelectElement;
		const options = Array.from(select.options).map((o) => o.value);
		expect(options).toContain("color.brand.500");
		expect(options).toContain("color.neutral.300");
		expect(options).toContain("semantic.bg");
		// Spacing / text / radius are excluded.
		expect(options).not.toContain("space.4");
		expect(options).not.toContain("text.lg");
		expect(options).not.toContain("radius.md");
	});

	it("calls onChange with the new ref when the user picks a value", () => {
		const field = createTokenColorField({ label: "Color" });
		const { getByTestId, onChange } = renderField(field, {
			value: "color.brand.500",
		});
		const select = getByTestId("token-color-select") as HTMLSelectElement;
		fireEvent.change(select, { target: { value: "semantic.accent" } });
		expect(onChange).toHaveBeenCalledWith("semantic.accent");
	});

	it("renders a swatch with the resolved CSS var as background", () => {
		const field = createTokenColorField({ label: "Color" });
		const { getByTestId } = renderField(field, { value: "color.brand.500" });
		const swatch = getByTestId("token-color-swatch");
		expect(swatch.style.background).toContain("--ak-ds-brand-500");
	});

	it("disables the select when readOnly is true", () => {
		const field = createTokenColorField({ label: "Color" });
		const { getByTestId } = renderField(field, {
			value: "color.brand.500",
			readOnly: true,
		});
		const select = getByTestId("token-color-select") as HTMLSelectElement;
		expect(select.disabled).toBe(true);
	});

	it("renders a placeholder option when value is empty", () => {
		const field = createTokenColorField({ label: "Color" });
		const { getByTestId } = renderField(field, { value: "" });
		const select = getByTestId("token-color-select") as HTMLSelectElement;
		expect(select.options[0]?.text).toMatch(/select a token/i);
		expect(select.value).toBe("");
	});

	it("throws a descriptive error when rendered outside a TokenProvider", () => {
		const field = createTokenColorField({ label: "Color" });
		const element = field.render({
			field,
			name: "color",
			id: "color",
			value: "color.brand.500",
			onChange: vi.fn(),
		});
		expect(() => render(<>{element}</>)).toThrow(
			/useTokens\(\) was called outside <TokenProvider>/,
		);
	});
});
