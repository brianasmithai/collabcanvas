# PRD — Shapes Basic (Abstraction + Rectangle + Persistence)

## Introduction/Overview
Establish a scalable shape abstraction starting with rectangles, enforcing selection-before-action and persisting canonical shape state to Firestore. Set patterns that allow new shapes to be added without refactors.

## Goals
- A clear `ShapeBase` abstraction with type-safe shape variants.
- Implement `RectShape` first with canonical fields and metadata.
- Enforce selection-before-action to avoid accidental edits.
- Persist shapes durably and deterministically.

## User Stories
- As a user, I can create a rectangle and see it persist across refreshes.
- As a user, I must select a shape before any edit action.
- As a collaborator, I see the same rectangle state after reload as others do.

## Functional Requirements
1. Abstraction: Define `ShapeBase` with common fields and a discriminated `type`.
2. Rectangle: Implement `RectShape` rendering, hit-testing, and selection visuals.
3. Selection Gating: Click selects; transforms require an active selection (move/resize later phases may reuse this gating).
4. Persistence: Store canonical rectangles in Firestore `shapes/{id}` with metadata and LWW fields.
5. Factory/Registry: Provide a factory/registry to construct shapes from Firestore records and to add future types (ellipse, text) without modifying callers.
6. Ordering: Support `zIndex` for stable rendering order; higher `zIndex` draws on top.

## Data Model (Firestore `shapes/{id}`)
- `type`: 'rect' | 'ellipse' | 'text'
- `x, y, width, height, rotation`
- `fill, stroke, zIndex`
- `updatedAt, updatedBy`

## Non-Goals (Out of Scope)
- Complex vector paths or boolean operations.
- Rich text editing/formatting beyond a placeholder type entry.
- CRDT/OT merging; rely on higher-level conflict policy (LWW from Persistence PRD).

## Design Considerations (Optional)
- Selection ring and handles are visually distinct but lightweight.
- Default rectangle styles (fill, stroke) are consistent with the design system.
- Hit area padding to improve selection on thin strokes.

## Technical Considerations (Optional)
- Use Konva primitives (`Rect`, `Group`) with stable props; avoid unnecessary re-renders.
- Derive selection visuals without mutating underlying shape records.
- Keep persistence logic in services; components focus on rendering and events.

## Success Metrics
- Creating and reading rectangles is consistent across reloads for all users.
- Selection is required before any edit action; no accidental edits when not selected.
- Adding a new shape type requires only registry addition and a new renderer, not refactors.

## Open Questions
- Default rectangle styles and theme alignment.
- Minimal fields for ellipse/text to be added later.
- Whether to include snapping or alignment guides in this phase.

## Risks & Mitigations
- UI/data coupling → use services for persistence and keep rendering components dumb.
