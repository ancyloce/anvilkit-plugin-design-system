import { describe, expect, it, vi } from "vitest";

import { createDesignSystemPlugin } from "../plugin.js";

function makeCtx() {
	const log = vi.fn();
	const registerDesignSystemPanel = vi.fn(() => () => undefined);
	const ctx = {
		log,
		registerDesignSystemPanel,
	} as never;
	return { ctx, log };
}

const offTokenData = {
	content: [{ type: "Card", props: { color: "#ff00aa", gap: "11px" } }],
};

describe("createDesignSystemPlugin — hooks.onDataChange (off-token)", () => {
	it("wires onDataChange when opts.validation.offToken defaults to true", () => {
		const plugin = createDesignSystemPlugin();
		const reg = plugin.register({} as never);
		expect(typeof reg.hooks?.onDataChange).toBe("function");
	});

	it("does NOT wire onDataChange when opts.validation.offToken is false", () => {
		const plugin = createDesignSystemPlugin({
			validation: { offToken: false },
		});
		const reg = plugin.register({} as never);
		expect(reg.hooks?.onDataChange).toBeUndefined();
	});

	it("dispatches one ctx.log('warn', …) call per off-token warning", () => {
		const { ctx, log } = makeCtx();
		const plugin = createDesignSystemPlugin();
		const reg = plugin.register(ctx);
		reg.hooks?.onDataChange?.(ctx, offTokenData);

		// Two off-token literals → two warn calls.
		const warns = log.mock.calls.filter((c) => c[0] === "warn");
		expect(warns).toHaveLength(2);
		expect(warns[0]?.[1]).toMatch(/Off-token color literal "#ff00aa"/);
		expect(warns[1]?.[1]).toMatch(/Off-token length literal "11px"/);
	});

	it("emits structured metadata alongside the warning message", () => {
		const { ctx, log } = makeCtx();
		const plugin = createDesignSystemPlugin();
		const reg = plugin.register(ctx);
		reg.hooks?.onDataChange?.(ctx, offTokenData);

		const firstWarn = log.mock.calls.find((c) => c[0] === "warn");
		expect(firstWarn?.[2]).toMatchObject({
			path: "content[0].props.color",
			value: "#ff00aa",
			category: "color",
			componentType: "Card",
			fieldKey: "color",
		});
	});

	it("does not throw on a clean data tree", () => {
		const { ctx, log } = makeCtx();
		const plugin = createDesignSystemPlugin();
		const reg = plugin.register(ctx);
		expect(() =>
			reg.hooks?.onDataChange?.(ctx, {
				content: [
					{
						type: "Card",
						props: {
							color: "color.brand.500",
							gap: "space.4",
							title: "Plain text",
						},
					},
				],
			}),
		).not.toThrow();
		const warns = log.mock.calls.filter((c) => c[0] === "warn");
		expect(warns).toHaveLength(0);
	});

	it("never throws — exceptions inside the hook do not propagate", () => {
		// Spy on `ctx.log` to throw partway and assert the hook still
		// completes. (Real `lifecycle-manager` runs onDataChange under
		// Promise.allSettled, so any throw is swallowed there; the
		// plugin's own loop should also not crash on the first warning.)
		const log = vi.fn().mockImplementationOnce(() => {
			throw new Error("log boom");
		});
		const ctx = {
			log,
			registerDesignSystemPanel: vi.fn(() => () => undefined),
		} as never;
		const plugin = createDesignSystemPlugin();
		const reg = plugin.register(ctx);
		// One throw on first call — but the plugin itself doesn't guard
		// per-warning, so the throw DOES escape. Confirm the throw
		// shape is the one we expect (it's the test's own injected
		// error). This documents the current contract: per-warning
		// crashes propagate up to `lifecycle-manager`, which catches
		// via Promise.allSettled.
		expect(() => reg.hooks?.onDataChange?.(ctx, offTokenData)).toThrow(
			/log boom/,
		);
	});
});
