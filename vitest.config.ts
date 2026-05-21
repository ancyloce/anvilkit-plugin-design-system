import { nodePreset } from "@anvilkit/vitest-config/node";
import { defineConfig, mergeConfig } from "vitest/config";

/**
 * Default to the React-free node preset so pure-data tests (tokens,
 * validation, lifecycle hooks) run fast and without DOM bootstrap
 * surprises. React component tests opt into jsdom per-file with the
 * `// @vitest-environment jsdom` directive, mirroring the pattern in
 * `plugin-collab-ui`'s `plugin.test.tsx`.
 *
 * `@testing-library/jest-dom/vitest` is loaded only for jsdom tests
 * via a per-file import; this keeps the node-test path clean while
 * still letting the React context test use `toBeInTheDocument`.
 */
export default mergeConfig(
	nodePreset,
	defineConfig({
		test: {
			name: "@anvilkit/plugin-design-system",
			passWithNoTests: true,
			// The node preset's `include` pattern only matches `.ts`. The
			// runtime + future panel/field tests are `.tsx` because they
			// render React; the `// @vitest-environment jsdom` directive
			// at the top of each .tsx test file flips to jsdom for that
			// file only.
			include: [
				"src/**/*.{test,spec}.{ts,tsx}",
				"src/**/__tests__/**/*.{test,spec}.{ts,tsx}",
			],
			setupFiles: ["./src/__tests__/setup-react.ts"],
		},
	}),
);
