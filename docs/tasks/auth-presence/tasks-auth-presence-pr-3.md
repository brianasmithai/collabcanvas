# CollabCanvas — Auth & Presence Task List (Single Pull Request)

> **Based on PRD:** `docs/tasks/auth-presence/prd-auth-presence.md` (reference copy; canonical: `docs/prd-auth-presence.md`)  
> **Stack:** React + Vite + TypeScript + Konva/react-konva + Zustand + Firebase (Auth + Firestore + RTDB) + Vercel (hosting) + Vercel AI SDK (agent)  
> **Format:** Single PR with actionable subtasks and exact files.  
> **Location:** `docs/tasks/auth-presence/` (store this PR’s tasks and PRD copy here)  
> **Focus:** Presence service (RTDB), cursor updates, listeners, and presence UI

---

## PR 3 — Real-Time Presence Service and UI
**Goal:** Implement RTDB presence lifecycle, cursor updates with throttling, re-subscription on reconnect, and a simple online list + named cursors.

- [ ] Implement presence service (write, onDisconnect, subscribe, prune)
  **Files:** `src/services/presence.service.ts` (new)

- [ ] Throttled cursor updater and stable color util
  **Files:** `src/utils/throttle.ts` (new), `src/utils/color.ts` (new)

- [ ] Presence hook and store for React consumption
  **Files:** `src/hooks/usePresence.ts` (new), `src/state/presence.store.ts` (new)

- [ ] UI: Named cursor overlay and online list tray
  **Files:** `src/components/presence/CursorLayer.tsx` (new), `src/components/presence/OnlineList.tsx` (new)

- [ ] Reconnect/resubscribe handling and dedupe of listeners
  **Files:** `src/lib/realtime/subscriptions.ts` (new)

**Tests (bare-bones):** Service contracts and throttling behavior  
- [ ] Add `presence.service.test.ts` — create/remove, subscribe, prune stale  
  **Files:** `tests/presence.service.test.ts` (new)
- [ ] Add `throttle.test.ts` — ensures ~10 Hz updates and trailing flush  
  **Files:** `tests/throttle.test.ts` (new)

---

## Known Issues & Future Improvements
- **Targets:** Perceived cursor latency <50 ms with throttled writes. Robust reconnect flows.
- **Future Enhancements:**  
  - [ ] Server-side pruning with Cloud Functions (cron)  
  - [ ] Multi-session policy and deduplication strategy

---

### Notes & Conventions
- Use `onDisconnect()` for cleanup; also include `updatedAt` timestamps for client-side prune.  
- Dedupe subscriptions; centralize set-up/tear-down in `subscriptions.ts`.

