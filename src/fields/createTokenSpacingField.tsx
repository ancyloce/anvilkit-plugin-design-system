/**
 * @file Factory: `createTokenSpacingField`. Same shape as
 * {@link createTokenColorField} but bound to the `space.*` token
 * category.
 */

import type { CustomField } from "@puckeditor/core";

import { TokenFieldFrame } from "./TokenFieldFrame.js";

export interface CreateTokenSpacingFieldOptions {
	readonly label?: string;
	readonly defaultRef?: string;
}

export function createTokenSpacingField(
	opts: CreateTokenSpacingFieldOptions = {},
): CustomField<string> {
	const { label } = opts;
	return {
		type: "custom",
		label,
		render: ({ value, onChange, readOnly, id, name }) => (
			<TokenFieldFrame
				category="spacing"
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
