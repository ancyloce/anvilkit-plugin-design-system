/**
 * @file React context that exposes the resolved {@link DesignTokens}
 * tree + validation toggles to every plugin-rendered surface (fields,
 * panel, future validators).
 *
 * `createDesignSystemPlugin().register(ctx)` wraps Puck's field-render
 * subtree in `<TokenProvider>` so consumers never have to mount the
 * provider themselves. The hooks throw a descriptive error if used
 * outside a provider — that proves a misconfigured mount (e.g. a host
 * forgot to add the plugin to `<Studio plugins={…}>`) fails loud
 * instead of silently rendering empty swatches.
 */

import {
	createContext,
	type PropsWithChildren,
	type ReactElement,
	use,
} from "react";

import type { DesignSystemValidationOptions } from "../options.js";
import type { DesignTokens } from "../tokens/types.js";

export interface TokenContextValue {
	readonly tokens: DesignTokens;
	readonly validation: Required<DesignSystemValidationOptions>;
}

const TokenContext = createContext<TokenContextValue | null>(null);

export interface TokenProviderProps {
	readonly value: TokenContextValue;
}

export function TokenProvider({
	value,
	children,
}: PropsWithChildren<TokenProviderProps>): ReactElement {
	return (
		<TokenContext value={value}>{children}</TokenContext>
	);
}

function useRequiredTokenContext(hookName: string): TokenContextValue {
	const value = use(TokenContext);
	if (value === null) {
		throw new Error(
			`@anvilkit/plugin-design-system: ${hookName}() was called outside <TokenProvider>. ` +
				"Ensure createDesignSystemPlugin() is included in <Studio plugins={[…]} /> " +
				"so the provider is mounted above your token-bound fields.",
		);
	}
	return value;
}

/** Resolved token tree from the nearest `<TokenProvider>`. */
export function useTokens(): DesignTokens {
	return useRequiredTokenContext("useTokens").tokens;
}

/** Validation toggles (mirrors `DesignSystemOptions.validation`). */
export function useTokenValidationOptions(): Required<DesignSystemValidationOptions> {
	return useRequiredTokenContext("useTokenValidationOptions").validation;
}

/** Full context value — primarily useful for tests and the panel UI. */
export function useTokenContext(): TokenContextValue {
	return useRequiredTokenContext("useTokenContext");
}
