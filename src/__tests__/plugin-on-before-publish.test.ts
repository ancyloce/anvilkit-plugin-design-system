import { StudioPluginError } from "@anvilkit/core";
import { describe, expect, it, vi } from "vitest";

import { createDesignSystemPlugin } from "../plugin.js";

function makeCtx() {
	const log = vi.fn();
	const ctx = {
		log,
		registerDesignSystemPanel: vi.fn(() => () => undefined),
	} as never;
	return { ctx, log };
}

// Tokens with hex primitives so contrast math can resolve (DEFAULT_TOKENS
// use oklch which v0.1 doesn't parse).
const lowContrastOptions = {
	tokens: {
		primitives: {
			brand: { 500: "#888888" },
			neutral: { 50: "#aaaaaa" },
		},
	},
};

const lowContrastData = {
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

describe("createDesignSystemPlugin — hooks.onBeforePublish (contrast)", () => {
	it("wires onBeforePublish when validation.contrast defaults to true", () => {
		const plugin = createDesignSystemPlugin();
		const reg = plugin.register({} as never);
		expect(typeof reg.hooks?.onBeforePublish).toBe("function");
	});

	it("does NOT wire onBeforePublish when validation.contrast is false", () => {
		const plugin = createDesignSystemPlugin({
			validation: { contrast: false },
		});
		const reg = plugin.register({} as never);
		expect(reg.hooks?.onBeforePublish).toBeUndefined();
	});

	it("does not throw when contrast passes", () => {
		const { ctx } = makeCtx();
		const plugin = createDesignSystemPlugin({
			tokens: {
				primitives: { brand: { 500: "#000000" }, neutral: { 50: "#ffffff" } },
			},
		});
		const reg = plugin.register(ctx);
		expect(() =>
			reg.hooks?.onBeforePublish?.(ctx, lowContrastData),
		).not.toThrow();
	});

	it("throws StudioPluginError when a pair is below AA", () => {
		const { ctx } = makeCtx();
		const plugin = createDesignSystemPlugin(lowContrastOptions);
		const reg = plugin.register(ctx);
		expect(() =>
			reg.hooks?.onBeforePublish?.(ctx, lowContrastData),
		).toThrowError(StudioPluginError);
	});

	it("attaches failures to error.cause for host inspection", () => {
		const { ctx } = makeCtx();
		const plugin = createDesignSystemPlugin(lowContrastOptions);
		const reg = plugin.register(ctx);
		try {
			reg.hooks?.onBeforePublish?.(ctx, lowContrastData);
			throw new Error("expected throw");
		} catch (err) {
			expect(err).toBeInstanceOf(StudioPluginError);
			const e = err as StudioPluginError;
			expect(e.pluginId).toBe("anvilkit-plugin-design-system");
			expect((e.cause as { failures: unknown[] }).failures).toBeDefined();
			expect((e.cause as { failures: unknown[] }).failures).toHaveLength(1);
		}
	});

	it("passes when validation.contrast is false even if a pair fails", () => {
		const { ctx } = makeCtx();
		const plugin = createDesignSystemPlugin({
			...lowContrastOptions,
			validation: { contrast: false },
		});
		const reg = plugin.register(ctx);
		expect(() =>
			reg.hooks?.onBeforePublish?.(ctx, lowContrastData),
		).not.toThrow();
	});

	it("aggregates multiple failures and reports the count in the summary", () => {
		const { ctx } = makeCtx();
		const plugin = createDesignSystemPlugin(lowContrastOptions);
		const reg = plugin.register(ctx);
		const data = {
			content: [
				{
					type: "Card",
					props: {
						color: "color.brand.500",
						backgroundColor: "color.neutral.50",
					},
				},
				{
					type: "Banner",
					props: {
						color: "color.brand.500",
						background: "color.neutral.50",
					},
				},
			],
		};
		try {
			reg.hooks?.onBeforePublish?.(ctx, data);
			throw new Error("expected throw");
		} catch (err) {
			expect((err as Error).message).toMatch(/^2 contrast pairs below AA/);
			expect(
				((err as Error).cause as { failures: unknown[] }).failures,
			).toHaveLength(2);
		}
	});
});
