# CollabCanvas — MVP Task Lists (Detailed, Grouped by Pull Requests) — *with Bare‑Bones Tests*

> Stack: **React + Vite + TypeScript + Konva/react-konva + Zustand + Firebase (Auth + Firestore + RTDB)**. Deploy on **Vercel** (or Firebase Hosting).  
> Format: Each PR has actionable subtasks, and **every subtask lists the exact files** created/edited.  
> **New:** Minimal tests added only where they add quick verification for agent‑generated code (no over‑testing).

---

## Project File Structure (target)

```
collabcanvas/
├─ .env.local
├─ .gitignore
├─ README.md
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ vitest.config.ts                 # Test runner config (Vitest + jsdom)
├─ setupTests.ts                    # Testing library setup
├─ public/
│  └─ favicon.svg
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ index.css
   ├─ types.ts
   ├─ config/
   │   └─ firebaseClient.ts
   ├─ state/
   │   └─ uiStore.ts
   ├─ services/
   │   ├─ rectangles.ts
   │   └─ presence.ts
   ├─ hooks/
   │   ├─ useRectangles.ts
   │   └─ usePresence.ts
   ├─ components/
   │   ├─ CanvasStage.tsx
   │   ├─ RectNode.tsx
   │   ├─ CursorLayer.tsx
   │   ├─ PresenceList.tsx
   │   ├─ AuthGate.tsx
   │   └─ TopBar.tsx
   └─ utils/
       ├─ geometry.ts
       └─ throttle.ts
tests/
├─ uiStore.test.ts
├─ geometry.test.ts
├─ throttle.test.ts
├─ CanvasStage.render.test.tsx
├─ RectNode.behavior.test.tsx
├─ presence.hook.test.tsx
├─ rectangles.hook.test.tsx
└─ AuthGate.render.test.tsx
```

---

## PR 1 — Vite/React/TypeScript Scaffold
**Goal:** Base app bootstrapped with React + TS.

- [X] Initialize project with Vite (react-ts template)  
  **Files:** `package.json` (new), `tsconfig.json` (new), `vite.config.ts` (new), `index.html` (new), `src/main.tsx` (new), `src/App.tsx` (new), `src/index.css` (new)
- [X] Install deps: `konva react-konva zustand firebase`  
  **Files:** `package.json` (edit), lockfile (auto)
- [ ] Add basic scripts: `dev`, `build`, `preview`  
  **Files:** `package.json` (edit)
- [ ] Add `.gitignore`, starter `README.md`  
  **Files:** `.gitignore` (new), `README.md` (new)

**Tests (bare‑bones):** *None for this PR.*

---

## PR 2 — Firebase Wiring (Auth + Firestore + RTDB)
**Goal:** Configure Firebase SDK, env, and exports.

- [ ] Create Firebase project; enable Email/Password Auth, Firestore, RTDB  
  **Files:** `README.md` (edit: setup steps & console notes)
- [ ] Add environment variables (Vite style `VITE_*`)  
  **Files:** `.env.local` (new)
- [ ] Implement `firebaseClient.ts` (app init, export `auth`, `firestore`, `rtdb`)  
  **Files:** `src/config/firebaseClient.ts` (new)
- [ ] Verify build uses envs correctly (no hardcoded secrets)  
  **Files:** `vite.config.ts` (edit if needed), `README.md` (edit: env table)

**Tests (bare‑bones):** *None (SDK init typically mocked; skip to save time).*

---

## PR 3 — Core Types & Zustand Store
**Goal:** Define domain types and minimal UI state.

- [ ] Define `Rect` and `Presence` interfaces  
  **Files:** `src/types.ts` (new)
- [ ] Create `uiStore` (tool mode, zoom, selectionIds)  
  **Files:** `src/state/uiStore.ts` (new)
- [ ] Consume store in `App.tsx` for compile-time sanity (no UI change)  
  **Files:** `src/App.tsx` (edit)

**Tests (bare‑bones):** Verify store basics (setters update state).  
- [ ] Add `uiStore.test.ts` with minimal actions/asserts  
  **Files:** `tests/uiStore.test.ts` (new), `package.json` (edit: add `test` script if missing)

---

## PR 4 — Canvas Stage Shell (Konva)
**Goal:** Stage/Layer scaffold with pan/zoom plumbing.

- [ ] Implement `CanvasStage` with full‑viewport `Stage` + `Layer`  
  **Files:** `src/components/CanvasStage.tsx` (new)
