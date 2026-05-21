/**
 * @file Factory: `createTokenColorField`.
 *
 * Returns a Puck `CustomField<string>` that stores a token ref string
 * (e.g. `"color.brand.500"`, `"semantic.bg"`). Consumers add the
 * returned field to their Puck `Config`:
 *
 * ```ts
 * const Config = {
 *   components: {
 *     Card: {
 *       fields: {
 *         color: createTokenColorField({ label: "Surface color" }),
 *       },
 *       render: ({ color }) => <div style={{ background: `var(${color})` }} />,
 *     },
 *   },
 * };
 * ```
 *
 * The field renderer reads the token tree from `<TokenProvider>` — that
 * provider is mounted automatically by `createDesignSystemPlugin()` so
 * the host never needs to wrap manually (B3).
 */

import type { CustomField } from "@puckeditor/core";

import { TokenFieldFrame } from "./TokenFieldFrame.js";

export interface CreateTokenColorFieldOptions {
	/** Label shown above the field in the Puck sidebar. */
	readonly label?: string;
	/**
	 * Default ref string applied when Puck instantiates the field with
	 * no value. Stored verbatim — no validation at factory time.
	 */
	readonly defaultRef?: string;
}

export function createTokenColorField(
	opts: CreateTokenColorFieldOptions = {},
): CustomField<string> {
	const { label } = opts;
	return {
		type: "custom",
		label,
		render: ({ value, onChange, readOnly, id, name }) => (
			<TokenFieldFrame
				category="color"
				value={value ?? ""}
				onChange={onChange}
				readOnly={readOnly}
				label={label}
				id={id}
				name={name}
			/>
		),
	};
}
