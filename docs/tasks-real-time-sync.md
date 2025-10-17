# CollabCanvas — Real-Time Sync Optimization Task Lists (Detailed, Grouped by Pull Requests)

> **Based on PRD:** `prd-real-time-sync.md`  
> **Stack:** React + Vite + TypeScript + Konva/react-konva + Zustand + Firebase (Auth + Firestore + RTDB)  
> **Format:** Each PR has actionable subtasks, and **every subtask lists the exact files** created/edited.  
> **Focus:** Hybrid storage strategy with RTDB for real-time transforms and Firestore for persistence.

---

## PR 18 — RTDB Integration & Transform Service ✅
**Goal:** Set up Firebase Realtime Database integration and create transform service layer.

- [x] Create RTDB configuration and connection setup  
  **Files:** `src/config/firebaseClient.ts` (edit), `firebase.json` (edit)
- [x] Implement `transforms.ts` service for RTDB operations (CRUD, subscriptions)  
  **Files:** `src/services/transforms.ts` (new)
- [x] Add transform types and interfaces to support real-time operations  
  **Files:** `src/types.ts` (edit)
- [x] Create `useTransforms` hook for managing transform subscriptions  
  **Files:** `src/hooks/useTransforms.ts` (new)
- [x] Update Firebase security rules for RTDB transforms path  
  **Files:** `firebase.json` (edit), `README.md` (edit: security rules section)

**Tests (bare-bones):** Service and hook contract verification.  
- [x] Add `transforms.service.test.ts` - Test CRUD operations, subscription handling, error cases  
  **Files:** `tests/transforms.service.test.ts` (new)
- [x] Add `transforms.hook.test.tsx` - Test hook subscription, state updates, cleanup  
  **Files:** `tests/transforms.hook.test.tsx` (new)

---

## PR 19 — Hybrid Storage Service Layer ✅
**Goal:** Create unified service layer that manages both RTDB (real-time) and Firestore (persistent) data.

- [x] Update `rectangles.ts` service to integrate with transform service  
  **Files:** `src/services/rectangles.ts` (edit) - ✅ Implemented `HybridRectanglesService` class
- [x] Implement transform pipeline: RTDB → Firestore synchronization  
  **Files:** `src/services/rectangles.ts` (edit) - ✅ Added `isTransformComplete` flag and debounced sync
- [x] Add conflict resolution logic (Last-Write-Wins with timestamps)  
  **Files:** `src/services/rectangles.ts` (edit), `src/types.ts` (edit) - ✅ Implemented with `updatedAt` timestamps
- [x] Update `useRectangles` hook to handle hybrid data sources  
  **Files:** `src/hooks/useRectangles.ts` (edit) - ✅ Added `isTransformComplete` parameter support
- [x] Add data consistency validation between RTDB and Firestore  
  **Files:** `src/services/rectangles.ts` (edit) - ✅ Added `validateConsistency` method

**Tests (bare-bones):** Hybrid storage integration and conflict resolution.  
- [x] Extend `rectangles.service.test.ts` - Test hybrid operations, conflict resolution, data consistency  
  **Files:** `tests/rectangles.service.test.ts` (edit) - ✅ Updated with hybrid storage tests
- [x] Extend `rectangles.hook.test.tsx` - Test hybrid data handling, state synchronization  
  **Files:** `tests/rectangles.hook.test.tsx` (edit) - ✅ Updated with hybrid data handling tests

**Additional Work Completed:**
- [x] Fixed RTDB security rules for presence and transforms
- [x] Added comprehensive debug logging throughout the pipeline
- [x] Implemented ghost handle cleanup when shapes are deleted
- [x] Added cross-user selection synchronization
- [x] Created comprehensive automated test suite for RTDB rules and services

---

## PR 20 — Real-Time Transform Synchronization ✅ COMPLETED
**Goal:** Implement real-time shape transformations with instant synchronization.

- [x] Update `CanvasStage` to use real-time transforms during drag operations  
  **Files:** `src/components/CanvasStage.tsx` (edit) - ✅ Integrated with hybrid storage pipeline
- [x] Update `RectNode` to handle real-time transform updates from other users  
  **Files:** `src/components/RectNode.tsx` (edit) - ✅ Added debug logging and improved event handling
