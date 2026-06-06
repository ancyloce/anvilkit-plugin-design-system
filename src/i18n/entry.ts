/**
 * @file The `designSystem` registry entry (pure data — no React) plus the
 * `AnvilkitMessages` type augmentation.
 *
 * Message content lives in `i18n/messages/<locale>.json`; English ships
 * inline and other locales lazy-load. The plugin has no standalone `./ui`
 * subpath — its panel + token fields always render in-chrome under core's
 * `EditorI18nProvider`, where `register()` contributes this entry. Tests
 * wrap renders in `EditorI18nProvider entries={[DESIGN_SYSTEM_ENTRY]}`.
 */

import type { RegistryEntry } from "@anvilkit/core/i18n";

// Messages live at the plugin-root `i18n/messages/` (shipped via the package
// `files`). Imported from outside `src/` so the bundleless rslib build keeps
// them external `.json` (an in-`src` import is rewritten to `.js` and not
// emitted) — same pattern as `meta/config.json`.
import enMessages from "../../i18n/messages/en.json" with { type: "json" };

/** Static lazy-pack map (avoids a dynamic template `import()` under rslib). */
const LOCALE_PACKS: Readonly<
	Record<string, () => Promise<{ readonly default: Record<string, string> }>>
> = {
	zh: () => import("../../i18n/messages/zh.json", { with: { type: "json" } }),
};

/** The registry entry contributed to the catalog (core prepends `studio.*`). */
export const DESIGN_SYSTEM_ENTRY: RegistryEntry = {
	namespace: "designSystem",
	en: enMessages,
	loadMessages: async (locale) => {
		const pack = LOCALE_PACKS[locale];
		return pack === undefined ? {} : (await pack()).default;
	},
};

/** Exact key union for the `AnvilkitMessages` augmentation. */
export type DesignSystemMessageKey = keyof typeof enMessages;

// Augment the public key registry so `useT("designSystem.*")` autocompletes.
declare module "@anvilkit/core/i18n" {
	interface AnvilkitMessages extends Record<DesignSystemMessageKey, string> {}
}
