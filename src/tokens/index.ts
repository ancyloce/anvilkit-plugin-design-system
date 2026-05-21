/**
 * @file Barrel for the design-token surface — the React-free entry
 * point exposed at `@anvilkit/plugin-design-system/tokens`.
 *
 * Hosts that want to consume the bundled defaults (or the merge
 * helper) without pulling in React can import from here.
 */

export { DEFAULT_TOKENS } from "./default-tokens.js";
export { type EmitTokensCssOptions, emitTokensCss } from "./emit-css.js";
export { mergeTokens } from "./merge-tokens.js";
export type {
	ColorRamp,
	DarkPrimitiveOverrides,
	DesignTokens,
	PartialDesignTokens,
	PrimitiveTokens,
	RadiusScale,
	SemanticTokens,
	SpacingScale,
	TypographyScale,
} from "./types.js";
