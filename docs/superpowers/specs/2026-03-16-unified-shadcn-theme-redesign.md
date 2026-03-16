# Unified Shadcn Theme Redesign

## Summary

Refactor the authenticated Words Book surfaces into one consistent shadcn-style product UI. The redesign covers `/signin`, `/`, and `/settings`, replaces the current heavily customized warm-paper presentation with a restrained official-shadcn visual system, and formally initializes the project as a shadcn app so page-level UI can be composed from standard source components instead of bespoke visual primitives.

## Goals

- Make `/signin`, `/`, and `/settings` feel like one coherent application.
- Bring the project visually closer to the official shadcn theme: neutral surfaces, semantic tokens, restrained borders, standard card composition, and consistent action hierarchy.
- Initialize the repository as a real shadcn project and align base UI components with shadcn conventions.
- Improve the homepage information architecture so primary tasks are obvious: add, search, browse, focus, and act on words.
- Simplify the settings page into a single-task token management page.
- Preserve responsive usability across desktop and mobile.

## Non-Goals

- No changes to authentication, database schema, or API behavior.
- No changes to word CRUD semantics, token rotation semantics, import/export semantics, or pronunciation link behavior.
- No new product features.
- No redesign of Raycast or extension clients.

## Current Problems

1. The visual system is split between shadcn-like base components and highly customized page styling, so the app does not actually read like a shadcn product.
2. The project has `components/ui/*`, but no `components.json`, which makes the current setup hard to maintain as an actual shadcn codebase.
3. The homepage emphasizes decorative floating cards and custom treatment over clear workspace structure.
4. The settings page still carries too much visual chrome for a task that should read as one focused credential console.
5. The sign-in page, workspace, and settings page do not share one strong, reusable page shell.

## Approved Direction

The approved direction is `A. Toolbar-first Workspace`.

This direction keeps the product visually restrained and operationally clear:

- A compact shared shell and top navigation.
- A simple sign-in card for `/signin`.
- A toolbar-first workspace on `/` with primary controls collected into a clear top card.
- A left-primary content area for browsing words and a right-side detail panel for the selected word.
- A single-task token management card on `/settings`.

This is the best fit for an official shadcn look because it favors standard card, form, table/list, and action layouts over editorial or dashboard-heavy presentation.

## Design Principles

- Use shadcn components and semantic tokens before custom markup.
- Favor product clarity over decorative atmosphere.
- Keep one primary action per section.
- Use structure, spacing, and typography for hierarchy instead of visual effects.
- Keep page chrome reusable so authenticated pages share one shell.

## Global UI System

### Shadcn Initialization

- Add a proper `components.json`.
- Initialize the project against the existing Next.js App Router setup.
- Use the project alias `@/`.
- Keep styling in `app/globals.css`, but rewrite theme tokens to align with a neutral shadcn-style palette.

### Theme Direction

- Replace the current warm-paper gradients and custom panel textures with a restrained neutral palette.
- Use semantic tokens for `background`, `card`, `muted`, `border`, `primary`, `ring`, and `destructive`.
- Reduce oversized radii, decorative shadows, and custom hover transforms to shadcn-like defaults.
- Preserve existing fonts unless they materially fight the new layout; typography should still read like a product UI, not an editorial landing page.

### Shared Shell

- Authenticated pages share one top shell:
  - Brand
  - Main navigation
  - User identity block
  - Sign-out action
- The shell should be compact and repeatable across `/` and `/settings`.
- The shell should use standard `Button`, `Avatar`, `Badge`/label, and `Separator` patterns where appropriate.

## Page Designs

### 1. `/signin`

#### Structure

- Replace the current hero-style entry page with a centered authentication card.
- Use full `Card` composition:
  - `CardHeader`: brand and concise explanation
  - `CardContent`: one primary sign-in button
  - `CardFooter`: optional short supporting copy

#### Behavior

- Keep the current server action sign-in flow unchanged.
- Keep the current redirect behavior for already signed-in users unchanged.

#### Visual Intent

- No large hero headline.
- No decorative spotlight treatment.
- One clear action: continue with Google.

### 2. `/`

#### Overall Layout