- [x] Implement throttling for high-frequency transform updates (30-60 Hz)  
  **Files:** `src/utils/throttle.ts` (edit), `src/components/CanvasStage.tsx` (edit) - ✅ Throttling implemented in `useRectangleInteraction`
- [x] Add visual feedback for objects being edited by other users  
  **Files:** `src/components/RectNode.tsx` (edit), `src/utils/colors.ts` (edit) - ✅ Visual feedback system implemented
- [x] Handle resize anchor points and rotation synchronization  
  **Files:** `src/components/RectNode.tsx` (edit), `src/services/transforms.ts` (edit) - ✅ Resize and rotation sync working

**Tests (bare-bones):** Real-time synchronization and visual feedback.  
- [x] Extend `CanvasStage.render.test.tsx` - Test real-time transform handling  
  **Files:** `tests/CanvasStage.render.test.tsx` (edit) - ✅ Added presence integration and visual feedback tests
- [x] Extend `RectNode.behavior.test.tsx` - Test real-time updates, visual feedback  
  **Files:** `tests/RectNode.behavior.test.tsx` (edit) - ✅ Added comprehensive visual feedback tests
- [x] Add `colors.test.ts` - Test color utility and visual feedback states  
  **Files:** `tests/colors.test.ts` (new) - ✅ Complete test coverage for color system

**Additional Work Completed:**
- [x] Created comprehensive color utility system for user assignments and visual feedback
- [x] Implemented visual feedback for objects being edited by other users (dashed borders, user colors)
- [x] Enhanced CanvasStage to pass editing user information to RectNode components
- [x] Updated CursorLayer to use new color utility system
- [x] Added comprehensive test coverage for all visual feedback functionality

---

## PR 20A — Live Transform Synchronization ✅ COMPLETED
**Goal:** Implement true real-time collaboration where users see live transformations as they happen, not just final states.

- [x] **CRITICAL: Implement live transform subscriptions for real-time updates**  
  **Files:** `src/hooks/useRectangles.ts` (edit) - ✅ Added liveTransforms state and subscription
- [x] **CRITICAL: Apply live transforms to visual shapes in real-time**  
  **Files:** `src/components/CanvasStage.tsx` (edit) - ✅ Added real-time Konva node updates with requestAnimationFrame
- [x] **CRITICAL: Distinguish between live transforms and final states**  
  **Files:** `src/services/transforms.ts` (edit) - ✅ Optimized active transform handling
- [x] **CRITICAL: Handle live transform cleanup when operations complete**  
  **Files:** `src/hooks/useRectangleInteraction.ts` (edit) - ✅ Added cleanup on unmount
- [x] **CRITICAL: Optimize live transform performance (sub-100ms latency)**  
  **Files:** `src/services/transforms.ts` (edit) - ✅ Skip timestamp checking for active transforms

**Tests (bare-bones):** Live transform synchronization and performance.  
- [x] Add `live-transforms.test.ts` - Test real-time transform subscriptions and application  
  **Files:** `tests/live-transforms.test.ts` (new) - ✅ Comprehensive test coverage
- [x] Extend `rectangles.hook.test.tsx` - Test live transform handling in hybrid storage  
  **Files:** `tests/rectangles.hook.test.tsx` (edit) - ✅ Added live transform subscription tests
- [x] Add performance tests for sub-100ms live transform latency  
  **Files:** `tests/live-transform-performance.test.ts` (new) - ✅ Performance validation tests

**Success Criteria:**
- ✅ Bob drags a rectangle → Alice sees it moving in real-time
- ✅ Bob resizes a rectangle → Alice sees it resizing in real-time  
- ✅ Bob rotates a rectangle → Alice sees it rotating in real-time
- ✅ All live transforms complete within 100ms latency target
- ✅ No performance degradation with multiple live transforms

**Additional Work Completed:**
- [x] Enhanced useRectangles hook to expose liveTransforms for real-time visual updates
- [x] Updated CanvasStage to apply live transforms using requestAnimationFrame for smooth updates
- [x] Optimized transform service to skip conflict resolution for active transforms (sub-100ms latency)
- [x] Added comprehensive test coverage for live transform functionality
- [x] Implemented proper cleanup of live transforms on component unmount
- [x] Added performance tests to validate sub-100ms latency targets

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
