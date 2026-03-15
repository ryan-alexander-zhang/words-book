# Word Input Validation Design

## Summary

Add a shared whitelist-based validation rule for word creation across the workspace UI, JSON import flow, and token-authenticated API writes. Words should allow letters, spaces, hyphens, and apostrophes, while rejecting other symbols, script-like payloads, and overly long values.

## Goals

- Enforce one consistent validation rule across all word-creation entry points.
- Allow multi-word entries such as `ice cream`.
- Allow common punctuation used in words such as hyphens and apostrophes.
- Reject non-word symbols and script-like payloads through a character whitelist.
- Add a maximum length guard to prevent abnormal inputs from being stored.
- Surface clear validation errors to the user.

## Non-Goals

- No database schema change.
- No keyword blacklist for JavaScript or SQL snippets.
- No character-by-character input masking while typing.
- No change to read, delete, or export behavior.

## Approved Direction

- Keep trimming and lowercasing behavior.
- Allow only these characters after trimming:
  - English letters `a-z`
  - spaces
  - hyphens `-`
  - apostrophes `'`
- Set the maximum accepted length to `80` characters.
- Reject any input containing other characters, including angle brackets, semicolons, underscores, at-signs, slashes, and similar symbols.
- Apply this validation to:
  - manual add in the workspace
  - JSON import
  - `/api/words`
  - `/api/v1/words`

## Error Strategy

- Put the canonical validation logic in `lib/words.ts` so all write paths share the same rule.
- Return explicit validation messages such as:
  - `Words may only contain letters, spaces, hyphens, and apostrophes.`
  - `Words must be 80 characters or fewer.`
- For import, reject the whole request on the first invalid value instead of partially importing valid rows.
- Keep a lightweight matching pre-check in `components/word-manager.tsx` for faster UI feedback, but do not rely on it for enforcement.
- Reuse the existing feedback area in the workspace rather than adding a new error surface.

## UI Copy

- Update the add/import helper text near the input controls to explain the allowed characters.
- Use concise helper copy, for example:
  `Letters, spaces, hyphens, and apostrophes only. Duplicate saves are ignored.`

## Validation

Implementation is complete when:

1. `ice cream`, `mother-in-law`, and `don't` are accepted.
2. Empty input is rejected.
3. Inputs such as `<script>alert(1)</script>`, `select * from users;`, `foo_bar`, and `hello@world` are rejected.
4. Inputs longer than `80` characters are rejected.
5. Manual add, JSON import, `/api/words`, and `/api/v1/words` all enforce the same rule and return consistent errors.
