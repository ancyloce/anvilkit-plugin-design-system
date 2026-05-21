// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { DEFAULT_TOKENS } from "../../tokens/default-tokens.js";
import {
	TokenProvider,
	type TokenContextValue,
	useTokenContext,
	useTokens,
	useTokenValidationOptions,
} from "../token-context.js";

function makeValue(
	overrides: Partial<TokenContextValue> = {},
): TokenContextValue {
	return {
		tokens: DEFAULT_TOKENS,
		validation: { offToken: true, contrast: true },
		...overrides,
	};
}

function wrapper(value: TokenContextValue): (props: { children: ReactNode }) => ReactNode {
	return ({ children }) => <TokenProvider value={value}>{children}</TokenProvider>;
}

describe("TokenProvider + hooks", () => {
	it("supplies the resolved token tree to useTokens()", () => {
		const value = makeValue();
		const { result } = renderHook(() => useTokens(), {
			wrapper: wrapper(value),
		});
		expect(result.current).toBe(DEFAULT_TOKENS);
	});

	it("supplies validation toggles to useTokenValidationOptions()", () => {
		const value = makeValue({
			validation: { offToken: false, contrast: true },
		});
		const { result } = renderHook(() => useTokenValidationOptions(), {
			wrapper: wrapper(value),
		});
		expect(result.current).toEqual({ offToken: false, contrast: true });
	});

	it("supplies the full value via useTokenContext()", () => {
		const value = makeValue();
		const { result } = renderHook(() => useTokenContext(), {
			wrapper: wrapper(value),
		});
		expect(result.current).toBe(value);
	});

	it("throws a descriptive error when useTokens() runs outside a provider", () => {
		expect(() => renderHook(() => useTokens())).toThrow(
			/useTokens\(\) was called outside <TokenProvider>/,
		);
	});

	it("throws when useTokenValidationOptions() runs outside a provider", () => {
		expect(() =>
			renderHook(() => useTokenValidationOptions()),
		).toThrow(/useTokenValidationOptions\(\) was called outside <TokenProvider>/);
	});

	it("renders children inside <TokenProvider>", () => {
		const { getByText } = render(
			<TokenProvider value={makeValue()}>
				<div>hello tokens</div>
			</TokenProvider>,
		);
		expect(getByText("hello tokens")).toBeInTheDocument();
	});
});
