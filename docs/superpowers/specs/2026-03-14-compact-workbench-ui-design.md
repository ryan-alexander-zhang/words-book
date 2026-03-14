# Compact Workbench UI Design

## Summary

Refactor the `WordManager` workspace into a compact, tool-like control surface that fixes alignment problems in the current top section, especially around `Add word`, `Search`, and `Sort`. The redesign keeps the floating word deck and the right-side focus panel, but removes the oversized editorial hero treatment and replaces it with a tighter workspace header plus a unified control console.

## Goals

- Eliminate the visual mismatch between the current hero block, stat cards, add form, and search/sort row.
- Put the primary tasks on one strict baseline: add a word, search, sort, and submit.
- Keep the experience clearly “tool-first” rather than “landing-page-first”.
- Preserve the existing floating card deck and embedded pronounce workflow.
- Improve mobile behavior so controls do not collapse awkwardly.

## Non-Goals

- No schema, API, or data-model changes.
- No changes to the YouGlish embedding behavior.
- No redesign of the underlying word CRUD flows.
- No unrelated component-system refactor.

## Current Problems

1. The top section mixes two incompatible rhythms: an oversized narrative hero on the left and utility stats on the right.
2. The add form is visually treated as a different section from search and sort, so controls that belong to the same workflow do not align.
3. Spacing density is inconsistent across the page, making the interface feel assembled rather than designed as one system.
4. The floating deck is visually softer than the rest of the page, which creates a split personality between “showcase” and “tool”.

## Chosen Direction

The approved direction is `A. Command Bar First`.

This layout keeps a compact title strip, places the three metrics in a tighter equal-height cluster, and consolidates the top interaction area into one unified control console:

- Row 1: `Add word | Search | Sort | Add button`
- Row 2: `Import | Export | Delete selected | Clear all`

This is the strongest match for the requested “toolbench” feel and directly addresses the reported alignment issue.

## Layout Structure

### 1. Workspace Header

- Replace the oversized hero with a compact header block.
- Left side: short title and one-line helper copy.
- Right side: three metric cards for `Saved`, `Match`, and `Picked`.
- Metric cards use the same height, internal spacing, and left alignment.

### 2. Unified Control Console

- Replace the separate add form and search/sort row with one combined control area.
- Primary row uses a stable four-column grid:
  - `Add word`: widest field
  - `Search`: medium field
  - `Sort`: narrow field
  - `Add`: fixed-width button
- Secondary row contains non-primary actions:
  - `Import`
  - `Export`
  - `Delete selected`
  - `Clear all`

### 3. Main Workspace

- Keep the current two-column structure:
  - Left: floating deck of word cards
  - Right: focus panel with pronounce and reference modules
- The deck remains visually distinct, but motion amplitude and spacing are reduced so it fits the tighter tool-panel aesthetic.

## Visual System

- Keep the existing warm paper-like palette, but reduce decorative emphasis in the top section.
- Use stricter spacing intervals so header, controls, cards, and side panel share one rhythm.
- Decrease oversized empty space around metrics and controls.
- Keep floating cards, but make them more uniform in size and interior spacing.
- Make the top console feel structurally stronger than the deck by using firmer panel framing and more consistent heights.

## Component Boundaries

Implementation should remain focused on `WordManager` and page-level styling:

- Recompose the top section inside `components/word-manager.tsx`.
- Adjust supporting utility classes in `app/globals.css`.
- Preserve all existing fetch, loading, clipboard, import/export, deck rotation, and pronounce behaviors.
- If needed, extract only small local UI fragments for readability; avoid broad refactors.

## State and Behavior

- Existing state management remains unchanged.
- Existing button actions and handlers remain unchanged.
- Existing selection, reshuffle, pagination, and pronunciation flows remain unchanged.
- The redesign is structural and visual, not behavioral.

## Responsive Behavior

### Desktop

- Header stays in two columns: title/help on the left, metrics on the right.
- Control console uses the four-column primary row.
- Secondary actions wrap cleanly without breaking the primary row.

### Tablet

- Metrics can wrap below the title if horizontal space becomes constrained.
- Primary row may compress to two rows while preserving consistent field heights.

### Mobile

- Header stacks vertically.
- Metrics become a compact grid.
- Primary controls become a two-column or single-column stack as needed.
- The add button should never be squeezed into a misaligned inline position.
- Main content collapses to a single column with the focus panel below the deck.

## Error Handling and UX Safeguards

- Existing loading and error messaging stays visible within the unified console.
- Disabled states remain intact for actions like `Delete selected` and `Clear all`.
- Empty states for the deck and focus panel remain functionally unchanged.
- The layout should not hide or obscure file import behavior.

## Validation

Implementation is complete when:

1. `Add word`, `Search`, `Sort`, and `Add` align cleanly on desktop.
2. Metrics, controls, deck, and detail panel share a consistent spacing system.
3. The page looks materially more coordinated than the current screenshot.
4. Mobile layout does not exhibit control crowding or broken alignment.
5. Existing functionality still works.
6. `npm run build` succeeds.

## Implementation Notes

- Favor layout simplification over adding more decorative elements.
- Fix the alignment issue by changing the structural grid, not by patching margins ad hoc.
- Preserve the distinctive floating-card identity, but subordinate it to the workbench layout.
