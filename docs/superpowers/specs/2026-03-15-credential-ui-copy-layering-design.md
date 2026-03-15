# Credential UI Copy Layering Design

## Summary

Refine the sign-in and settings UI so the product keeps a technical tone without exposing implementation detail as primary content. The main interface should focus on user intent, status, and consequences. API paths, header formats, and auth mechanics should remain available, but only as secondary help content.

## Goals

- Keep the interface clearly technical, not overly consumerized.
- Remove backend implementation language from primary page copy.
- Prioritize user-facing actions such as creating, copying, rotating, and safeguarding credentials.
- Preserve access to endpoint and authorization details for developer users.

## Non-Goals

- No API behavior changes.
- No auth flow changes.
- No settings route or schema changes.
- No new documentation surface outside the existing pages.

## Approved Direction

Use a layered presentation model:

- Primary layer: credential purpose, current status, usage scope, and rotation risk.
- Secondary layer: compact technical reference for endpoint path, auth header, and request rules.
- Microcopy should explain outcomes rather than implementation internals.

## Page Changes

### Sign-In

- Keep the Google sign-in requirement explicit.
- Replace implementation-focused copy with product-focused language about private workspace access and later external-tool connection.

### Settings

- Rename the main framing from generic API exposure to a more productized technical concept such as `Access credentials`.
- Keep token status, issued dates, recent usage, reveal-once behavior, and rotation messaging.
- Replace storage/mechanism wording with action-oriented wording.
- Move protocol details into a lower-priority hoverable help treatment or compact technical note.

## Interaction Notes

- Use a lightweight info icon with hover/focus disclosure for technical details.
- Ensure the hidden technical content is still keyboard reachable.
- Avoid adding modal or drawer complexity for this scope.

## Validation

Implementation is complete when:

1. The sign-in page no longer references Auth.js sessions or bearer token mechanics in primary copy.
2. The settings page hero no longer leads with raw API terminology.
3. Endpoint and authorization details remain accessible through a lower-priority UI element.
4. Token lifecycle messaging is understandable without reading backend-oriented text.
