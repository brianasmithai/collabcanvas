# CollabCanvas — Master Product Requirements (Rubric‑Aligned)

## 1) Purpose & Vision
Build a Figma‑style, real‑time collaborative canvas that is smooth at scale, reliable under contention, and extensible with an AI agent. The experience should feel immediate (sub‑100ms object sync, sub‑50ms cursors), resilient to disconnects, and predictable when multiple users act at once.

## 2) What “Excellent” Looks Like (Acceptance Targets)
- Realtime sync: perceived <100ms for objects, <50ms for cursors; no visible lag under normal load.
- Conflict handling: concurrent edits converge to a consistent final state; no ghosts/duplicates; clear ownership when an object is locked.
- Persistence & reconnection: refresh mid‑edit restores coherent state; full canvas persists when all leave; network drops auto‑reconnect cleanly.
- Performance: ~60 FPS during pan/zoom/transforms; scales to ~500+ simple objects and 5+ concurrent users without major degradation.
- AI agent: supports a breadth of commands (create/manipulate/layout/complex), executes multi‑step actions, and updates shared state for all users.

## 3) Scope (Phase‑able)
- Core collaboration: presence, cursors, selection, transforms for shapes.
- Durable canvas state with predictable conflict policy.
- Locking to avoid race conditions for shape transforms.
- AI agent layer that issues structured canvas commands post‑core.

Non‑Goals (initial): CRDT/OT, complex offline mode, plugin system, advanced vector path editing.

## 4) System Overview (Stack & Architecture)
- Frontend: React + Vite + TypeScript, Konva for canvas rendering; lightweight UI store for tool/viewport/selection.
- Backend: Firebase
  - Auth: Email/Password; each user has `displayName`.
  - Firestore (durable): authoritative shape and minimal user records.
  - Realtime Database (ephemeral): presence, cursors, live transform deltas, and locks.
- Hosting/CI: Vercel (connected to GitHub). 
- AI Integration: Vercel AI SDK for command parsing and tool invocation.

Collaboration model:
- Selection‑before‑action: clicking selects; transforms only when selected.
- Lock on selection: RTDB `/locks/{shapeId}` via compare‑and‑set with TTL and `onDisconnect` cleanup. Locked objects show owner.
- Live transforms: broadcast high‑frequency deltas via RTDB during interaction; persist final state to Firestore on transform end.
- Conflict policy: Last‑Write‑Wins (LWW) using `updatedAt` (ms) and `updatedBy` (uid) on Firestore writes.
- Reconnection: on auth/network changes, re‑subscribe listeners; presence uses timestamps and is pruned.

## 5) Data Model (Essential Fields)
- Firestore `shapes/{id}`
  - `type: 'rect' | 'ellipse' | 'text'`
  - `x, y, width, height, rotation, fill, stroke, zIndex`
  - `updatedAt (ms), updatedBy (uid)`
- Firestore `users/{uid}`: `displayName, createdAt`
- RTDB `/presence/{uid}`: `{ name, cursor:{x,y}, selectionIds?:string[], updatedAt }`
- RTDB `/locks/{shapeId}`: `{ userId, acquiredAt, expiresAt }`
- RTDB `/transforms/{shapeId}`: ephemeral deltas during user interaction

## 6) Product Experience (User‑Facing)
- Presence & cursors: named cursors visible to all; identity consistent with auth.
- Canvas core: smooth pan/zoom; selection is unambiguous; transform handles are responsive.
- Shapes: begin with rectangles using a shared `ShapeBase` abstraction to add ellipses/text later without refactor.
- Predictability: when a shape is locked, only the owner can transform; others see the live motion and clear “being edited by …” indication.
- Reconnect safety: tabs can refresh mid‑operation; the canvas restores quickly and consistently.

## 7) Quality & Verification
Manual scenarios (derived from rubric):
- Two users drag the same shape simultaneously → convergent final state.
- Rapid edit storm (move/resize/rotate/color) → no ghosts/duplicates; smooth updates.
- Delete vs edit race → no partial remnants.
- Mid‑operation refresh → consistent state upon reload.
- Full disconnect (all users leave) and return → canvas intact.
- Network throttle to 0 for 30s and restore → state reconciles.

Automated checks (minimal but purposeful):
- Store/util contracts and Firestore/RTDB service APIs.
- Hook smoke tests with mocked listeners.
- Performance spot checks (no heavy canvas UI tests).

## 8) Milestones (One Feature per PRD → One PR per feature delivery)
1) Auth & Presence
- Email/password auth; presence in RTDB; named cursors; `onDisconnect` cleanup; re‑subscribe on reconnect.
- Acceptance: two browsers see each other’s named cursors with perceived <50ms latency; sign‑out removes presence promptly.

2) Canvas Core
- Full‑viewport stage; wheel zoom and drag‑to‑pan; memoized layers.
- Acceptance: ~60 FPS pan/zoom on typical laptop; no page scroll conflicts.

3) Shapes Abstraction & Persistence
- `ShapeBase` + `RectShape`; selection‑before‑action; Firestore create/read; LWW metadata.
- Acceptance: rectangles persist across reloads and remain consistent for all users.

4) Locking
- RTDB locks on selection (CAS + TTL + onDisconnect); locked styling and ownership indicator.
- Acceptance: only lock owner can transform; others see “being edited by …”.

5) Transforms (Finalize)
- Move/resize/rotate gated by lock; persist final state to Firestore with LWW.
- Acceptance: predictable results under contention; no duplicates/ghosts.

6) Live Transform Streaming (RTDB)
- Broadcast deltas during interaction; throttle sensibly; re‑subscribe on reconnect.
- Acceptance: perceived <100ms object updates; smooth motion for remote users.

7) Additional Shapes & Text (as time allows)
- Ellipse/text built on `ShapeBase`; basic formatting for text.
- Acceptance: new types integrate without architecture changes.

8) AI Agent (Post‑Core)
- Vercel AI SDK; commands for create/manipulate/layout/complex tasks; shared results.
- Acceptance: 6+ command types; multi‑step actions (e.g., login form) place multiple elements neatly; sub‑2s simple responses.

## 9) Security & Operational Considerations
- Auth required for writes; least‑privilege Firebase rules for Firestore and RTDB.
- Input validation for transform bounds and allowed fields.
- Guard against listener leaks and duplicate subscriptions; ensure cleanup paths.
- Use server timestamps when feasible; otherwise reconcile with logical clocks.

## 10) Deployment & Environments
- Localhost for development verification before commits.
- Vercel previews on branches and production on main; environment variables configured in Vercel.

## 11) Open Questions
- Exact throttling cadence for transforms (30–60Hz?) per real‑world performance.
- Lock TTL duration and UX for expired/abandoned locks.
- Degree of multi‑select support before AI layer; priority vs schedule.
- Minimal audit trails (users, shapes) needed beyond `updatedAt/updatedBy`.

## 12) Decision Log (Initial)
- Selection‑before‑action adopted to reduce accidental edits and clarify lock semantics.
- Locking on selection via RTDB chosen over optimistic merge to prevent race conditions.
- Hybrid storage: RTDB for presence/transforms/locks; Firestore for durable shapes/users.
- LWW conflicts with explicit `updatedAt/updatedBy` for predictability and simplicity.
- Vercel AI SDK chosen for agent orchestration; all state changes flow through the same data paths for multi‑user consistency.
