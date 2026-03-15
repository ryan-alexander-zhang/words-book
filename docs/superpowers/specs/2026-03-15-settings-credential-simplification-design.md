# Settings Credential Simplification Design

## Summary

Refactor the settings page into a single-task credential console. Remove redundant account repetition, eliminate the permanently empty `Credential reveal` module, and make token reveal appear inline only after a successful create or rotate action.

## Goals

- Make the settings page focus on one task: managing the access credential.
- Remove redundant UI that repeats signed-in account context.
- Reduce explanatory copy so the page reads quickly.
- Show the credential reveal only when there is a newly created or rotated token to copy.
- Keep developer reference details accessible without competing with the main flow.

## Non-Goals

- No API changes.
- No token lifecycle or security behavior changes.
- No navigation or authentication changes.
- No changes to other workspace pages.

## Approved Direction

- Remove the `Workspace account` card from the settings layout.
- Collapse the page into one primary credential card instead of multiple competing panels.
- Keep credential status, primary action, and key timestamps in the main card.
- Keep the `Issued`, `Last rotated`, and `Last used` fields, but present them as compact supporting stats.
- Replace the standalone `Credential reveal` section with an inline reveal area inside the main card.
- Only render the reveal area when `revealedToken` exists after a successful create or rotate action.
- Keep copy and error feedback near the reveal and primary action instead of as a detached lower section.
- Keep developer reference/help available through a low-emphasis help affordance rather than a large side explanation block.

## Content Strategy

- Shorten the page intro to a single sentence.
- Remove repeated explanations about the credential being used by Raycast, extensions, and scripts when that information does not help the immediate task.
- Remove repeated explanations that the token is shown only once; keep that rule in one short, high-signal location near the reveal flow.
- Remove placeholder empty-state copy for reveal when no token is currently visible.
- If account scoping needs to remain visible, reduce it to a brief secondary line inside the main card instead of a dedicated card.

## Implementation Boundaries

- Update `components/token-settings.tsx` to simplify the layout and content hierarchy.
- Update `app/globals.css` only as needed to support the new settings layout primitives and visual density.
- Preserve the existing `rotateToken`, `copyToken`, feedback handling, and timestamp formatting behavior unless layout changes require relocation.
- Keep the help-based developer reference pattern, but reduce its visual weight and placement prominence.
- Remove the right-rail explanatory panel if it no longer serves the single-task layout.

## Validation

Implementation is complete when:

1. The settings page no longer shows a `Workspace account` card.
2. The page no longer renders a permanently empty `Credential reveal` module.
3. Without a newly revealed token, the page still looks complete and centered on credential status plus the primary action.
4. After a successful create or rotate action, the token reveal appears inline in the main credential card and supports copy.
5. The settings page copy is materially shorter and avoids repeating the same explanations across multiple regions.
6. Developer reference details remain accessible, but they no longer dominate the layout or compete with the main action.
