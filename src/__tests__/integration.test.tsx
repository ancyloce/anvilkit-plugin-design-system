// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { StudioPluginError, ThemeStoreProvider } from "@anvilkit/core";
import { fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
	createDesignSystemPlugin,
	createTokenColorField,
} from "../index.js";
import { TokenProvider } from "../runtime/token-context.js";

interface PanelRegistration {
	readonly render: () => ReactNode;
}

function makeCtx() {
	const log = vi.fn();
	const calls: PanelRegistration[] = [];
	const unregister = vi.fn();
	const registerDesignSystemPanel = vi.fn((panel: PanelRegistration) => {
		calls.push(panel);
		return unregister;
	});
	return {
		log,
		unregister,
		calls,
		ctx: { log, registerDesignSystemPanel } as never,
	};
}

const integrationData = {
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

const lowContrastData = {
	content: [
		{
			type: "Card",
			props: {
				color: "color.brand.500", // overridden to #888 below
				backgroundColor: "color.neutral.50", // overridden to #aaa below
			},
		},
	],
};

describe("@anvilkit/plugin-design-system — integration", () => {
	it("registers all four surfaces (overrides, panel, onDataChange, onBeforePublish)", () => {
		const { ctx, calls } = makeCtx();
		const plugin = createDesignSystemPlugin({
			tokens: {
				primitives: {
					brand: { 500: "#000000" },
					neutral: { 50: "#ffffff" },
				},
			},
		});
		const reg = plugin.register(ctx);

		expect(reg.overrides?.fields).toBeInstanceOf(Function);
		expect(reg.hooks?.onDataChange).toBeInstanceOf(Function);
		expect(reg.hooks?.onBeforePublish).toBeInstanceOf(Function);
		expect(reg.hooks?.onDestroy).toBeInstanceOf(Function);
		expect(calls).toHaveLength(1);
		expect(typeof calls[0]?.render).toBe("function");
	});

	it("deep-merges host token overrides; the resolved tree flows to field renderers", () => {
		const plugin = createDesignSystemPlugin({
			tokens: { primitives: { brand: { 500: "#deadbeef" } } },
		});
		const reg = plugin.register({} as never);

		const field = createTokenColorField({ label: "Background" });
		const onChange = vi.fn();
		const renderResult = render(
			(
				reg.overrides as {
					fields: (p: {
						children: ReactNode;
						isLoading: boolean;
						itemSelector: null;
					}) => ReactNode;
				}
			).fields({
				children: field.render({
					field,
					name: "color",
					id: "color",
					value: "color.brand.500",
					onChange,
				}),
				isLoading: false,
				itemSelector: null,
			}) as React.ReactElement,
		);
		const swatch = renderResult.getByTestId("token-color-swatch");
		expect(swatch.style.background).toContain("--ak-ds-brand-500");
	});

	it("emits off-token warnings on data change and stays non-blocking", () => {
		const { ctx, log } = makeCtx();
		const plugin = createDesignSystemPlugin();
		const reg = plugin.register(ctx);
		expect(() =>
			reg.hooks?.onDataChange?.(ctx, {
				content: [
					{ type: "Card", props: { color: "#ff00aa", gap: "11px" } },
				],
			}),
		).not.toThrow();
		const warns = log.mock.calls.filter((c) => c[0] === "warn");
		expect(warns.length).toBeGreaterThanOrEqual(2);
	});

	it("aborts publish with StudioPluginError when contrast fails", () => {
		const { ctx } = makeCtx();
		const plugin = createDesignSystemPlugin({
			tokens: {
				primitives: {
					brand: { 500: "#888888" },
					neutral: { 50: "#aaaaaa" },
				},
			},
		});
		const reg = plugin.register(ctx);
		expect(() => reg.hooks?.onBeforePublish?.(ctx, lowContrastData)).toThrowError(
			StudioPluginError,
		);
	});

	it("does NOT abort publish when contrast passes", () => {
		const { ctx } = makeCtx();
		const plugin = createDesignSystemPlugin({
			tokens: {
				primitives: {
					brand: { 500: "#000000" },
					neutral: { 50: "#ffffff" },
				},
			},
		});
		const reg = plugin.register(ctx);
		expect(() =>
			reg.hooks?.onBeforePublish?.(ctx, integrationData),
		).not.toThrow();
	});

	it("disabling both validators turns the hooks off entirely", () => {
		const plugin = createDesignSystemPlugin({
			validation: { offToken: false, contrast: false },
		});
		const reg = plugin.register({} as never);
		expect(reg.hooks?.onDataChange).toBeUndefined();
		expect(reg.hooks?.onBeforePublish).toBeUndefined();
	});

	it("rail panel mounts the full DesignSystemPanel UI under TokenProvider", () => {
		const { ctx, calls } = makeCtx();
		const plugin = createDesignSystemPlugin();
		plugin.register(ctx);
		const { getByTestId } = render(
			<ThemeStoreProvider>{calls[0]?.render() as ReactNode}</ThemeStoreProvider>,
		);
		expect(getByTestId("design-system-panel")).toBeInTheDocument();
		expect(getByTestId("design-system-tab-tokens")).toHaveAttribute(
			"aria-selected",
			"true",
		);
		// Switch to Theme tab — confirms the panel is fully functional.
		fireEvent.click(getByTestId("design-system-tab-theme"));
		expect(getByTestId("design-system-panel-theme")).toBeInTheDocument();
	});

	it("onDestroy cleans up the panel registration", async () => {
		const { ctx, unregister } = makeCtx();
		const plugin = createDesignSystemPlugin();
		const reg = plugin.register(ctx);
		expect(unregister).not.toHaveBeenCalled();
		await reg.hooks?.onDestroy?.(ctx);
		expect(unregister).toHaveBeenCalledTimes(1);
	});

	it("the public barrel exports every documented v0.1 symbol", async () => {
		const mod = await import("../index.js");
		const symbols = [
			"createDesignSystemPlugin",
			"createTokenColorField",
			"createTokenSpacingField",
			"createTokenTypographyField",
			"DEFAULT_TOKENS",
			"emitTokensCss",
			"mergeTokens",
			"resolveTokenRef",
			"listTokenRefs",
			"TokenProvider",
			"useTokens",
			"useTokenContext",
			"useTokenValidationOptions",
		];
		for (const sym of symbols) {
			expect(mod, `missing export ${sym}`).toHaveProperty(sym);
		}
	});

	// Smoke render — uses the standalone TokenProvider (no Studio shell) to
	// prove the field factory + provider work without the override slot.
	it("field renders inside a manually-mounted TokenProvider", async () => {
		const { DEFAULT_TOKENS } = await import("../tokens/default-tokens.js");
		const field = createTokenColorField({ label: "Color" });
		const { getByTestId } = render(
			<TokenProvider
				value={{
					tokens: DEFAULT_TOKENS,
					validation: { offToken: true, contrast: true },
				}}
			>
				{field.render({
					field,
					name: "color",
					id: "color",
					value: "color.brand.500",
					onChange: vi.fn(),
				})}
			</TokenProvider>,
		);
		expect(getByTestId("token-color-swatch")).toBeInTheDocument();
	});
});
