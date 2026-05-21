/**
 * @file Factory: `createDesignSystemPlugin(opts)`.
 *
 * The factory returns a {@link StudioPlugin} with frozen metadata,
 * deep-merges host-supplied token overrides onto the bundled defaults,
 * stashes the resolved tree for tests, and wires the per-phase
 * registration:
 *
 *   - **Phase B (this revision):**
 *     - `overrides.fields` — wraps Puck's sidebar field tree in
 *       `<TokenProvider>` so token-bound `CustomField<string>` renders
 *       (produced by `createToken{Color,Spacing,Typography}Field`) can
 *       call `useTokens()` without consumers wrapping manually.
 *   - **Phase B follow-ups:**
 *     - `hooks.onDataChange` — non-blocking off-token warnings (B5).
 *     - `hooks.onBeforePublish` — sequential-abort on contrast/a11y
 *       failures (B6).
 *     - `ctx.registerDesignSystemPanel?(panel)` — the rail panel UI
 *       (B4).
 *
 * Token-bound field rendering is NOT registered through
 * `overrides.fieldTypes`: core's `defineFieldTypeRegistry` rejects
 * non-Puck-native keys (`color`/`spacing`/`typography`/`custom` are
 * intentionally absent — see
 * `packages/core/src/react/overrides/fields/field-types/index.ts:1-11`).
 * Instead the plugin exports `createToken{Color,Spacing,Typography}Field`
 * factories that return Puck `CustomField<string>` shapes consumers add
 * to their own `Config`.
 */

import { StudioPluginError } from "@anvilkit/core";
import type {
	StudioPlugin,
	StudioPluginLifecycleHooks,
} from "@anvilkit/core/types";

import config from "../meta/config.json";
import packageJson from "../package.json";
import type {
	DesignSystemOptions,
	DesignSystemPluginInternals,
	DesignSystemValidationOptions,
} from "./options.js";
import {
	buildDesignSystemOverrides,
	renderDesignSystemPanel,
} from "./plugin-overrides.js";
import { DEFAULT_TOKENS } from "./tokens/default-tokens.js";
import { mergeTokens } from "./tokens/merge-tokens.js";
import { findContrastFailures } from "./validation/contrast.js";
import { findOffTokenWarnings } from "./validation/off-token.js";

export type {
	DesignSystemOptions,
	DesignSystemPluginInternals,
	DesignSystemValidationOptions,
} from "./options.js";

const META = {
	...config,
	version: packageJson.version,
} as const;

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

	const internals: DesignSystemPluginInternals = Object.freeze({
		tokens,
		validation,
	});

	const plugin: StudioPlugin & {
		readonly __internals?: DesignSystemPluginInternals;
	} = {
		meta: META,
		register(ctx) {
			// Register the rail panel via the Phase-A core seam. Capture
			// the unregister handle for `onDestroy` cleanup so a remount
			// (or a host removing the plugin from the array) does not
			// leak the registration. Optional chaining: hand-written test
			// contexts may omit `registerDesignSystemPanel`; the runtime
			// always provides it on the live <Studio> ctx.
			let unregisterPanel: (() => void) | undefined;
			if (typeof ctx.registerDesignSystemPanel === "function") {
				unregisterPanel = ctx.registerDesignSystemPanel({
					render: () => renderDesignSystemPanel(internals),
				});
			}

			const onDestroy: NonNullable<
				StudioPluginLifecycleHooks["onDestroy"]
			> = () => {
				unregisterPanel?.();
				unregisterPanel = undefined;
			};

			// Non-blocking off-token guardrail. Walks every primitive leaf
			// in `data`, regex-matches color / length literals, and logs
			// one `warn` per literal that isn't in the resolved token
			// tree. The contract is "log only" (PRD §6.2) — per-warning
			// crashes propagate to `lifecycle-manager`, which catches via
			// `Promise.allSettled` (`packages/core/src/runtime/
			// lifecycle-manager.ts:451-475`).
			const onDataChange: NonNullable<
				StudioPluginLifecycleHooks["onDataChange"]
			> = (innerCtx, data) => {
				const warnings = findOffTokenWarnings(data, tokens);
				for (const w of warnings) {
					innerCtx.log("warn", w.message, {
						path: w.path,
						value: w.value,
						category: w.category,
						componentType: w.componentType,
						fieldKey: w.fieldKey,
					});
				}
			};

			// Sequential-abort WCAG-AA contrast gate. Walks every component's
			// fg/bg prop pairs against `DEFAULT_CONTRAST_PAIRS`, computes
			// the ratio against the resolved token values, and throws
			// `StudioPluginError` to abort publish if any pair fails. The
			// `lifecycle-manager`'s sequential dispatch
			// (`packages/core/src/runtime/lifecycle-manager.ts:558-583`)
			// propagates the error to the host as the publish-veto signal.
			const onBeforePublish: NonNullable<
				StudioPluginLifecycleHooks["onBeforePublish"]
			> = (_innerCtx, data) => {
				const failures = findContrastFailures(data, tokens);
				if (failures.length === 0) return;
				const summary =
					failures.length === 1
						? (failures[0]?.message ?? "Contrast failure")
						: `${failures.length} contrast pairs below AA threshold. First: ${
								failures[0]?.message ?? ""
							}`;
				throw new StudioPluginError(META.id, summary, {
					cause: { failures },
				});
			};

			const hooks: StudioPluginLifecycleHooks = {
				onDestroy,
				...(validation.offToken ? { onDataChange } : {}),
				...(validation.contrast ? { onBeforePublish } : {}),
			};

			return {
				meta: META,
				overrides: buildDesignSystemOverrides(internals),
				hooks,
			};
		},
	};

	// Stash the resolved tree so tests can inspect what the host
	// actually got. Not part of the public API.
	Object.defineProperty(plugin, "__internals", {
		enumerable: false,
		configurable: false,
		writable: false,
		value: internals,
	});

	return plugin;
}
