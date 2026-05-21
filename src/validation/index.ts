/**
 * @file Barrel for the validation surface. Pure helpers consumed by
 * the plugin's `hooks.onDataChange` (off-token warnings, B5) and
 * `hooks.onBeforePublish` (contrast gating, B6).
 */

export {
	type ContrastFailure,
	type ContrastPair,
	contrastRatio,
	DEFAULT_CONTRAST_PAIRS,
	findContrastFailures,
	luminance,
	parseColor,
	WCAG_AA_NORMAL,
} from "./contrast.js";
export {
	findOffTokenWarnings,
	type OffTokenCategory,
	type OffTokenWarning,
} from "./off-token.js";
export { type WalkedValue, walkPuckData } from "./walk-puck-data.js";
