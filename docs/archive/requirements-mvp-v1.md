# CollabCanvas — MVP Product Requirements (PRD, Draft)

> **Scope (MVP only):** Single global persistent canvas; one shape (**rectangle**) with create/resize/rotate; real‑time collaboration; basic auth; public deploy. Stack kept small and free.

---

## 1) User Stories (MVP roles)

### Editor (authenticated user)

- I can sign up/sign in so my cursor shows my name to others.
- I can see who else is online and their named cursors moving in real time.
- I can pan and zoom the canvas to navigate the workspace.
- I can create a rectangle on the canvas.
- I can select a rectangle and move, resize (via handles), and rotate it.
- I can delete a selected rectangle.
- I can see rectangles and edits made by other users appear near‑instantly.
- I can refresh or close/reopen the browser and the canvas state is restored (single global canvas persisted server‑side).

### Second Editor (another authenticated user, different browser)

- I quickly see user 1’s cursor, selections, and edits.
- My own edits sync to user 1 very quickly.
- If we edit the same rectangle concurrently, the system resolves the conflict predictably (**last‑write‑wins**).

### Tester

- I can open two windows, sign in as different users, and observe fast sync for cursors/objects under normal conditions.
- I can hard‑refresh one tab and confirm the state persists.

---

## 2) Key MVP Features

### Collaboration & Presence

- Real‑time multiuser sync for rectangles (create/move/resize/rotate/delete).
- Live cursors with user names; presence list (who’s online).
- Conflict resolution: **last‑write‑wins (LWW)** with clear, documented rules.

### Canvas

- Single global, persistent canvas (shared across all users).
- Smooth pan/zoom; selection and transform handles for rectangles.
- Performance targets (best‑effort) 60 FPS interactions; cursors feel ~instant; object ops feel snappy.

### Auth & Deployment

- Lightweight **password auth** for rapid testing.
- Publicly deployed URL accessible to 2+ simultaneous users.

---

## 3) Recommended Tech Stack (canonical MVP)

### Frontend

- **React + Vite + TypeScript**
- **Konva + react‑konva** for 2D canvas interactions and transforms
- **Zustand** for lightweight client state (tool mode, selection IDs, zoom)

### Realtime, Auth, Persistence (Firebase)

- **Firebase Auth** (password)
- **Cloud Firestore** for durable storage of rectangles (documents)
- **Firebase Realtime Database (RTDB)** for presence & cursors (ephemeral), using `onDisconnect()` for cleanup

### Hosting

- **Vercel** (or Firebase Hosting) for the frontend

**Why this stack?** Minimal, free‑tier friendly, and widely supported by code‑gen agents. Firestore’s document model matches simple rectangle objects well; RTDB provides robust presence semantics out of the box.

---

## 4) Not In Scope (Non‑Goals)

- Additional shapes (circles, lines, text), images, color/stroke pickers
- Multiple canvases/documents or per‑doc permissions
- Grouping, alignment tools, snapping, guides, rulers, layers
- Undo/redo; history/timelines
- Export (PNG/SVG/PDF) or import
- Comments, chat, or AI features

---

## 5) Acceptance Criteria (Demo Checklist)

- Two authenticated users in separate browsers see each other’s **named cursors** and **presence** in real time.
- Each user can **create**, **move**, **resize**, **rotate**, and **delete** rectangles; actions are quickly reflected for the other user.
- **State persists** across refresh/close/reopen (single global canvas).
- App is **publicly deployed**; login works end‑to‑end.
- Conflict policy (**LWW**) is documented and behaves as advertised.
- Interactions remain smooth with ~5 concurrent users and a few hundred rectangles.

---

## 6) Risks, Pitfalls & Mitigations

- **Concurrent edits / conflicts:** Two users transform the same rect simultaneously.\
  *Mitigation:* LWW on write; optimistic UI; throttle transform broadcasts; show “being edited by …” highlight on selection.
- **Performance hitches:** Frequent broadcasts during drag/resize can lag.\
  *Mitigation:* Throttle transform events (e.g., 30–60 Hz); interpolate cursors client‑side; avoid over‑rendering (memoization/layering).
- **Reconnection & consistency:** Missed events during brief disconnects.\
  *Mitigation:* On reconnect, reload authoritative rectangles from Firestore; apply fresh snapshots; RTDB re‑announces presence.
- **Precision of transforms:** Rotation + resize math and hit‑tests.\
  *Mitigation:* Use Konva/react‑konva transform APIs; store canonical rect `{id, x, y, width, height, rotation}`; normalize degrees.
- **Security:** Over‑permissive rules allow unintended writes.\
  *Mitigation:* Firebase Auth required; Firestore/RTDB rules restrict writes to authenticated users; validate allowed fields later if needed.
- **Scope creep:** Adding tools and shapes can derail MVP.\
  *Mitigation:* Hard stop at rectangle + transforms; defer polish until post‑MVP.
- **Mobile gestures:** Pinch/scroll conflicts.\
  *Mitigation:* Desktop‑first; prevent page scroll on canvas; basic wheel/pinch handling only.

---

## 7) Data Model (lean)

### Firestore (durable) — `rectangles` collection (each document)

- `id`: string (optional if doc ID is used as the canonical id)
- `x`: number
- `y`: number
- `width`: number
- `height`: number
- `rotation`: number (degrees)
- `updatedAt`: number (ms since epoch)
- `updatedBy`: string (Firebase Auth `uid`)

### Realtime Database (ephemeral) — `/presence/{uid}`

- `name`: string
- `cursor`: object `{ x: number, y: number }`
- `selectionIds`: array of string (selected rectangle ids)
- `updatedAt`: number (ms since epoch)

---

## 8) High‑Level Flow

1. User signs in → writes presence to RTDB and joins presence listeners; sets `onDisconnect()` to auto‑remove entry.
2. Client loads all rectangles from Firestore and subscribes via `onSnapshot`.
3. User actions (create/move/resize/rotate/delete): optimistic update locally; throttled realtime broadcasts (presence/selection via RTDB; transforms reflected to peers via Firestore snapshots or post‑drag persistence).
4. Other clients receive updates and sync local state.
5. On reconnect, re‑fetch Firestore state; RTDB re‑asserts presence.

---

## 9) Timing Targets (non‑binding, for UX feel)

- **Cursors & presence:** perceived < 150 ms on good connections.
- **Object edits:** perceived < 250–500 ms end‑to‑end with optimistic UI.
- **Interaction smoothness:** ~60 FPS when dragging/resizing rectangles on a typical laptop.

---

## 10) Testing Checklist (brief)

- Two browsers, two accounts; verify presence, named cursors, and fast sync.
- Create 50–200 rectangles; verify transforms are smooth and synced.
- Close/reopen one browser; verify canvas persists.
- Simultaneous edit of the same rectangle; verify **LWW** behavior matches documentation.

---

**Decision Log (MVP):**

- Canvas library: **Konva + react‑konva**
- State store: **Zustand**
- Backend: **Firebase (Auth + Firestore + RTDB for presence)**
- Auth mode: **Password**
- Deploy: **Vercel** (or Firebase Hosting)


