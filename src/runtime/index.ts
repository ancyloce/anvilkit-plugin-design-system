/**
 * @file Public surface for `@anvilkit/plugin-design-system/runtime`.
 *
 * Token resolution helpers + React context. Consumed by the field
 * factories (B2), the design-system panel (B4), and the validation
 * hooks (B5/B6). Hosts that build their own design-system surfaces on
 * top of the plugin's token tree can import from here too.
 */

export {
	listTokenRefs,
	type ResolvedTokenRef,
	resolveTokenRef,
	type TokenRefKind,
} from "./resolve-ref.js";
export {
	COLOR_CATEGORIES,
	SPACING_CATEGORIES,
	TOKEN_CATEGORIES,
	type TokenCategory,
	TYPOGRAPHY_CATEGORIES,
} from "./token-categories.js";
export {
	type TokenContextValue,
	TokenProvider,
	type TokenProviderProps,
	useTokenContext,
	useTokens,
	useTokenValidationOptions,
} from "./token-context.js";
