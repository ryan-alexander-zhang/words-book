# External YouGlish Pronounce Design

## Summary

Replace the embedded YouGlish pronunciation widget with direct accent-specific links. Keep the `Pronounce` module in the right rail, remove the YouGlish entry from `Reference shelf`, and make `American`, `British`, and `Australian` open the matching YouGlish page for the active word in a new tab.

## Goals

- Remove the in-page YouGlish widget from the `Pronounce` module.
- Keep three explicit pronunciation entry points for `American`, `British`, and `Australian`.
- Remove `YouGlish` from `Reference shelf`.
- Eliminate local accent state that only existed to drive the widget and shelf link.

## Non-Goals

- No API changes.
- No schema or persistence changes.
- No changes to the remaining reference links.
- No replacement of YouGlish with another embedded provider.

## Approved Direction

- Keep `Reference shelf` above `Pronounce` in the right rail.
- Keep the `Pronounce` card, but change its copy to describe outbound navigation instead of in-page playback.
- Render `American`, `British`, and `Australian` as plain external links instead of toggle buttons.
- Open each pronunciation link in a new tab with `rel="noreferrer"`.
- Generate three fixed YouGlish URLs for the active word using `us`, `uk`, and `aus`.
- Remove any selected-state styling that implies a local accent mode is still active.

## Implementation Boundaries

- Update `components/word-manager.tsx` to remove `accent` state, widget imports, widget rendering, and accent-toggle behavior.
- Update the `Pronounce` section to render three outbound links for the active word.
- Update `lib/word-links.ts` to remove the `YouGlish` entry from `WORD_LINKS`.
- Simplify `resolveHref()` so it only replaces `{name}` and no longer accepts an accent argument.
- Delete `components/pronounce-widget.tsx` because it will no longer have consumers.
- Keep the empty-state structure unchanged, but align the wording with the new external-link behavior if needed.

## Validation

Implementation is complete when:

1. `Reference shelf` no longer shows a `YouGlish` link.
2. `Pronounce` no longer renders an embedded player, loading state, or widget error state.
3. Clicking `American`, `British`, or `Australian` opens the active word at `https://youglish.com/pronounce/{name}/english/us`, `.../uk`, or `.../aus`.
4. Remaining reference links still work for the active word.
5. No unused `accent` state, `PronounceWidget` imports, or accent-related helper signatures remain in the codebase.
