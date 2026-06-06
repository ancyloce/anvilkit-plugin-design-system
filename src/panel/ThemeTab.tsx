/**
 * @file Theme tab — three-button mode switcher.
 *
 * Reads `mode` + `setMode` from `useThemeStore`. Selecting a mode flips
 * `themeStore.mode`, which `use-theme-sync` already propagates to
 * `<html>` (chrome) and the Puck iframe canvas in lockstep. Primitives
 * flip; semantics + stored token refs stay theme-stable per PRD §5.2.
 */

import { useThemeStore } from "@anvilkit/core";
import { useMsg } from "@anvilkit/core/i18n";
import type { CSSProperties, ReactElement } from "react";

type ThemeMode = "light" | "dark" | "system";

const MODES: ReadonlyArray<{
	readonly value: ThemeMode;
	readonly labelKey: string;
}> = [
	{ value: "light", labelKey: "designSystem.mode.light" },
	{ value: "dark", labelKey: "designSystem.mode.dark" },
	{ value: "system", labelKey: "designSystem.mode.system" },
];

const containerStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: "8px",
	padding: "8px 4px",
};

const labelStyle: CSSProperties = {
	fontSize: "11px",
	fontWeight: 600,
	textTransform: "uppercase",
	letterSpacing: "0.04em",
	color: "var(--ak-ds-fg-muted, var(--ak-studio-muted-fg))",
};

const rowStyle: CSSProperties = {
	display: "flex",
	gap: "6px",
};

function buttonStyle(active: boolean): CSSProperties {
	return {
		flex: 1,
		padding: "8px 10px",
		borderRadius: "var(--ak-ds-radius-sm, 4px)",
		border: active
			? "1px solid var(--ak-ds-accent, var(--ak-studio-accent))"
			: "1px solid var(--ak-ds-border, var(--ak-studio-border))",
		background: active
			? "var(--ak-ds-accent, var(--ak-studio-accent))"
			: "var(--ak-ds-surface, var(--ak-studio-panel))",
		color: active
			? "var(--ak-ds-accent-fg, var(--ak-studio-accent-fg))"
			: "var(--ak-ds-fg, var(--ak-studio-fg))",
		fontSize: "12px",
		fontWeight: 500,
		cursor: "pointer",
		fontFamily: "inherit",
	};
}

export function ThemeTab(): ReactElement {
	const msg = useMsg();
	const mode = useThemeStore((s) => s.mode) as ThemeMode;
	const setMode = useThemeStore((s) => s.setMode) as (next: ThemeMode) => void;

	return (
		<div style={containerStyle} data-testid="design-system-panel-theme">
			<div style={labelStyle}>{msg("designSystem.theme.label")}</div>
			<div
				style={rowStyle}
				role="radiogroup"
				aria-label={msg("designSystem.theme.aria")}
			>
				{MODES.map(({ value, labelKey }) => (
					<button
						key={value}
						type="button"
						role="radio"
						aria-checked={mode === value}
						style={buttonStyle(mode === value)}
						onClick={() => setMode(value)}
						data-testid={`theme-mode-${value}`}
					>
						{msg(labelKey)}
					</button>
				))}
			</div>
		</div>
	);
}
