# PRD — Persistence (Firestore)

## Introduction/Overview
Provide durable storage for shapes and minimal user records with clear, predictable conflict policy. Write final state on transform end and subscribe to changes for multi-user consistency.

## Goals
- Durable storage for shapes and minimal user records.
- Predictable conflict handling via LWW (Last-Write-Wins).
- Final-state persistence to reduce churn and conflicts.

## User Stories
- As a user, my shapes persist and reload consistently across sessions.
- As a collaborator, I see the same final shape states as others after reload.

## Functional Requirements
1. Collections: Define Firestore `shapes` with typed converters; subscribe via snapshots.
2. Write Points: Persist on create and on transform end (final state only; live deltas handled elsewhere).
3. Users: Create Firestore `users/{uid}` on first sign-in with `{ displayName, createdAt }`.
4. Conflict Policy: Use LWW with `updatedAt` (ms) and `updatedBy` (uid); prefer `serverTimestamp` where feasible and reconcile when not.
5. Atomicity: Use batched writes or transactions for multi-field updates to avoid partial writes.
6. Validation: Validate allowed fields/types at the service layer; ignore unexpected fields.

## Data Model
- Firestore `shapes/{id}`: `type, x, y, width, height, rotation, fill, stroke, zIndex, updatedAt, updatedBy`.
- Firestore `users/{uid}`: `{ displayName, createdAt }`.

## Non-Goals (Out of Scope)
- CRDT/OT merge strategies.
- Full offline mode and conflict resolution beyond LWW.
- Audit trails beyond basic `updatedAt/updatedBy`.

## Design Considerations (Optional)
- LWW semantics should be documented in UI copy for clarity where relevant (e.g., conflict toasts).
- Minimal error surfaces: user-facing messages for failed saves with retry guidance.

## Technical Considerations (Optional)
- Indexing: Ensure indexes for common queries if needed (e.g., ordering by `zIndex` or `updatedAt`).
- Listeners: Debounce local state application if necessary to avoid flicker.
- Clocks: Prefer `serverTimestamp`; when using client ms, ensure monotonicity per session.
- Security: Enforce least-privilege Firestore security rules aligned to data shapes.

## Success Metrics
- Reload restores shapes consistently for all users.
- Conflicting updates resolve predictably with no duplicates or ghosts.
- No partial writes observed; batched updates apply atomically.

## Open Questions
- Where `serverTimestamp` is feasible vs requiring client ms.
- Minimal indexing requirements for initial features.
- Scope of validation (strict vs permissive) as shapes expand.

## Risks & Mitigations
- Clock drift → prefer `serverTimestamp` or reconcile with logical clocks.
- Partial writes → use batched writes for multi-field updates.