- [ ] Add **wheel zoom** and **drag‑to‑pan**; keep scale/position in `uiStore`  
  **Files:** `src/components/CanvasStage.tsx` (edit), `src/state/uiStore.ts` (edit), `src/utils/geometry.ts` (new)
- [ ] Mount `CanvasStage` in the app shell  
  **Files:** `src/App.tsx` (edit)

**Tests (bare‑bones):** Render smoke + geometry math.  
- [ ] Add `CanvasStage.render.test.tsx` to ensure component mounts without Konva errors (jsdom)  
  **Files:** `tests/CanvasStage.render.test.tsx` (new)
- [ ] Add `geometry.test.ts` for simple helpers (e.g., clamp/normalize)  
  **Files:** `tests/geometry.test.ts` (new)

---

## PR 5 — Rectangle Node + Selection (Local)
**Goal:** Render rectangles and select via click (local data).

- [ ] Implement `RectNode` to render a single rectangle (`Rect` props)  
  **Files:** `src/components/RectNode.tsx` (new)
- [ ] Temporary local array of rectangles; click‑to‑select; selected styling  
  **Files:** `src/components/CanvasStage.tsx` (edit), `src/state/uiStore.ts` (edit)
- [ ] Visual selection handles (Konva Transformer placeholder)  
  **Files:** `src/components/CanvasStage.tsx` (edit), `src/components/RectNode.tsx` (edit)

**Tests (bare‑bones):** Minimal behavior.  
- [ ] Add `RectNode.behavior.test.tsx`: renders at x/y; selection toggles store on click  
  **Files:** `tests/RectNode.behavior.test.tsx` (new)

---

## PR 6 — Create / Move / Resize / Rotate / Delete (Local)
**Goal:** Local‑only transforms fully working.

- [ ] Add action to **create** a rectangle (toolbar button or hotkey)  
  **Files:** `src/App.tsx` (edit), `src/components/CanvasStage.tsx` (edit)
- [ ] **Drag** to move rectangle (update local state)  
  **Files:** `src/components/RectNode.tsx` (edit), `src/components/CanvasStage.tsx` (edit)
- [ ] **Resize/Rotate** via `Transformer` bound to selected rect  
  **Files:** `src/components/RectNode.tsx` (edit), `src/components/CanvasStage.tsx` (edit)
- [ ] **Delete** with Delete/Backspace  
  **Files:** `src/components/CanvasStage.tsx` (edit)
- [ ] Normalize math (bounds, rotation)  
  **Files:** `src/utils/geometry.ts` (edit)

**Tests (bare‑bones):** Single interaction smoke.  
- [ ] Extend `RectNode.behavior.test.tsx`: simulate drag start/end to assert handler calls (don’t assert Konva internals)  
  **Files:** `tests/RectNode.behavior.test.tsx` (edit)

---

## PR 7 — Presence & Cursors (RTDB)
**Goal:** Real‑time presence and cursor rendering.

- [ ] `presence.ts`: set/update presence; `onDisconnect()` cleanup  
  **Files:** `src/services/presence.ts` (new)
- [ ] `usePresence`: subscribe to `/presence/*`; return map of users by `uid`  
  **Files:** `src/hooks/usePresence.ts` (new)
- [ ] `CursorLayer`: draw remote cursors with user names  
  **Files:** `src/components/CursorLayer.tsx` (new)
- [ ] `PresenceList`: show who’s online; mount in app shell  
  **Files:** `src/components/PresenceList.tsx` (new), `src/App.tsx` (edit)

**Tests (bare‑bones):** Hook contract only (mock RTDB).  
- [ ] `presence.hook.test.tsx`: mock subscription; ensure hook returns users map and updates on emit  
  **Files:** `tests/presence.hook.test.tsx` (new)

---

## PR 8 — Firestore Rectangles (Durable Model)
**Goal:** Replace local array with Firestore‑backed rectangles.

- [ ] `rectangles.ts`: CRUD (add/update/delete), converters, query subscription  
  **Files:** `src/services/rectangles.ts` (new), `src/types.ts` (edit)
- [ ] `useRectangles`: subscribe with `onSnapshot` and expose list + ops  
  **Files:** `src/hooks/useRectangles.ts` (new)
- [ ] Wire `CanvasStage` to use hook/service for read/write  
  **Files:** `src/components/CanvasStage.tsx` (edit), `src/components/RectNode.tsx` (edit)

**Tests (bare‑bones):** Hook snapshot flow (mock Firestore).  
- [ ] `rectangles.hook.test.tsx`: mock `onSnapshot` to emit docs; assert hook returns list and update applies LWW fields  
  **Files:** `tests/rectangles.hook.test.tsx` (new)

---

