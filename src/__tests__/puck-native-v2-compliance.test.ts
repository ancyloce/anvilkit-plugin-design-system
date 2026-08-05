/**
 * @file PLAN-0025 Phase 3.5 (P3.5-01) — Puck-native v2 compliance.
 *
 * The §12 Phase 3.5 exit gate: no plugin reads or writes
 * `root.props.__anvilkit` or issues sidecar editor commands. This
 * plugin never had a persisted token/theme edit path (tokens are
 * static factory options; the panel displays and copies refs, and the
 * validation hooks only READ documents), so the adaptation the plan
 * sketched reduces to locking that compliance in CI:
 *
 * 1. a source scan proving no sidecar/editor-command API is referenced
 *    anywhere in `src/` (the per-package enforcement of plan §15
 *    gate 3);
 * 2. the document-reading validation walker handling a Puck-native v2
 *    document — appearance-carrying node props, nested slots, and the
 *    `designSystem` root prop — without crashing or misreading paths.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { walkPuckData } from "../validation/walk-puck-data.js";

const FORBIDDEN = [
	"__anvilkit",
	"readAuthoringState",
	"writeAuthoringState",
	"ANVILKIT_AUTHORING_KEY",
	"EditorCommandPort",
	"applyEditorCommand",
	'"replaceRoot"',
] as const;

function sourceFiles(dir: string): string[] {
	const files: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "__tests__") continue;
			files.push(...sourceFiles(path));
			continue;
		}
		if (/\.(ts|tsx)$/.test(entry.name)) files.push(path);
	}
	return files;
}

describe("Puck-native v2 compliance (P3.5-01)", () => {
	it("no source file references the sidecar or sidecar editor commands", () => {
		const offenders: string[] = [];
		for (const file of sourceFiles(join(__dirname, ".."))) {
			const source = readFileSync(file, "utf8");
			for (const marker of FORBIDDEN) {
				if (source.includes(marker)) offenders.push(`${file}: ${marker}`);
			}
		}
		expect(offenders).toEqual([]);
	});

	it("the validation walker traverses a v2 document without touching authoring internals", () => {
		const v2Document = {
			content: [
				{
					type: "Hero",
					props: {
						id: "hero-1",
						headline: "color.blue.500",
						appearance: {
							version: "1",
							targets: {
								root: { style: { base: { layout: { display: "flex" } } } },
							},
						},
						body: [
							{
								type: "Button",
								props: { id: "btn-1", label: "semantic.primary" },
							},
						],
					},
				},
			],
			root: {
				props: {
					title: "Page",
					designSystem: {
						version: "1",
						breakpoints: [],
						tokens: {},
						tokenModes: { light: { id: "light", name: "Light" } },
						defaultTokenMode: "light",
						styleDefinitions: {},
					},
				},
			},
			zones: {},
		};

		const visited: string[] = [];
		for (const walked of walkPuckData(v2Document)) {
			if (typeof walked.value === "string") visited.push(walked.path);
		}

		// Business props are visited with readable paths…
		expect(visited.some((path) => path.includes("headline"))).toBe(true);
		// …the v2 root prop is walkable data like any other…
		expect(visited.some((path) => path.includes("designSystem"))).toBe(true);
		// …and nothing resembles a sidecar path.
		expect(visited.every((path) => !path.includes("__anvilkit"))).toBe(true);
	});
});
