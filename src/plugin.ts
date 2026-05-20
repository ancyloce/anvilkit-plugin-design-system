/**
 * @file Factory: `createDesignSystemPlugin(opts)`.
 *
 * Phase A scaffold — the factory returns a {@link StudioPlugin} with
 * frozen metadata, deep-merges host-supplied token overrides onto the
 * bundled defaults, and stashes the resolved tree for later phases.
 *
 * The Phase-A registration is a no-op (`register(ctx) → ({})`). Phase B
 * wires in:
 *
 *   - `overrides.fieldTypes` — token-bound `color` / `spacing` /
 *     `typography` field renderers.
 *   - `hooks.onDataChange` — non-blocking off-token warnings.
 *   - `hooks.onBeforePublish` — sequential-abort on contrast / a11y
 *     failures.
 *   - `ctx.registerDesignSystemPanel?(panel)` — the rail panel UI.
 *
 * Defining the factory now keeps the public surface stable while the
 * later phases land additive behaviour.
 */

import type { StudioPlugin } from "@anvilkit/core/types";

import packageJson from "../package.json";
import { DEFAULT_TOKENS } from "./tokens/default-tokens.js";
import { mergeTokens } from "./tokens/merge-tokens.js";
import type { DesignTokens, PartialDesignTokens } from "./tokens/types.js";

const META = {
	id: "anvilkit-plugin-design-system",
	name: "Design System",
	version: packageJson.version,
	coreVersion: "^0.1.0-alpha",
	description:
		"Token-bound fields, theme switching, and design validation through the `<Studio>` plugin contract.",
} as const;

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
 * Captured factory output exposed for tests + later-phase wiring.
 * Not part of the public plugin contract — internal scaffolding only.
 */
export interface DesignSystemPluginInternals {
	readonly tokens: DesignTokens;
	readonly validation: Required<DesignSystemValidationOptions>;
}

const DEFAULT_VALIDATION: Required<DesignSystemValidationOptions> = {
	offToken: true,
	contrast: true,
};

export function createDesignSystemPlugin(
	opts: DesignSystemOptions = {},
): StudioPlugin {
	const tokens = mergeTokens(DEFAULT_TOKENS, opts.tokens);
	const validation: Required<DesignSystemValidationOptions> = {
		offToken: opts.validation?.offToken ?? DEFAULT_VALIDATION.offToken,
		contrast: opts.validation?.contrast ?? DEFAULT_VALIDATION.contrast,
	};

	const plugin: StudioPlugin & {
		readonly __internals?: DesignSystemPluginInternals;
	} = {
		meta: META,
		register(_ctx) {
			return { meta: META };
		},
	};

	// Stash the resolved tree so tests + Phase-B follow-ups can inspect
	// what the host actually got. Not part of the public API; the
	// rename to a real registration in Phase B will replace this.
	Object.defineProperty(plugin, "__internals", {
		enumerable: false,
		configurable: false,
		writable: false,
		value: Object.freeze({ tokens, validation }),
	});

	return plugin;
}
