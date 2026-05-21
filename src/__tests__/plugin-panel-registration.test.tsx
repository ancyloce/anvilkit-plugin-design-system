// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { describe, expect, it, vi } from "vitest";

import { createDesignSystemPlugin } from "../plugin.js";

interface PanelRegistration {
	readonly render: () => unknown;
}

function makeCtx() {
	const calls: PanelRegistration[] = [];
	const unregister = vi.fn();
	const registerDesignSystemPanel = vi.fn((panel: PanelRegistration) => {
		calls.push(panel);
		return unregister;
	});
	return {
		calls,
		unregister,
		registerDesignSystemPanel,
		ctx: { registerDesignSystemPanel } as never,
	};
}

describe("createDesignSystemPlugin — panel registration", () => {
	it("calls ctx.registerDesignSystemPanel with a render thunk", () => {
		const { ctx, registerDesignSystemPanel, calls } = makeCtx();
		const plugin = createDesignSystemPlugin();
		plugin.register(ctx);
		expect(registerDesignSystemPanel).toHaveBeenCalledTimes(1);
		expect(typeof calls[0]?.render).toBe("function");
	});

	it("returns an onDestroy hook that calls the captured unregister", async () => {
		const { ctx, unregister } = makeCtx();
		const plugin = createDesignSystemPlugin();
		const reg = plugin.register(ctx);
		expect(unregister).not.toHaveBeenCalled();
		await reg.hooks?.onDestroy?.(ctx);
		expect(unregister).toHaveBeenCalledTimes(1);
	});

	it("onDestroy is idempotent — calling twice does not re-invoke unregister", async () => {
		const { ctx, unregister } = makeCtx();
		const plugin = createDesignSystemPlugin();
		const reg = plugin.register(ctx);
		await reg.hooks?.onDestroy?.(ctx);
		await reg.hooks?.onDestroy?.(ctx);
		expect(unregister).toHaveBeenCalledTimes(1);
	});

	it("skips registration when ctx.registerDesignSystemPanel is undefined", () => {
		const ctx = {} as never;
		const plugin = createDesignSystemPlugin();
		const reg = plugin.register(ctx);
		// onDestroy should still be callable as a no-op (no panel was
		// registered, so the captured unregister is undefined).
		expect(() => reg.hooks?.onDestroy?.(ctx)).not.toThrow();
	});

	it("render thunk returns a React element each call", () => {
		const { ctx, calls } = makeCtx();
		const plugin = createDesignSystemPlugin();
		plugin.register(ctx);
		const out = calls[0]?.render();
		expect(out).toBeDefined();
		// React element shape — has $$typeof + props.
		expect((out as { $$typeof?: symbol }).$$typeof).toBeDefined();
	});
});
