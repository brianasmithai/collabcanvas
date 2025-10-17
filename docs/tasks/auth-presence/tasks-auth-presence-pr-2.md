# CollabCanvas — Auth & Presence Task List (Single Pull Request)

> **Based on PRD:** `docs/tasks/auth-presence/prd-auth-presence.md` (reference copy; canonical: `docs/prd-auth-presence.md`)  
> **Stack:** React + Vite + TypeScript + Konva/react-konva + Zustand + Firebase (Auth + Firestore + RTDB) + Vercel (hosting) + Vercel AI SDK (agent)  
> **Format:** Single PR with actionable subtasks and exact files.  
> **Location:** `docs/tasks/auth-presence/` (store this PR’s tasks and PRD copy here)  
> **Focus:** Auth flows — email/password, displayName capture, user doc bootstrap

---

## PR 2 — Authentication and User Document
**Goal:** Implement email/password auth, capture `displayName`, and create Firestore `users/{uid}` on first login.

- [ ] Implement auth service (sign up/in/out, onAuthStateChanged)
  **Files:** `src/services/auth.service.ts` (new)

- [ ] Add displayName capture UI and update flow
  **Files:** `src/components/auth/DisplayNameModal.tsx` (new), `src/hooks/useDisplayName.ts` (new)

- [ ] Bootstrap user Firestore document on first login
  **Files:** `src/services/user.service.ts` (new)

- [ ] App-level auth provider and route guard scaffold
  **Files:** `src/state/auth.store.ts` (new), `src/providers/AuthProvider.tsx` (new)

- [ ] Minimal auth screens (placeholder)
  **Files:** `src/pages/Login.tsx` (new), `src/pages/Logout.tsx` (new)

- [ ] Firebase project setup and deployment configuration
  **Files:** `firebase.json` (new), `.firebaserc` (new)

**Tests (bare-bones):** Auth service contracts and user bootstrap  
- [ ] Add `auth.service.test.ts` — sign in/out, state change callbacks  
  **Files:** `tests/auth.service.test.ts` (new)
- [ ] Add `user.service.test.ts` — creates `users/{uid}` with `{displayName, createdAt}`  
  **Files:** `tests/user.service.test.ts` (new)

---

## Known Issues & Future Improvements
- **Targets:** Stable auth lifecycle and guaranteed `users/{uid}` creation.
- **Future Enhancements:**  
  - [ ] Replace placeholders with polished UI; add error states  
  - [ ] Add password reset and email verification

---

### Notes & Conventions
- Centralize all Firebase Auth interop in `auth.service.ts`; components use hooks/stores.  
- Avoid duplicate listeners; expose unsubscribe functions and ensure cleanup.

