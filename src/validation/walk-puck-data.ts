/**
 * @file Traverse a Puck `Data` tree and yield every `{ path, value }`
 * pair so validators (off-token, contrast) can inspect raw component
 * props without each implementing its own recursion.
 *
 * Puck `Data` shape (`@puckeditor/core` types):
 *
 * ```ts
 * type Data = {
 *   root: { props?: object } & ...;
 *   content: Array<{ type, props: object }>;
 *   zones?: Record<string, Array<{ type, props: object }>>;
 * };
 * ```
 *
 * The walker visits every property under `root.props`, every
 * `content[i].props`, and every `zones[zoneKey][i].props`, recursing
 * into nested objects and arrays. Each visit yields the full property
 * path (`content[3].props.color`, `root.props.heading`, etc.) so
 * warnings can pinpoint the offending field.
 */

export interface WalkedValue {
	readonly path: string;
	readonly value: unknown;
	/** Component the value belongs to (e.g. `"Card"`, or `"root"` for the page root). */
	readonly componentType: string;
	/** Field id within the component (the first key under `props`). */
	readonly fieldKey: string;
}

interface ComponentNode {
	readonly type?: string;
	readonly props?: Record<string, unknown>;
}

interface PuckDataLike {
	readonly root?: ComponentNode;
	readonly content?: ReadonlyArray<ComponentNode>;
	readonly zones?: Record<string, ReadonlyArray<ComponentNode>>;
}

function* walkValue(
	value: unknown,
	path: string,
	componentType: string,
	fieldKey: string,
): Generator<WalkedValue> {
	if (value === null || value === undefined) {
		return;
	}
	if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i += 1) {
			yield* walkValue(value[i], `${path}[${i}]`, componentType, fieldKey);
		}
		return;
	}
	if (typeof value === "object") {
		for (const key of Object.keys(value as Record<string, unknown>)) {
			yield* walkValue(
				(value as Record<string, unknown>)[key],
				`${path}.${key}`,
				componentType,
				fieldKey,
			);
		}
		return;
	}
	// Primitive leaf (string / number / boolean / bigint / symbol).
	yield { path, value, componentType, fieldKey };
}

function* walkComponentProps(
	component: ComponentNode | undefined,
	pathPrefix: string,
	componentType: string,
): Generator<WalkedValue> {
	if (!component?.props) return;
	for (const key of Object.keys(component.props)) {
		yield* walkValue(
			component.props[key],
			`${pathPrefix}.props.${key}`,
			componentType,
			key,
		);
	}
}

/**
 * Yield every primitive leaf in a Puck `Data` tree along with its
 * dotted path and component context.
 */
export function* walkPuckData(data: PuckDataLike): Generator<WalkedValue> {
	yield* walkComponentProps(data.root, "root", "root");

	if (Array.isArray(data.content)) {
		for (let i = 0; i < data.content.length; i += 1) {
			const node = data.content[i];
			yield* walkComponentProps(node, `content[${i}]`, node?.type ?? "unknown");
		}
	}

	if (data.zones) {
		for (const zoneKey of Object.keys(data.zones)) {
			const zone = data.zones[zoneKey] ?? [];
			for (let i = 0; i < zone.length; i += 1) {
				const node = zone[i];
				yield* walkComponentProps(
					node,
					`zones["${zoneKey}"][${i}]`,
					node?.type ?? "unknown",
				);
			}
		}
	}
}
