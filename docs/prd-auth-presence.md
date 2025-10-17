# PRD — Auth & Presence (Rubric-Aligned)

## Introduction/Overview
Provide authenticated identity and real-time presence so collaborators can see each other online with named cursors. Presence must be fast (<50 ms perceived), resilient to disconnects, and predictable across auth and network changes.

## Goals
- Email/password authentication with `displayName` captured or prompted on first sign-in.
- Named cursors update in real time with perceived latency <50 ms.
- Presence lifecycle is robust: create on join, remove on disconnect, prune stale entries.
- Reconnect flows re-subscribe listeners without duplication or leaks.
- Security rules enforce least privilege and valid data shapes.

## User Stories
- As a user, I sign up/sign in so my named cursor appears to others.
- As a collaborator, I see who’s online and their cursors in real time.
- As a returning user, my presence restores quickly after reconnect without duplicate cursors.

## Functional Requirements
1. Authentication: Implement Firebase Auth (email/password) and capture `displayName`; allow update of `displayName` after first login.
2. User record: Create Firestore `users/{uid}` on first login with `{ displayName, createdAt }`.
3. Presence node: Write RTDB `/presence/{uid}` objects `{ name, cursor:{x:number,y:number}, selectionIds?:string[], updatedAt:number }`.
4. Disconnect handling: Use `onDisconnect()` to remove presence; include `updatedAt` timestamps to enable stale pruning.
5. Cursor updates: Throttle cursor writes to ~10 Hz; render named cursor with a stable color per user.
6. Presence UI: Display a lightweight online list (names/avatars/colors) representing active `/presence/*` entries.
7. Re-subscribe logic: On auth changes and network reconnects, re-subscribe presence listeners and dedupe handlers to prevent leaks.
8. Security rules: Enforce RTDB/Firestore rules so users can only write their own presence and valid shapes; validate schema.

## Data Model
- Firestore `users/{uid}`: `{ displayName, createdAt }`.
- RTDB `/presence/{uid}`: `{ name, cursor:{x,y}, selectionIds?:string[], updatedAt }`.

## Non-Goals (Out of Scope)
- Third-party SSO providers (Google/GitHub/etc.) in this phase.
- Anonymous auth or multi-tenant account management.
- Rich profile management beyond `displayName`.
- Cross-device session deduplication and advanced multi-session policy.

## Design Considerations (Optional)
- Cursor appearance: stable color derived from `uid`; label with `name` near cursor.
- Presence list: compact tray showing online collaborators with color chips.
- Accessibility: ensure cursor labels remain readable on varying backgrounds.

## Technical Considerations (Optional)
- Centralize listener setup/teardown to avoid memory leaks and duplicate subscriptions.
- Throttle cadence (~10 Hz) to balance smoothness and bandwidth.
- `onDisconnect` reliability: handle tab closes and abrupt network drops; ensure cleanup.
- Pruning strategy: client-side prune based on `updatedAt`; consider periodic server function later.
- Error handling: retry transient failures; surface minimal UI notifications for auth failures.

## Success Metrics
- Two browsers display named cursors with perceived <50 ms latency.
- Signing out removes presence within ~1 second; reconnect restores without duplication.
- Presence list reflects active sessions; stale entries are pruned within a bounded interval.
- No duplicate listeners or memory leaks observed in manual tests.

## Open Questions
- Exact cursor update rate (10–15 Hz?) given real hardware and network.
- Color derivation method and collision handling for many users.
- Policy for multiple sessions per `uid` (show multiple cursors or dedupe?).
- Where and how to collect `displayName` (first-run modal vs settings)?

## Risks & Mitigations
- Stale presence → `onDisconnect` + timestamp pruning.
- Memory leaks → centralize, dedupe, and clean listeners.

## Notes
- Keep rules small; tests focus on hook contract and presence utilities.

## Implementation Notes (PR1 Complete)
- **Foundation established**: Firebase singletons, type system, and testing infrastructure complete
- **Environment setup**: Requires Firebase project configuration and environment variables
- **Security rules**: Created but need deployment to Firebase project
- **Type safety**: Runtime type guards implemented for presence data validation
- **Testing**: 30 tests passing, covering Firebase initialization and type validation
- **Next phase**: Ready for auth flows and presence service implementation (PR2)