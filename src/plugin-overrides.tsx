/**
 * @file Studio override slots contributed by `createDesignSystemPlugin()`.
 *
 * Lives in a `.tsx` module separate from `plugin.ts` so the factory
 * file can stay JSX-free. The plugin's `register(ctx)` calls
 * `buildDesignSystemOverrides(internals)` and returns the result via
 * its registration's `overrides` slot; `mergeOverrides` then composes
 * with any sibling plugin's contributions via the curried per-key
 * merge (`packages/core/src/react/overrides/merge-overrides.ts:208-225`).
 *
 * Today we only contribute `overrides.fields` — that slot wraps Puck's
 * sidebar field render tree, so a `<TokenProvider>` registered here
 * sits above every `CustomField` render fn produced by
 * `createTokenColorField` / `createTokenSpacingField` /
 * `createTokenTypographyField`. Consumers never need to mount
 * `<TokenProvider>` manually.
 */

import type { Overrides as PuckOverrides } from "@puckeditor/core";
import type { ReactElement, ReactNode } from "react";

import type { DesignSystemPluginInternals } from "./options.js";
import { DesignSystemPanel } from "./panel/DesignSystemPanel.js";
import { TokenProvider } from "./runtime/token-context.js";

type FieldsOverride = NonNullable<PuckOverrides["fields"]>;
type FieldsOverrideProps = Parameters<FieldsOverride>[0];

interface DesignSystemOverrideSlots {
	readonly fields: (props: FieldsOverrideProps) => ReactElement;
}

export function buildDesignSystemOverrides(
	internals: DesignSystemPluginInternals,
): DesignSystemOverrideSlots {
	const { tokens, validation } = internals;
	const contextValue = { tokens, validation };

	function Fields({ children }: { readonly children?: ReactNode }): ReactElement {
		return <TokenProvider value={contextValue}>{children}</TokenProvider>;
	}

	return {
		fields: ({ children }) => <Fields>{children}</Fields>,
	};
}

/**
 * Render thunk handed to `ctx.registerDesignSystemPanel?({ render })`.
 * Wraps the panel in a `<TokenProvider>` so its hooks (`useTokens` /
 * `listTokenRefs`) resolve without the panel needing to live inside
 * Puck's field tree.
 */
export function renderDesignSystemPanel(
	internals: DesignSystemPluginInternals,
): ReactElement {
	const { tokens, validation } = internals;
	return (
		<TokenProvider value={{ tokens, validation }}>
			<DesignSystemPanel />
		</TokenProvider>
	);
}
