import { compilePlugins } from "@anvilkit/core";
import { createFakeStudioContext } from "@anvilkit/core/testing";
import { describe, expect, it } from "vitest";

import packageJson from "../../package.json";
import {
	createDesignSystemPlugin,
	type DesignSystemPluginInternals,
} from "../plugin.js";
import { DEFAULT_TOKENS } from "../tokens/default-tokens.js";

function readInternals(
	plugin: ReturnType<typeof createDesignSystemPlugin>,
): DesignSystemPluginInternals {
	return (plugin as unknown as { __internals: DesignSystemPluginInternals })
		.__internals;
}

describe("createDesignSystemPlugin", () => {
	it("declares the expected meta block", () => {
		const plugin = createDesignSystemPlugin();
		expect(plugin.meta.id).toBe("anvilkit-plugin-design-system");
		expect(plugin.meta.name).toBe("Design System");
		expect(plugin.meta.version).toBe(packageJson.version);
		expect(plugin.meta.coreVersion).toBe("^0.1.0-alpha");
	});

	it("returns the bundled defaults when no options are supplied", () => {
		const plugin = createDesignSystemPlugin();
		expect(readInternals(plugin).tokens).toBe(DEFAULT_TOKENS);
	});

	it("deep-merges host token overrides onto DEFAULT_TOKENS", () => {
		const plugin = createDesignSystemPlugin({
			tokens: {
				primitives: { brand: { 500: "#abcdef" } },
				semantics: { accent: "brand.700" },
			},
		});
		const { tokens } = readInternals(plugin);

		expect(tokens.primitives.brand[500]).toBe("#abcdef");
		expect(tokens.primitives.brand[600]).toBe(
			DEFAULT_TOKENS.primitives.brand[600],
		);
		expect(tokens.semantics.accent).toBe("brand.700");
		expect(tokens.primitives.neutral).toBe(DEFAULT_TOKENS.primitives.neutral);
	});

	it("respects validation toggles (defaults to both on)", () => {
		expect(readInternals(createDesignSystemPlugin()).validation).toEqual({
			offToken: true,
			contrast: true,
		});
		expect(
			readInternals(
				createDesignSystemPlugin({ validation: { contrast: false } }),
			).validation,
		).toEqual({ offToken: true, contrast: false });
		expect(
			readInternals(
				createDesignSystemPlugin({
					validation: { offToken: false, contrast: false },
				}),
			).validation,
		).toEqual({ offToken: false, contrast: false });
	});

	it("loads through compilePlugins without errors (Phase-A no-op registration)", async () => {
		const plugin = createDesignSystemPlugin();
		const ctx = createFakeStudioContext();
		const runtime = await compilePlugins([plugin], ctx);

		expect(runtime.pluginMeta).toEqual(
			expect.arrayContaining([expect.objectContaining({ id: plugin.meta.id })]),
		);
	});
});
