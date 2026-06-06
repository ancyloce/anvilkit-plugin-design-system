/**
 * @file Shared chrome wrapper for token-bound fields.
 *
 * Internal — the three public field factories (`createTokenColorField`,
 * `createTokenSpacingField`, `createTokenTypographyField`) each delegate
 * their `render` to this component so the label + swatch + dropdown
 * layout stays consistent and the dropdown-population logic lives in
 * one place. Not exported from the public barrel; consumers compose
 * field factories, not the frame itself.
 *
 * The frame stores a single ref string (e.g. `"color.brand.500"`,
 * `"semantic.bg"`, `"space.4"`, `"text.lg"`) and renders a preview that
 * resolves through `--ak-ds-*` so theme switches flow through CSS
 * rather than JS state.
 */

import { useMsg } from "@anvilkit/core/i18n";
import type { ReactElement } from "react";

import { listTokenRefs, resolveTokenRef } from "../runtime/resolve-ref.js";
import { useTokens } from "../runtime/token-context.js";
import type { TokenRefKind } from "../runtime/resolve-ref.js";

export type TokenFieldCategory = "color" | "spacing" | "typography";

const CATEGORY_KINDS: Record<TokenFieldCategory, ReadonlySet<TokenRefKind>> = {
	color: new Set<TokenRefKind>(["color", "semantic"]),
	spacing: new Set<TokenRefKind>(["space"]),
	typography: new Set<TokenRefKind>(["text"]),
};

const PREVIEW_BOX = "32px";
const SPACING_PREVIEW_MAX = "96px";

const containerStyle = {
	display: "flex",
	flexDirection: "column" as const,
	gap: "6px",
	fontFamily: "inherit",
	fontSize: "12px",
	color: "var(--ak-ds-fg, var(--ak-studio-fg))",
};

const labelStyle = {
	fontSize: "11px",
	fontWeight: 500,
	color: "var(--ak-ds-fg-muted, var(--ak-studio-muted-fg))",
};

const rowStyle = {
	display: "flex",
	alignItems: "center",
	gap: "8px",
};

const selectStyle = {
	flex: 1,
	minWidth: 0,
	padding: "6px 8px",
	borderRadius: "var(--ak-ds-radius-sm, 4px)",
	border: "1px solid var(--ak-ds-border, var(--ak-studio-border))",
	background: "var(--ak-ds-surface, var(--ak-studio-panel))",
	color: "var(--ak-ds-fg, var(--ak-studio-fg))",
	fontSize: "12px",
	fontFamily: "inherit",
};

const swatchBaseStyle = {
	flex: "0 0 auto",
	width: PREVIEW_BOX,
	height: PREVIEW_BOX,
	borderRadius: "var(--ak-ds-radius-sm, 4px)",
	border: "1px solid var(--ak-ds-border, var(--ak-studio-border))",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	overflow: "hidden",
	background: "transparent",
};

function ColorSwatch({ cssVar }: { readonly cssVar?: string }): ReactElement {
	return (
		<span
			data-testid="token-color-swatch"
			aria-hidden="true"
			style={{
				...swatchBaseStyle,
				background: cssVar ?? "transparent",
			}}
		/>
	);
}

function SpacingSwatch({ cssVar }: { readonly cssVar?: string }): ReactElement {
	return (
		<span
			data-testid="token-spacing-swatch"
			aria-hidden="true"
			style={{
				...swatchBaseStyle,
				background: "var(--ak-ds-surface, var(--ak-studio-panel))",
			}}
		>
			<span
				style={{
					display: "block",
					height: "8px",
					maxWidth: SPACING_PREVIEW_MAX,
					width: cssVar ?? "0",
					background: "var(--ak-ds-accent, var(--ak-studio-accent))",
					borderRadius: "2px",
				}}
			/>
		</span>
	);
}

function TypographySwatch({
	cssVar,
}: {
	readonly cssVar?: string;
}): ReactElement {
	return (
		<span
			data-testid="token-typography-swatch"
			aria-hidden="true"
			style={{
				...swatchBaseStyle,
				background: "var(--ak-ds-surface, var(--ak-studio-panel))",
				fontSize: cssVar ?? "inherit",
				color: "var(--ak-ds-fg, var(--ak-studio-fg))",
				fontWeight: 600,
				lineHeight: 1,
			}}
		>
			Aa
		</span>
	);
}

function renderSwatch(
	category: TokenFieldCategory,
	cssVar: string | undefined,
): ReactElement {
	switch (category) {
		case "color":
			return <ColorSwatch cssVar={cssVar} />;
		case "spacing":
			return <SpacingSwatch cssVar={cssVar} />;
		case "typography":
			return <TypographySwatch cssVar={cssVar} />;
	}
}

export interface TokenFieldFrameProps {
	readonly category: TokenFieldCategory;
	readonly value: string;
	readonly onChange: (next: string) => void;
	readonly readOnly?: boolean;
	readonly label?: string;
	readonly id?: string;
	readonly name?: string;
}

export function TokenFieldFrame({
	category,
	value,
	onChange,
	readOnly = false,
	label,
	id,
	name,
}: TokenFieldFrameProps): ReactElement {
	const msg = useMsg();
	const tokens = useTokens();
	const allowedKinds = CATEGORY_KINDS[category];
	const refs = listTokenRefs(tokens).filter((r) =>
		allowedKinds.has(r.kind),
	);
	const resolved = resolveTokenRef(value, tokens);

	return (
		<div style={containerStyle} data-token-field={category}>
			{label !== undefined ? (
				<label htmlFor={id} style={labelStyle}>
					{label}
				</label>
			) : null}
			<div style={rowStyle}>
				{renderSwatch(category, resolved.cssVar)}
				<select
					id={id}
					name={name}
					value={value}
					disabled={readOnly}
					onChange={(event) => onChange(event.target.value)}
					style={selectStyle}
					data-testid={`token-${category}-select`}
				>
					{value === "" || resolved.kind === "unknown" ? (
						<option value="">{msg("designSystem.field.selectToken")}</option>
					) : null}
					{refs.map((r) => (
						<option key={r.ref} value={r.ref}>
							{r.ref}
						</option>
					))}
				</select>
			</div>
		</div>
	);
}
