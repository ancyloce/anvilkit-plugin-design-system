/**
 * @file Public surface for `@anvilkit/plugin-design-system/runtime`.
 *
 * Token resolution helpers + React context. Consumed by the field
 * factories (B2), the design-system panel (B4), and the validation
 * hooks (B5/B6). Hosts that build their own design-system surfaces on
 * top of the plugin's token tree can import from here too.
 */

export {
	COLOR_CATEGORIES,
	SPACING_CATEGORIES,
	TOKEN_CATEGORIES,
	TYPOGRAPHY_CATEGORIES,
	type TokenCategory,
} from "./token-categories.js";
export {
	TokenProvider,
	type TokenContextValue,
	type TokenProviderProps,
	useTokenContext,
	useTokens,
	useTokenValidationOptions,
} from "./token-context.js";
export {
	listTokenRefs,
	resolveTokenRef,
	type ResolvedTokenRef,
	type TokenRefKind,
} from "./resolve-ref.js";
