/**
 * @file Public surface for `@anvilkit/plugin-design-system`.
 *
 * Phase A scaffold:
 *  - A4 (this revision): re-exports the React-free token surface
 *    (`DEFAULT_TOKENS`, `mergeTokens`, type tree).
 *  - A5: adds the `emitTokensCss` helper.
 *  - A6: adds the `createDesignSystemPlugin()` factory.
 *
 * The dedicated `./tokens` subpath stays the authoritative React-free
 * import — host build pipelines that want to avoid pulling React
 * resolutions during a pure-data import should keep using it.
 */

export {
	type CreateTokenColorFieldOptions,
	type CreateTokenSpacingFieldOptions,
	type CreateTokenTypographyFieldOptions,
	createTokenColorField,
	createTokenSpacingField,
	createTokenTypographyField,
} from "./fields/index";
export {
	createDesignSystemPlugin,
	type DesignSystemOptions,
	type DesignSystemValidationOptions,
} from "./plugin";
export {
	listTokenRefs,
	type ResolvedTokenRef,
	resolveTokenRef,
	type TokenCategory,
	type TokenContextValue,
	TokenProvider,
	type TokenProviderProps,
	type TokenRefKind,
	useTokenContext,
	useTokens,
	useTokenValidationOptions,
} from "./runtime/index";
export {
	type ColorRamp,
	type DarkPrimitiveOverrides,
	DEFAULT_TOKENS,
	type DesignTokens,
	type EmitTokensCssOptions,
	emitTokensCss,
	mergeTokens,
	type PartialDesignTokens,
	type PrimitiveTokens,
	type RadiusScale,
	type SemanticTokens,
	type SpacingScale,
	type TypographyScale,
} from "./tokens/index";
