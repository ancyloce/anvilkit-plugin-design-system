/**
 * @file Tokens tab — flat browsable list of every resolved token ref.
 *
 * Click a row to copy its ref string (`color.brand.500` /
 * `semantic.bg` / `space.4` / etc.) to the clipboard so consumers can
 * paste it straight into a component prop or a CSS file. Rows render a
 * category-appropriate swatch resolved through the `--ak-ds-*` CSS
 * vars so theme switches flow through CSS rather than JS state.
 */

import { useMsg } from "@anvilkit/core/i18n";
import type { CSSProperties, ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";

import { listTokenRefs } from "../runtime/resolve-ref.js";
import type { ResolvedTokenRef, TokenRefKind } from "../runtime/resolve-ref.js";
import { useTokens } from "../runtime/token-context.js";

interface GroupedRefs {
	readonly titleKey: string;
	readonly kind: TokenRefKind;
	readonly refs: ReadonlyArray<ResolvedTokenRef>;
}

const GROUP_ORDER: ReadonlyArray<{
	readonly titleKey: string;
	readonly kind: TokenRefKind;
}> = [
	{ titleKey: "designSystem.group.colorPrimitive", kind: "color" },
	{ titleKey: "designSystem.group.colorSemantic", kind: "semantic" },
	{ titleKey: "designSystem.group.spacing", kind: "space" },
	{ titleKey: "designSystem.group.typography", kind: "text" },
	{ titleKey: "designSystem.group.radius", kind: "radius" },
];

const containerStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: "12px",
	padding: "8px 4px",
};

const groupStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: "4px",
};

const groupTitleStyle: CSSProperties = {
	fontSize: "11px",
	fontWeight: 600,
	textTransform: "uppercase",
	letterSpacing: "0.04em",
	color: "var(--ak-ds-fg-muted, var(--ak-studio-muted-fg))",
};

const rowStyle: CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: "8px",
	padding: "6px 8px",
	borderRadius: "var(--ak-ds-radius-sm, 4px)",
	border: "1px solid var(--ak-ds-border, var(--ak-studio-border))",
	background: "var(--ak-ds-surface, var(--ak-studio-panel))",
	cursor: "pointer",
	fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
	fontSize: "11px",
	color: "var(--ak-ds-fg, var(--ak-studio-fg))",
	textAlign: "left" as const,
};

const swatchBox: CSSProperties = {
	width: "20px",
	height: "20px",
	borderRadius: "var(--ak-ds-radius-sm, 4px)",
	border: "1px solid var(--ak-ds-border, var(--ak-studio-border))",
	flex: "0 0 auto",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	overflow: "hidden",
};

function renderSwatch(kind: TokenRefKind, cssVar?: string): ReactElement {
	if (kind === "color" || kind === "semantic") {
		return (
			<span
				aria-hidden="true"
				style={{ ...swatchBox, background: cssVar ?? "transparent" }}
			/>
		);
	}
	if (kind === "space") {
		return (
			<span aria-hidden="true" style={swatchBox}>
				<span
					style={{
						display: "block",
						height: "4px",
						width: cssVar ?? "0",
						maxWidth: "100%",
						background: "var(--ak-ds-accent, var(--ak-studio-accent))",
					}}
				/>
			</span>
		);
	}
	if (kind === "text") {
		return (
			<span
				aria-hidden="true"
				style={{
					...swatchBox,
					fontSize: cssVar ?? "inherit",
					fontWeight: 600,
					lineHeight: 1,
				}}
			>
				Aa
			</span>
		);
	}
	// radius
	return (
		<span
			aria-hidden="true"
			style={{
				...swatchBox,
				background: "var(--ak-ds-accent, var(--ak-studio-accent))",
				borderRadius: cssVar ?? "0",
			}}
		/>
	);
}

export function TokensTab(): ReactElement {
	const msg = useMsg();
	const tokens = useTokens();
	const [copied, setCopied] = useState<string | null>(null);

	const groups = useMemo<ReadonlyArray<GroupedRefs>>(() => {
		const all = listTokenRefs(tokens);
		return GROUP_ORDER.map((g) => ({
			...g,
			refs: all.filter((r) => r.kind === g.kind),
		})).filter((g) => g.refs.length > 0);
	}, [tokens]);

	const onCopy = useCallback(async (ref: string) => {
		try {
			await navigator.clipboard?.writeText(ref);
			setCopied(ref);
		} catch {
			// Clipboard API may be unavailable (insecure context, jsdom
			// without polyfill). The visible click feedback is best-effort.
			setCopied(null);
		}
	}, []);

	return (
		<div style={containerStyle} data-testid="design-system-panel-tokens">
			{groups.map((group) => (
				<section key={group.kind} style={groupStyle}>
					<div style={groupTitleStyle}>{msg(group.titleKey)}</div>
					{group.refs.map((r) => (
						<button
							key={r.ref}
							type="button"
							style={rowStyle}
							onClick={() => onCopy(r.ref)}
							data-testid={`token-row-${r.ref}`}
							aria-label={msg("designSystem.token.copyAria").replace(
								"{ref}",
								r.ref,
							)}
						>
							{renderSwatch(r.kind, r.cssVar)}
							<span style={{ flex: 1 }}>{r.ref}</span>
							{copied === r.ref ? (
								<span
									aria-live="polite"
									style={{
										fontSize: "10px",
										color:
											"var(--ak-ds-fg-muted, var(--ak-studio-muted-fg))",
									}}
								>
									{msg("designSystem.token.copied")}
								</span>
							) : null}
						</button>
					))}
				</section>
			))}
		</div>
	);
}
