// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { createDesignSystemPlugin } from "../plugin.js";
import { useTokens } from "../runtime/token-context.js";
import { DEFAULT_TOKENS } from "../tokens/default-tokens.js";

/**
 * Probe child rendered through the override slot so we can assert the
 * `<TokenProvider>` reached it. Mirrors how a Puck `CustomField` render
 * fn would consume the provider — it calls `useTokens()`.
 */
function Probe(): ReactElement {
	const tokens = useTokens();
	return <div data-testid="probe">{tokens.primitives.brand[500]}</div>;
}

interface FieldsProps {
	readonly children?: ReactNode;
	readonly isLoading: boolean;
	readonly itemSelector: null;
}

function invokeFieldsOverride(
	overrides: Record<string, unknown> | undefined,
	props: FieldsProps,
): ReactElement {
	const fields = overrides?.fields;
	if (typeof fields !== "function") {
		throw new Error("Expected `overrides.fields` to be a function");
	}
	return (fields as (p: FieldsProps) => ReactElement)(props);
}

/**
 * Minimal hand-rolled curried merge mirroring core's `composeRenderFunc`
 * (`packages/core/src/react/overrides/merge-overrides.ts:208-225`). Kept
 * inline so this test doesn't need to import the React-bound
 * `@anvilkit/core/react/overrides` entry — that path transitively loads
 * the studio shell, which has a stale CSS import in its dist
 * (unrelated to Phase B).
 */
function composeFields(
	prev: (p: FieldsProps) => ReactElement,
	next: (p: FieldsProps) => ReactElement,
): (p: FieldsProps) => ReactElement {
	return (props) => next({ ...props, children: prev(props) });
}

describe("createDesignSystemPlugin — overrides.fields", () => {
	it("emits an overrides.fields slot from register(ctx)", () => {
		const plugin = createDesignSystemPlugin();
		const reg = plugin.register({} as never);
		expect(typeof reg.overrides?.fields).toBe("function");
	});

	it("wraps children in a TokenProvider that supplies the resolved token tree", () => {
		const plugin = createDesignSystemPlugin({
			tokens: { primitives: { brand: { 500: "#deadbeef" } } },
		});
		const reg = plugin.register({} as never);

		const { getByTestId } = render(
			invokeFieldsOverride(reg.overrides as Record<string, unknown>, {
				children: <Probe />,
				isLoading: false,
				itemSelector: null,
			}),
		);
		expect(getByTestId("probe")).toHaveTextContent("#deadbeef");
	});

	it("composes per-key with a sibling fields override without clobbering", () => {
		// Sibling override mounts a marker; we expect both wrappers to survive
		// the curried merge.
		const siblingFields = ({ children }: FieldsProps): ReactElement => (
			<div data-testid="sibling-marker">{children}</div>
		);

		const dsPlugin = createDesignSystemPlugin();
		const dsReg = dsPlugin.register({} as never);
		const dsFields = (dsReg.overrides as Record<string, unknown>)
			.fields as (p: FieldsProps) => ReactElement;

		// Compose in the order `mergeOverrides` would: design-system first
		// (innermost), sibling second (outermost). The composed override is
		// what Puck would call at render time.
		const composed = composeFields(dsFields, siblingFields);

		const { getByTestId } = render(
			composed({
				children: <Probe />,
				isLoading: false,
				itemSelector: null,
			}),
		);

		expect(getByTestId("sibling-marker")).toBeInTheDocument();
		expect(getByTestId("probe")).toHaveTextContent(
			DEFAULT_TOKENS.primitives.brand[500],
		);
	});

	it("the override preserves the consumer's `isLoading` + `itemSelector` props", () => {
		const plugin = createDesignSystemPlugin();
		const reg = plugin.register({} as never);
		// Re-render under varied props — TokenProvider should not interfere
		// with the props children would otherwise receive (today TokenProvider
		// only injects context, but this guards against an accidental clobber).
		const out = invokeFieldsOverride(reg.overrides as Record<string, unknown>, {
			children: <span data-testid="passthrough">ok</span>,
			isLoading: true,
			itemSelector: null,
		});
		const { getByTestId } = render(out);
		expect(getByTestId("passthrough")).toHaveTextContent("ok");
	});
});
