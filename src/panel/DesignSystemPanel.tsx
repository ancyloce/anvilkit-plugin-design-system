/**
 * @file Design-system rail panel — the React tree mounted by the
 * sidebar `design-system` module.
 *
 * v0.1 ships two tabs:
 *   - **Tokens** — browse + copy-to-clipboard for every resolved ref.
 *   - **Theme** — Light / Dark / System mode switcher via
 *     `useThemeStore`.
 *
 * "Components" tab is deferred to v0.2 (the plan locks v0.1 scope to
 * the two tabs that have a concrete spec). The panel is registered via
 * `ctx.registerDesignSystemPanel?({ render })` from
 * `createDesignSystemPlugin().register(ctx)`; the wrapping
 * `<TokenProvider>` is mounted by the registration thunk so the
 * panel's hooks (`useTokens`) have context.
 */

import { useMsg } from "@anvilkit/core/i18n";
import type { CSSProperties, ReactElement } from "react";
import { useState } from "react";

import { TokensTab } from "./TokensTab.js";
import { ThemeTab } from "./ThemeTab.js";

type TabKey = "tokens" | "theme";

const TABS: ReadonlyArray<{ readonly key: TabKey; readonly labelKey: string }> = [
	{ key: "tokens", labelKey: "designSystem.tab.tokens" },
	{ key: "theme", labelKey: "designSystem.tab.theme" },
];

const containerStyle: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: "8px",
	height: "100%",
	padding: "8px",
	fontFamily: "inherit",
	color: "var(--ak-ds-fg, var(--ak-studio-fg))",
	background: "var(--ak-ds-bg, var(--ak-studio-bg))",
};

const tabListStyle: CSSProperties = {
	display: "flex",
	gap: "4px",
	borderBottom:
		"1px solid var(--ak-ds-border, var(--ak-studio-border))",
};

function tabButtonStyle(active: boolean): CSSProperties {
	return {
		padding: "6px 12px",
		border: "none",
		background: "transparent",
		color: active
			? "var(--ak-ds-fg, var(--ak-studio-fg))"
			: "var(--ak-ds-fg-muted, var(--ak-studio-muted-fg))",
		borderBottom: active
			? "2px solid var(--ak-ds-accent, var(--ak-studio-accent))"
			: "2px solid transparent",
		fontSize: "12px",
		fontWeight: active ? 600 : 500,
		cursor: "pointer",
		fontFamily: "inherit",
	};
}

const panelBodyStyle: CSSProperties = {
	flex: 1,
	minHeight: 0,
	overflow: "auto",
};

export function DesignSystemPanel(): ReactElement {
	const msg = useMsg();
	const [tab, setTab] = useState<TabKey>("tokens");
	return (
		<div style={containerStyle} data-testid="design-system-panel">
			<div
				role="tablist"
				aria-label={msg("designSystem.panel.aria")}
				style={tabListStyle}
			>
				{TABS.map(({ key, labelKey }) => (
					<button
						key={key}
						type="button"
						role="tab"
						aria-selected={tab === key}
						aria-controls={`ds-tab-${key}`}
						style={tabButtonStyle(tab === key)}
						onClick={() => setTab(key)}
						data-testid={`design-system-tab-${key}`}
					>
						{msg(labelKey)}
					</button>
				))}
			</div>
			<div style={panelBodyStyle} role="tabpanel" id={`ds-tab-${tab}`}>
				{tab === "tokens" ? <TokensTab /> : <ThemeTab />}
			</div>
		</div>
	);
}