- Keep the authenticated shell at the top.
- Inside the page body, organize the workspace into three layers:
  1. Compact page header
  2. Primary toolbar card
  3. Main content split: left browsing area, right detail panel

#### Compact Page Header

- Replace the current editorial hero block with a smaller page header.
- Include:
  - Page title
  - One-sentence helper copy
  - Three compact stat cards
- Stats remain useful, but should not dominate the page.

#### Primary Toolbar Card

- Consolidate top controls into one main workspace card.
- Primary row:
  - `Add word` input
  - `Search` input
  - `Sort` control
  - `Add` button
- Secondary row:
  - `Import`
  - `Export`
  - `Clear all`
- Feedback messages should render near this toolbar card using standard alert/panel treatment.

#### Browsing Area

- Replace the floating scattered deck treatment with a more stable browsing surface.
- Prefer a shadcn-friendly list or table-like presentation for scanability.
- Each word row/card should support:
  - selecting the active word
  - communicating created time
  - clear hover/focus states

#### Detail Panel

- Keep the right-side active-word panel, but restyle it as standard stacked cards.
- Main detail card contains:
  - selected word
  - timestamp
  - copy action
  - delete action
- Supporting cards contain:
  - reference links
  - YouGlish accent actions

#### Empty States

- Replace bespoke empty-state blocks with standard card-based empty states.
- Empty states should be short and task-oriented.

### 3. `/settings`

#### Structure

- Keep the authenticated shell at the top.
- Use one page header plus one primary token card.
- Avoid side explanations or detached decorative modules.

#### Main Token Card

- Main card includes:
  - token status
  - primary create/rotate action
  - issued / last rotated / last used stats
  - one-time reveal area after successful create/rotate
  - copy action for the revealed token
  - low-emphasis developer reference/help area

#### Behavior

- Keep the current rotate and copy flows unchanged.
- Keep the current timestamp formatting unchanged unless minor presentation cleanup is needed.

#### Visual Intent

- This page should read like a settings task screen, not a feature showcase.
- Explanatory copy must stay brief and close to the action it supports.

## Component Mapping

Implementation should prefer these shadcn components:

- `Button`
- `Input`
- `Card`
- `Table` or a card-list pattern built from `Card`
- `Badge`
- `Alert`
- `Avatar`
- `Separator`

Optional if they help without adding complexity:

- `Tooltip`
- `Tabs`

Avoid introducing extra components unless they directly improve structure or accessibility.

## Implementation Boundaries

- Update the existing base UI components so they align with upstream shadcn styling expectations.
- Replace custom page classes in `app/globals.css` that exist only to support the current decorative design language.
- Recompose `WorkspaceShell`, `WordManager`, and `TokenSettings` around the approved information architecture.
- Keep state management, server actions, and domain logic unchanged unless a UI restructure forces small local refactors.
- Favor smaller presentational subcomponents if needed for readability, but do not perform unrelated refactors.

## Responsive Behavior

### Desktop

- Authenticated pages use a compact top shell and wide content container.
- Homepage main area uses a two-column split with a persistent right detail panel.
- Toolbar stays dense but readable.

### Tablet

- Toolbar controls can wrap into multiple rows without losing hierarchy.
- Homepage right detail panel may drop below the browsing area if width is constrained.

### Mobile

- All pages collapse to a single-column flow.
- Shell elements stack cleanly.
- Toolbar becomes a vertical sequence of fields and actions.
- Detail panel moves below the browsing area.
- Buttons and controls keep comfortable touch targets.

## Validation

Implementation is complete when:

1. The project has a valid shadcn initialization and can be treated as a shadcn codebase.
2. `/signin`, `/`, and `/settings` share one coherent visual system.
3. The app looks materially closer to the official shadcn theme than the current warm-paper design.
4. The homepage clearly emphasizes add, search, browse, and selected-word actions.
5. The settings page reads as a single-task credential management page.
6. No existing product behavior is regressed.
7. Responsive layouts remain usable on mobile and desktop.
8. `npm run lint` and `npm run build` succeed after implementation.

## Implementation Notes

- Use the official shadcn style as the floor, not as inspiration for further decoration.
- If a current interaction only exists to support the decorative card-deck metaphor, remove it in favor of structural clarity.
- Keep the redesign pragmatic: standard composition, standard spacing, standard states.