## PR 9 — Transform Sync Strategy (Throttle + LWW)
**Goal:** Smooth transforms, minimal writes, predictable conflicts.

- [ ] Add `throttle` helper for high‑frequency events  
  **Files:** `src/utils/throttle.ts` (new)
- [ ] During drag/resize/rotate: update UI immediately; **persist only on drag end** (or every N ms)  
  **Files:** `src/components/RectNode.tsx` (edit), `src/services/rectangles.ts` (edit)
- [ ] Stamp `updatedAt`/`updatedBy`; define **LWW** conflict policy  
  **Files:** `src/services/rectangles.ts` (edit), `README.md` (edit: policy section)

**Tests (bare‑bones):** Utility only.  
- [ ] `throttle.test.ts`: ensures calls are limited to cadence and final call delivered  
  **Files:** `tests/throttle.test.ts` (new)

---

## PR 10 — Auth UI (Password) & Gate
**Goal:** Minimal auth UI and a protected app shell.

- [ ] `AuthGate` with email/password login + register  
  **Files:** `src/components/AuthGate.tsx` (new)
- [ ] Show `AuthGate` when unauthenticated; else show canvas  
  **Files:** `src/App.tsx` (edit)
- [ ] Include `displayName` in presence payload  
  **Files:** `src/services/presence.ts` (edit), `src/hooks/usePresence.ts` (edit)

**Tests (bare‑bones):** Render only.  
- [ ] `AuthGate.render.test.tsx`: renders form; submit handler is callable (mocked)  
  **Files:** `tests/AuthGate.render.test.tsx` (new)

---

## PR 11 — Persistence on Reload & Sanity Tests
**Goal:** Verify rectangles reload after refresh/close and basic UX states.

- [ ] Ensure Firestore hydration on mount; add loading/empty indicators  
  **Files:** `src/hooks/useRectangles.ts` (edit), `src/App.tsx` (edit)
- [ ] README manual tests (two browsers; create, move, refresh, delete)  
  **Files:** `README.md` (edit)

**Tests (bare‑bones):** *Covered by hook tests in PR 8; no extra automated tests here.*

---

## PR 12 — Security Rules (Firestore + RTDB)
**Goal:** Auth‑gated access with minimal safe rules.

- [ ] Firestore Rules for `rectangles` (auth required; field allowlist)  
  **Files:** `README.md` (edit: paste‑ready rule snippet)
- [ ] RTDB Rules for `/presence` (auth required; users write own node)  
  **Files:** `README.md` (edit: paste‑ready rule snippet)

**Tests (bare‑bones):** *None (rules are best validated manually in console for MVP).*

---

## PR 13 — Deploy (Vercel or Firebase Hosting)
**Goal:** Public URL with envs configured.

- [ ] Configure hosting; set `VITE_*` envs  
  **Files:** `README.md` (edit: deploy steps), `.env.local` (verify)
- [ ] Build & deploy; verify on prod with two browsers  
  **Files:** `README.md` (edit: verification checklist)

**Tests (bare‑bones):** *None.*

---

## PR 14 — Demo Polish & README
**Goal:** Friendly demo and clear operator instructions.

- [ ] Add `TopBar` (app name, sign out)  
  **Files:** `src/components/TopBar.tsx` (new), `src/App.tsx` (edit)
- [ ] Finalize README (run/deploy/test, known limits, shortcuts)  
  **Files:** `README.md` (edit)
- [ ] Tag release `v0.1.0‑mvp`  
  **Files:** (git tag outside repo), `README.md` (edit: changelog/notes)

---

## Test Harness Bootstrap (add to PR 1 or as PR 1a)
**Goal:** Minimal test runner + utils so the above tests can run quickly.

- [ ] Install dev deps: `vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @types/jest`  
  **Files:** `package.json` (edit)
- [ ] Add scripts: `"test": "vitest", "test:ui": "vitest --ui", "test:run": "vitest run"`  
  **Files:** `package.json` (edit)
- [ ] Create `vitest.config.ts` (jsdom env + setup file)  
  **Files:** `vitest.config.ts` (new)
- [ ] Create `setupTests.ts` (import `@testing-library/jest-dom`)  
  **Files:** `setupTests.ts` (new)
- [ ] Create empty `tests/` folder with placeholder `.gitkeep`  
  **Files:** `tests/.gitkeep` (new)

---

### Notes & Conventions
- Keep tests **surgical**: verify wiring/behavior, not library internals.
- Prefer **hook and utility tests** over heavy canvas interactions.
- If a test becomes flaky/time‑consuming, drop it (MVP speed wins).