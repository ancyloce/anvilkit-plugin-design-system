/**
 * @file Public barrel for the design-system rail panel.
 *
 * The plugin registers the panel via `ctx.registerDesignSystemPanel`;
 * hosts don't import these directly under normal usage. Exposed so
 * advanced consumers (e.g. a host building a custom rail) can mount
 * the panel outside the standard registration flow.
 */

export { DesignSystemPanel } from "./DesignSystemPanel.js";
export { ThemeTab } from "./ThemeTab.js";
export { TokensTab } from "./TokensTab.js";
