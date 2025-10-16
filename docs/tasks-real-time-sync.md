# CollabCanvas — Real-Time Sync Optimization Task Lists (Detailed, Grouped by Pull Requests)

> **Based on PRD:** `prd-real-time-sync.md`  
> **Stack:** React + Vite + TypeScript + Konva/react-konva + Zustand + Firebase (Auth + Firestore + RTDB)  
> **Format:** Each PR has actionable subtasks, and **every subtask lists the exact files** created/edited.  
> **Focus:** Hybrid storage strategy with RTDB for real-time transforms and Firestore for persistence.

---

## PR 18 — RTDB Integration & Transform Service
**Goal:** Set up Firebase Realtime Database integration and create transform service layer.

- [ ] Create RTDB configuration and connection setup  
  **Files:** `src/config/firebaseClient.ts` (edit), `firebase.json` (edit)
- [ ] Implement `transforms.ts` service for RTDB operations (CRUD, subscriptions)  
  **Files:** `src/services/transforms.ts` (new)
- [ ] Add transform types and interfaces to support real-time operations  
  **Files:** `src/types.ts` (edit)
- [ ] Create `useTransforms` hook for managing transform subscriptions  
  **Files:** `src/hooks/useTransforms.ts` (new)
- [ ] Update Firebase security rules for RTDB transforms path  
  **Files:** `firebase.json` (edit), `README.md` (edit: security rules section)

**Tests (bare-bones):** Service and hook contract verification.  
- [ ] Add `transforms.service.test.ts` - Test CRUD operations, subscription handling, error cases  
  **Files:** `tests/transforms.service.test.ts` (new)
- [ ] Add `transforms.hook.test.tsx` - Test hook subscription, state updates, cleanup  
  **Files:** `tests/transforms.hook.test.tsx` (new)

---

## PR 19 — Hybrid Storage Service Layer
**Goal:** Create unified service layer that manages both RTDB (real-time) and Firestore (persistent) data.

- [ ] Update `rectangles.ts` service to integrate with transform service  
  **Files:** `src/services/rectangles.ts` (edit)
- [ ] Implement transform pipeline: RTDB → Firestore synchronization  
  **Files:** `src/services/rectangles.ts` (edit)
- [ ] Add conflict resolution logic (Last-Write-Wins with timestamps)  
  **Files:** `src/services/rectangles.ts` (edit), `src/types.ts` (edit)
- [ ] Update `useRectangles` hook to handle hybrid data sources  
  **Files:** `src/hooks/useRectangles.ts` (edit)
- [ ] Add data consistency validation between RTDB and Firestore  
  **Files:** `src/services/rectangles.ts` (edit)

**Tests (bare-bones):** Hybrid storage integration and conflict resolution.  
- [ ] Extend `rectangles.service.test.ts` - Test hybrid operations, conflict resolution, data consistency  
  **Files:** `tests/rectangles.service.test.ts` (edit)
- [ ] Extend `rectangles.hook.test.tsx` - Test hybrid data handling, state synchronization  
  **Files:** `tests/rectangles.hook.test.tsx` (edit)

---

## PR 20 — Real-Time Transform Synchronization
**Goal:** Implement real-time shape transformations with instant synchronization.

- [ ] Update `CanvasStage` to use real-time transforms during drag operations  
  **Files:** `src/components/CanvasStage.tsx` (edit)
- [ ] Update `RectNode` to handle real-time transform updates from other users  
  **Files:** `src/components/RectNode.tsx` (edit)
- [ ] Implement throttling for high-frequency transform updates (30-60 Hz)  
  **Files:** `src/utils/throttle.ts` (edit), `src/components/CanvasStage.tsx` (edit)
- [ ] Add visual feedback for objects being edited by other users  
  **Files:** `src/components/RectNode.tsx` (edit), `src/utils/colors.ts` (edit)
- [ ] Handle resize anchor points and rotation synchronization  
  **Files:** `src/components/RectNode.tsx` (edit), `src/services/transforms.ts` (edit)

**Tests (bare-bones):** Real-time synchronization and visual feedback.  
- [ ] Extend `CanvasStage.render.test.tsx` - Test real-time transform handling  
  **Files:** `tests/CanvasStage.render.test.tsx` (edit)
- [ ] Extend `RectNode.behavior.test.tsx` - Test real-time updates, visual feedback  
  **Files:** `tests/RectNode.behavior.test.tsx` (edit)

---

## PR 21 — Performance Optimization & Monitoring
**Goal:** Add performance monitoring, bulk operations, and optimization tools.

