/**
 * @file Factory: `createTokenTypographyField`. Same shape as
 * {@link createTokenColorField} but bound to the `text.*` token
 * category (font-size scale).
 */

import type { CustomField } from "@puckeditor/core";

import { TokenFieldFrame } from "./TokenFieldFrame.js";

export interface CreateTokenTypographyFieldOptions {
	readonly label?: string;
	readonly defaultRef?: string;
}

export function createTokenTypographyField(
	opts: CreateTokenTypographyFieldOptions = {},
): CustomField<string> {
	const { label } = opts;
	return {
		type: "custom",
		label,
		render: ({ value, onChange, readOnly, id, name }) => (
			<TokenFieldFrame
				category="typography"
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
