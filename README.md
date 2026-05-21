# @anvilkit/plugin-design-system

Token-bound fields, theme switching, and design validation for
`@anvilkit/core`'s `<Studio>` shell.

> 📘 **Full guide:** see [Design System plugin](https://anvilkit-studio.vercel.app/guides/design-system/)
> on the docs site for the long-form walkthrough — token model,
> validation hooks, theme switching, current limits.

## Install

```sh
pnpm add @anvilkit/plugin-design-system
```

`@anvilkit/core@^0.1.0-alpha`, `@puckeditor/core@^0.21.2`, and
`react@^18 || ^19` are peer dependencies.

## Minimal host

```tsx
import { Studio } from "@anvilkit/core";
import {
  createDesignSystemPlugin,
  createTokenColorField,
  createTokenSpacingField,
} from "@anvilkit/plugin-design-system";

const designSystem = createDesignSystemPlugin({
  // Optional — deep-merged onto bundled `DEFAULT_TOKENS`.
  tokens: {
    primitives: { brand: { 500: "#1f6feb" } },
  },
});

const config = {
  components: {
    Card: {
      fields: {
        bg: createTokenColorField({ label: "Background" }),
        gap: createTokenSpacingField({ label: "Gap" }),
      },
      render: ({ bg, gap }) => (
        <div
          style={{
            background: `var(--ak-ds-${bg.replace("color.", "").replace(".", "-")})`,
            padding: `var(--ak-ds-space-${gap.replace("space.", "")})`,
          }}
        />
      ),
    },
  },
};

export function App() {
  return <Studio plugins={[designSystem]} config={config} />;
}
```

## What the plugin contributes

- **Three field factories.** `createToken{Color,Spacing,Typography}Field`
  return Puck `CustomField<string>` shapes that store serializable token
  refs (`color.brand.500`, `space.4`, `text.lg`, `semantic.bg`). The
  field UI shows a swatch preview + dropdown grouped by token category.
- **`overrides.fields` wrapper.** Mounts a `<TokenProvider>` above
  Puck's sidebar field tree so the field factories' render fns can read
  the resolved token tree via `useTokens()`. Composed through anvilkit's
  curried `mergeOverrides` so it never clobbers a sibling plugin's
  `fields` slot.
- **Design-system rail panel.** Two tabs (Tokens · Theme) registered
  via `ctx.registerDesignSystemPanel`. The Tokens tab lists every
  resolved ref with a click-to-copy row; the Theme tab dispatches
  `useThemeStore.setMode("light" | "dark" | "system")` and lets the
  existing `use-theme-sync` propagate to chrome + Puck iframe.
- **Off-token warnings (`onDataChange`).** Non-blocking shape-based
  walker flags hex / rgb / hsl / oklch / px / rem literals that aren't
  in the resolved token tree. Logged via `ctx.log("warn", …)`.
- **Contrast gating (`onBeforePublish`).** WCAG-AA pair walker (default
  `{ fg: "color", bg: "backgroundColor" }` and `{ fg: "color", bg:
  "background" }`) throws `StudioPluginError` with all failures attached
  to `error.cause.failures` to abort publish.

## Options

```ts
interface DesignSystemOptions {
  /** Deep-merged onto `DEFAULT_TOKENS`. */
  tokens?: PartialDesignTokens;
  validation?: {
    /** Defaults to `true`. Set false to disable the `onDataChange` hook. */
    offToken?: boolean;
    /** Defaults to `true`. Set false to disable the `onBeforePublish` gate. */
    contrast?: boolean;
  };
}
```

## Token namespace

CSS variables emitted into the host doc and the Puck iframe:

| Tier      | Variables                                                               |
| --------- | ----------------------------------------------------------------------- |
| Primitive | `--ak-ds-brand-{50..900}`, `--ak-ds-neutral-{50..900}`                  |
|           | `--ak-ds-space-{0,1,2,3,4,6,8,12,16,24}`                                |
|           | `--ak-ds-text-{xs,sm,base,lg,xl,2xl,3xl}`                               |
|           | `--ak-ds-radius-{sm,md,lg}`                                             |
| Semantic  | `--ak-ds-{bg,surface,fg,fg-muted,accent,accent-fg,border,focus-ring}`   |

Semantics fall back to `var(--ak-studio-*, …)` so an unthemed host
renders identically to today.

## Field ref grammar

| Ref string         | Resolves to               |
| ------------------ | ------------------------- |
| `color.brand.500`  | `var(--ak-ds-brand-500)`  |
| `color.neutral.50` | `var(--ak-ds-neutral-50)` |
| `semantic.bg`      | `var(--ak-ds-bg)`         |
| `semantic.accent`  | `var(--ak-ds-accent)`     |
| `space.4`          | `var(--ak-ds-space-4)`    |
| `text.lg`          | `var(--ak-ds-text-lg)`    |
| `radius.md`        | `var(--ak-ds-radius-md)`  |

## Subpath exports

| Subpath                                  | Exports                                        |
| ---------------------------------------- | ---------------------------------------------- |
| `@anvilkit/plugin-design-system`         | Factory, field factories, runtime, tokens, panel |
| `@anvilkit/plugin-design-system/tokens`  | React-free token tree + helpers                  |
| `@anvilkit/plugin-design-system/runtime` | `TokenProvider`, `useTokens`, `resolveTokenRef`  |

## v0.1 limits

- Contrast validation parses hex + `rgb()`/`rgba()` only. `oklch()`,
  `hsl()`, `lab()` etc. resolve as "unparseable" and are skipped — no
  false positives, but bundled defaults (which use oklch) won't trigger
  failures until a host overrides primitives to hex. Broader parsing is
  tracked as a follow-up.
- Off-token detection is shape-based; the walker flags every literal
  shape regardless of which field produced it. Disable via
  `opts.validation.offToken: false` if noise is a problem.
- The DS panel ships Tokens + Theme tabs in v0.1. A Components tab is
  deferred until a concrete spec lands for which metadata each row
  shows.
- **Rail tab pending in core.** The plugin registers a panel via
  `ctx.registerDesignSystemPanel?({ render })` and the core
  `sidebarRegistryStore.designSystemPanel` slot is populated, but the
  `EditorTab` union + `RAIL_MODULES` table in `@anvilkit/core` don't
  yet include a `"design-system"` entry — so the panel state is set
  but no UI consumes it. The token-bound fields, `--ak-ds-*` CSS, and
  validators all work today; the panel UI lands with a follow-up Phase
  B back-fill in core.
