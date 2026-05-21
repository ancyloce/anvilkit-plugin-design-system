// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { ThemeStoreProvider } from "@anvilkit/core";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TokenProvider } from "../../runtime/token-context.js";
import { DEFAULT_TOKENS } from "../../tokens/default-tokens.js";
import { DesignSystemPanel } from "../DesignSystemPanel.js";

function Providers({ children }: { readonly children: ReactNode }) {
	return (
		<ThemeStoreProvider>
			<TokenProvider
				value={{
					tokens: DEFAULT_TOKENS,
					validation: { offToken: true, contrast: true },
				}}
			>
				{children}
			</TokenProvider>
		</ThemeStoreProvider>
	);
}

describe("DesignSystemPanel", () => {
	let writeText: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText },
			configurable: true,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renders both tabs and shows the Tokens body by default", () => {
		render(
			<Providers>
				<DesignSystemPanel />
			</Providers>,
		);
		expect(screen.getByTestId("design-system-panel")).toBeInTheDocument();
		expect(screen.getByTestId("design-system-tab-tokens")).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByTestId("design-system-tab-theme")).toHaveAttribute(
			"aria-selected",
			"false",
		);
		expect(
			screen.getByTestId("design-system-panel-tokens"),
		).toBeInTheDocument();
	});

	it("switches to the Theme tab when its tab button is clicked", () => {
		render(
			<Providers>
				<DesignSystemPanel />
			</Providers>,
		);
		fireEvent.click(screen.getByTestId("design-system-tab-theme"));
		expect(screen.getByTestId("design-system-panel-theme")).toBeInTheDocument();
		expect(screen.queryByTestId("design-system-panel-tokens")).toBeNull();
	});

	it("copies the token ref to the clipboard when a Tokens row is clicked", () => {
		render(
			<Providers>
				<DesignSystemPanel />
			</Providers>,
		);
		const row = screen.getByTestId("token-row-color.brand.500");
		fireEvent.click(row);
		expect(writeText).toHaveBeenCalledWith("color.brand.500");
	});

	it("dispatches setMode to the theme store when a mode button is clicked", () => {
		render(
			<Providers>
				<DesignSystemPanel />
			</Providers>,
		);
		fireEvent.click(screen.getByTestId("design-system-tab-theme"));
		const dark = screen.getByTestId("theme-mode-dark");
		fireEvent.click(dark);
		// Active mode after click — visible via aria-checked on the radio.
		expect(dark).toHaveAttribute("aria-checked", "true");
	});

	it("renders one row per resolved ref grouped by category", () => {
		render(
			<Providers>
				<DesignSystemPanel />
			</Providers>,
		);
		// Spot-check coverage across categories.
		expect(screen.getByTestId("token-row-color.brand.500")).toBeInTheDocument();
		expect(
			screen.getByTestId("token-row-color.neutral.100"),
		).toBeInTheDocument();
		expect(screen.getByTestId("token-row-semantic.accent")).toBeInTheDocument();
		expect(screen.getByTestId("token-row-space.4")).toBeInTheDocument();
		expect(screen.getByTestId("token-row-text.lg")).toBeInTheDocument();
		expect(screen.getByTestId("token-row-radius.md")).toBeInTheDocument();
	});
});