- [ ] Create performance monitoring utility with latency tracking  
  **Files:** `src/utils/performance.ts` (new)
- [ ] Enhance `DebugPanel` with performance metrics display  
  **Files:** `src/components/DebugPanel.tsx` (edit)
- [ ] Add bulk object creation tool (configurable count)  
  **Files:** `src/components/DebugPanel.tsx` (edit)
- [ ] Implement multi-select capability for testing bulk operations  
  **Files:** `src/components/CanvasStage.tsx` (edit), `src/state/uiStore.ts` (edit)
- [ ] Add connection status indicators and network monitoring  
  **Files:** `src/components/DebugPanel.tsx` (edit), `src/hooks/useTransforms.ts` (edit)

**Tests (bare-bones):** Performance monitoring and bulk operations.  
- [ ] Add `performance.test.ts` - Test latency tracking, metrics collection  
  **Files:** `tests/performance.test.ts` (new)
- [ ] Extend `DebugPanel.test.tsx` - Test performance display, bulk operations  
  **Files:** `tests/DebugPanel.test.tsx` (edit)

---

## PR 22 — Network Resilience & Error Handling
**Goal:** Implement robust error handling and network disconnection management.

- [ ] Add network disconnection detection and handling  
  **Files:** `src/hooks/useTransforms.ts` (edit), `src/services/transforms.ts` (edit)
- [ ] Implement "release grip" behavior on network failure  
  **Files:** `src/components/CanvasStage.tsx` (edit), `src/hooks/useTransforms.ts` (edit)
- [ ] Add reconnection logic with state recovery  
  **Files:** `src/hooks/useTransforms.ts` (edit), `src/services/rectangles.ts` (edit)
- [ ] Implement graceful degradation for partial network failures  
  **Files:** `src/services/transforms.ts` (edit), `src/hooks/useTransforms.ts` (edit)
- [ ] Add comprehensive error logging and user feedback  
  **Files:** `src/utils/performance.ts` (edit), `src/components/DebugPanel.tsx` (edit)

**Tests (bare-bones):** Network resilience and error handling.  
- [ ] Extend `transforms.service.test.ts` - Test disconnection handling, reconnection  
  **Files:** `tests/transforms.service.test.ts` (edit)
- [ ] Add network resilience integration tests  
  **Files:** `tests/network-resilience.test.tsx` (new)

---

## PR 23 — Integration Testing & Performance Validation
**Goal:** Comprehensive testing of the hybrid storage system and performance validation.

- [ ] Create stress test scenarios (500+ objects, 5+ users)  
  **Files:** `tests/stress-tests.test.tsx` (new)
- [ ] Add latency monitoring tests (sub-100ms object sync, sub-50ms cursor sync)  
  **Files:** `tests/performance-tests.test.tsx` (new)
- [ ] Implement conflict resolution testing (simultaneous edits)  
  **Files:** `tests/conflict-resolution.test.tsx` (new)
- [ ] Add bulk operations testing (500+ object selection/movement)  
  **Files:** `tests/bulk-operations.test.tsx` (new)
- [ ] Update README with new architecture and performance targets  
  **Files:** `README.md` (edit)

**Tests (bare-bones):** Comprehensive integration and performance testing.  
- [ ] All new test files created and passing  
- [ ] Performance targets validated (sub-100ms object sync, 60 FPS)  
- [ ] Stress testing with 500+ objects successful

---

## Known Issues & Future Improvements

### Performance Targets (from PRD)
- **Object Sync**: Sub-100ms latency for shape transformations
- **Cursor Sync**: Sub-50ms latency for cursor positions  
- **Frame Rate**: Maintain 60 FPS during all interactions
- **Scalability**: Support 500+ objects with 5+ concurrent users
- **Reliability**: Zero visible lag during rapid multi-user edits

### Future Enhancements
- [ ] **Advanced Conflict Resolution**: Implement CRDT or Operational Transform for better conflict handling
- [ ] **Offline Support**: Add offline mode with sync on reconnection
- [ ] **Performance Analytics**: Detailed performance metrics and user behavior tracking
- [ ] **Multi-Shape Transformations**: Simultaneous resize/rotate of multiple objects

---

### Notes & Conventions
- Keep tests **surgical**: verify wiring/behavior, not library internals
- Prefer **hook and utility tests** over heavy canvas interactions  
- Performance tests should include real-world scenarios with multiple users
- All real-time operations must maintain sub-100ms latency targets
