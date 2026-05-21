/**
 * @file Shared option types for `createDesignSystemPlugin`.
 *
 * Lives in its own module so types referenced by the runtime context
 * (`runtime/token-context.tsx`) don't form a cycle back to `plugin.ts`
 * via the panel → plugin-overrides → plugin chain.
 */

import type { DesignTokens, PartialDesignTokens } from "./tokens/types.js";

export interface DesignSystemValidationOptions {
	/** Emit non-blocking warnings when component data uses non-token values. Defaults to `true`. */
	readonly offToken?: boolean;
	/** Abort publish on WCAG-AA contrast failure. Defaults to `true`. */
	readonly contrast?: boolean;
}

export interface DesignSystemOptions {
	/** Host overrides — deep-merged onto the bundled `DEFAULT_TOKENS`. */
	readonly tokens?: PartialDesignTokens;
	/** Toggles for the lifecycle validators landed in Phase B. */
	readonly validation?: DesignSystemValidationOptions;
}

/**
 * Captured factory output passed to the override + panel builders.
 * Not part of the public plugin contract — internal scaffolding only.
 */
export interface DesignSystemPluginInternals {
	readonly tokens: DesignTokens;
	readonly validation: Required<DesignSystemValidationOptions>;
}
