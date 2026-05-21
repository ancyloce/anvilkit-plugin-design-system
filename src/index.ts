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
	createDesignSystemPlugin,
	type DesignSystemOptions,
	type DesignSystemValidationOptions,
} from "./plugin";
export {
	createTokenColorField,
	type CreateTokenColorFieldOptions,
	createTokenSpacingField,
	type CreateTokenSpacingFieldOptions,
	createTokenTypographyField,
	type CreateTokenTypographyFieldOptions,
} from "./fields/index";
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
	emitTokensCss,
	type EmitTokensCssOptions,
	mergeTokens,
	type PartialDesignTokens,
	type PrimitiveTokens,
	type RadiusScale,
	type SemanticTokens,
	type SpacingScale,
	type TypographyScale,
} from "./tokens/index";
