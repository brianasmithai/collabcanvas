# CollabCanvas Progress & Decision Log

## Status
- Phase 1 (documentation) restarted and updated from `CollabCanvas.md` + `CollabCanvasRubric.md`

## Completed (Phase 1 so far)
- Regenerated master PRD strictly from rubric and CollabCanvas sources: `docs/prd-master.md`
- Archived legacy PRDs: `docs/archive/*-v1.md`

## Completed (PR1 - Auth & Presence Foundation)
- **Project scaffolding**: Vite + React + TypeScript setup with proper configuration
- **Firebase infrastructure**: App, Auth, Firestore, RTDB singletons with proper initialization
- **Type system**: Complete auth and presence type definitions with runtime type guards
- **Testing framework**: Vitest setup with 30 passing tests (Firebase singletons + type guards)
- **Security rules**: Firestore and RTDB security rules scaffold (ready for deployment)
- **Logger utility**: Environment-aware logging system for diagnostics

**Key files created**: `package.json`, `vite.config.ts`, `src/config/env.ts`, `src/lib/firebase/*`, `src/types/*`, `src/utils/logger.ts`, `firebase/*.rules`, `tests/setup/vitest.setup.ts`, `tests/*.test.ts`

## Next
- Regenerate initial sub-PRDs (rubric-aligned):
  - `docs/prd-auth-presence.md`
  - `docs/prd-canvas-core.md`
  - `docs/prd-shapes-basic.md`
  - `docs/prd-persistence.md`
- Update `docs/architecture_diagram_02.mmd` if further deltas after sub-PRDs

## Decisions
- Firebase Auth + Firestore + RTDB; Vercel hosting; Vercel AI SDK for agentic layer
- Selection-before-action, locks (CAS/TTL/onDisconnect), RTDB live transforms → Firestore final
- LWW for conflicts; reconnection and presence robustness prioritized

## Known Issues & Future Improvements (from PR1)
- ✅ **Environment variable management**: RESOLVED - Added comprehensive environment variable documentation to README
- ✅ **Firebase project setup**: RESOLVED - Added Firebase project setup task to PR 2
- ✅ **README documentation**: RESOLVED - Updated README with complete setup instructions and environment variable guidance
- **Future Enhancements**:  
  - [ ] Flesh out security rules and add emulator-based validation in a later PR  
  - [ ] Add strict runtime validation (e.g., Zod) for env and presence payloads
