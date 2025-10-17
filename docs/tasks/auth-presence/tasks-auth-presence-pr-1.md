# CollabCanvas — Auth & Presence Task List (Single Pull Request)

> **Based on PRD:** `docs/tasks/auth-presence/prd-auth-presence.md` (reference copy; canonical: `docs/prd-auth-presence.md`)  
> **Stack:** React + Vite + TypeScript + Konva/react-konva + Zustand + Firebase (Auth + Firestore + RTDB) + Vercel (hosting) + Vercel AI SDK (agent)  
> **Format:** Single PR with actionable subtasks and exact files.  
> **Location:** `docs/tasks/auth-presence/` (store this PR’s tasks and PRD copy here)  
> **Focus:** Initialize Firebase clients, env wiring, and data types

---

## PR 1 — Bootstrap Firebase, Env, and Types
**Goal:** Establish Firebase initialization (Auth/Firestore/RTDB), environment config, and typed models for users and presence to unblock downstream auth and presence work.

- [x] Set up basic Vite + React + TypeScript project structure
  **Files:** `package.json` (new), `vite.config.ts` (new), `index.html` (new), `tsconfig.json` (new), `src/main.tsx` (new)

- [x] Create environment loader and config
  **Files:** `src/config/env.ts` (new)

- [x] Initialize Firebase app and service singletons
  **Files:** `src/lib/firebase/app.ts` (new), `src/lib/firebase/auth.ts` (new), `src/lib/firebase/firestore.ts` (new), `src/lib/firebase/rtdb.ts` (new)

- [x] Define core types for Auth user and Presence payloads
  **Files:** `src/types/auth.ts` (new), `src/types/presence.ts` (new)

- [x] Add lightweight logger utility for diagnostics
  **Files:** `src/utils/logger.ts` (new)

- [x] Seed minimal Firebase security rules (scaffold only)
  **Files:** `firebase/firestore.rules` (new), `firebase/database.rules.json` (new)

- [x] Set up Vitest baseline and test setup file
  **Files:** `tests/setup/vitest.setup.ts` (new)

**Tests (bare-bones):** Basic wiring and type contracts  
- [x] Add `firebase-init.test.ts` — loads env, creates singletons, no duplicate apps  
  **Files:** `tests/firebase-init.test.ts` (new)
- [x] Add `presence.types.test.ts` — validates type guards for presence payload  
  **Files:** `tests/presence.types.test.ts` (new)

---

## Known Issues & Future Improvements
- **Targets:** Enable downstream Auth/state hooks and Presence services to import stable clients/types.
- **Future Enhancements:**  
  - [ ] Flesh out security rules and add emulator-based validation in a later PR  
  - [ ] Add strict runtime validation (e.g., Zod) for env and presence payloads

---

### Notes & Conventions
- Keep service initializers pure and side-effect free; export singletons lazily.  
- Prefer explicit, named exports from `src/lib/firebase/*`.  
- Tests should run headless and not require a live Firebase project; mock SDKs where possible.

