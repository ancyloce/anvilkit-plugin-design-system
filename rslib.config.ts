import { pluginReact } from "@rsbuild/plugin-react";
import { defineConfig } from "@rslib/core";

/**
 * Bundleless build for `@anvilkit/plugin-design-system`.
 *
 * Each `.ts` under `src/` becomes an individual ESM + CJS output in
 * `dist/`, mirroring the other Studio plugins. `@anvilkit/core`,
 * `@puckeditor/core`, and `react` stay external so the plugin ships as
 * a thin headless wrapper that rides anvilkit's stable seams
 * (`compilePlugins`, `mergeOverrides`, sidebar-registry, lifecycle
 * hooks) rather than touching Puck's experimental APIs directly.
 */
export default defineConfig({
	source: {
		entry: {
			index: [
				"./src/**/*.{ts,tsx}",
				"!./src/**/*.{test,spec}.{ts,tsx}",
				"!./src/**/__tests__/**",
			],
		},
	},
	lib: [
		{
			bundle: false,
			dts: {
				autoExtension: true,
			},
			format: "esm",
		},
		{
			bundle: false,
			dts: {
				autoExtension: true,
			},
			format: "cjs",
		},
	],
	output: {
		target: "web",
		externals: ["@anvilkit/core", "@puckeditor/core", "react", "react-dom"],
	},
	plugins: [pluginReact()],
});
