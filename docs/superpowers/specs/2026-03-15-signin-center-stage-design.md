# Signin Center Stage Design

## Summary

Refactor the sign-in page into a centered entry card that behaves like a product gateway instead of a mini landing page. The page should preserve the current visual language, but reduce content to the minimum required for confidence and action.

## Goals

- Make the login action the clear focal point of the page.
- Keep a small amount of brand presence without adding explanatory copy.
- Reduce text to four elements: brand, title, subtitle, and button.
- Preserve the existing Google sign-in flow and redirect behavior.

## Non-Goals

- No authentication logic changes.
- No provider changes.
- No settings or workspace changes.
- No additional onboarding or helper text.

## Approved Direction

Use the `Center Stage` layout:

- one centered card
- compact brand chip
- title: `Enter your workspace`
- subtitle: `One account. One personal library.`
- primary button: `Continue with Google`

## Visual Notes

- Keep the warm paper-like background already used across the app.
- Use one elevated card with generous spacing and centered alignment.
- Remove the previous left/right editorial split and any secondary copy blocks.
- Keep the tone quiet, branded, and focused on entry.

## Validation

Implementation is complete when:

1. The sign-in page no longer uses a two-column layout.
2. Only the brand, title, subtitle, and button remain as primary copy.
3. The Google sign-in action is still wired to the existing server action.
4. Mobile and desktop layouts both keep the card centered and compact.
