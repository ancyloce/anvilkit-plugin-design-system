import { describe, expect, it } from "vitest";

import { walkPuckData } from "../walk-puck-data.js";

describe("walkPuckData", () => {
	it("yields no leaves for an empty data tree", () => {
		const leaves = Array.from(walkPuckData({ content: [] }));
		expect(leaves).toEqual([]);
	});

	it("walks root.props leaves", () => {
		const leaves = Array.from(
			walkPuckData({
				root: { props: { title: "Hello", colour: "#abc" } },
				content: [],
			}),
		);
		expect(leaves).toEqual([
			{
				path: "root.props.title",
				value: "Hello",
				componentType: "root",
				fieldKey: "title",
			},
			{
				path: "root.props.colour",
				value: "#abc",
				componentType: "root",
				fieldKey: "colour",
			},
		]);
	});

	it("walks content[i].props leaves and captures component type", () => {
		const leaves = Array.from(
			walkPuckData({
				content: [
					{ type: "Card", props: { color: "color.brand.500" } },
					{ type: "Banner", props: { padding: "16px" } },
				],
			}),
		);
		expect(leaves).toEqual([
			{
				path: "content[0].props.color",
				value: "color.brand.500",
				componentType: "Card",
				fieldKey: "color",
			},
			{
				path: "content[1].props.padding",
				value: "16px",
				componentType: "Banner",
				fieldKey: "padding",
			},
		]);
	});

	it("recurses into nested arrays and objects under props", () => {
		const leaves = Array.from(
			walkPuckData({
				content: [
					{
						type: "Card",
						props: {
							style: { background: "#abc", border: { color: "#def" } },
							items: ["alpha", "beta"],
						},
					},
				],
			}),
		);
		expect(leaves.map((l) => l.path)).toEqual([
			"content[0].props.style.background",
			"content[0].props.style.border.color",
			"content[0].props.items[0]",
			"content[0].props.items[1]",
		]);
		expect(leaves[0]?.fieldKey).toBe("style");
		expect(leaves[2]?.fieldKey).toBe("items");
	});

	it("walks zones recursively", () => {
		const leaves = Array.from(
			walkPuckData({
				content: [],
				zones: {
					"my-zone": [
						{ type: "Slot", props: { label: "left" } },
						{ type: "Slot", props: { label: "right" } },
					],
				},
			}),
		);
		expect(leaves).toEqual([
			{
				path: 'zones["my-zone"][0].props.label',
				value: "left",
				componentType: "Slot",
				fieldKey: "label",
			},
			{
				path: 'zones["my-zone"][1].props.label',
				value: "right",
				componentType: "Slot",
				fieldKey: "label",
			},
		]);
	});

	it("skips null / undefined leaves", () => {
		const leaves = Array.from(
			walkPuckData({
				content: [{ type: "Card", props: { color: null, label: undefined } }],
			}),
		);
		expect(leaves).toEqual([]);
	});

	it("yields number / boolean primitives", () => {
		const leaves = Array.from(
			walkPuckData({
				content: [{ type: "Card", props: { count: 5, enabled: true } }],
			}),
		);
		expect(leaves).toEqual([
			{
				path: "content[0].props.count",
				value: 5,
				componentType: "Card",
				fieldKey: "count",
			},
			{
				path: "content[0].props.enabled",
				value: true,
				componentType: "Card",
				fieldKey: "enabled",
			},
		]);
	});
});
