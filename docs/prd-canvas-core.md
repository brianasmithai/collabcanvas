# PRD — Canvas Core (Rubric-Aligned)

## Introduction/Overview
Provide a smooth, predictable canvas foundation with pan and zoom that fills the viewport and remains responsive under normal usage. Establish reliable selection behavior to support later editing features.

## Goals
- Full-viewport stage with stable sizing on resize.
- Smooth pan/zoom targeting ~60 FPS on typical laptops.
- Predictable pointer-centered zoom with configurable bounds.
- Reliable selection behavior without unintended drags or scroll conflicts.

## User Stories
- As a user, I can pan and zoom a large canvas smoothly.
- As a user, I can select objects reliably for later actions.
- As a keyboard user, I can undo accidental zoom extremes with a quick reset.

## Functional Requirements
1. Stage: Implement a React + Konva stage that fills the viewport with a base drawing layer and a UI overlay layer.
2. Zoom: Support wheel zoom centered on pointer with clamped `scale` (e.g., 0.25–4.0) and optional Ctrl/trackpad heuristics.
3. Pan: Support drag-to-pan with inertia disabled initially; prevent page scroll conflicts via explicit wheel handling.
4. UI Store: Persist `scale` and `position` in a UI store to avoid unnecessary re-renders; expose selectors for memoized subtrees.
5. Performance: Target ~60 FPS; memoize layers/nodes; keep props stable and avoid diff churn on unrelated changes.
6. Selection: Establish selection hit-testing that does not interfere with pan/zoom gestures; single-click selects, drag with modifier can marquee-select (optional later).
7. Resize Behavior: Recompute stage size on window resize without flicker; keep zoom anchor consistent.
8. Shortcuts: Provide reset-viewport action (e.g., fit to content or 1:1 at origin) and optional +/- zoom shortcuts.

## Non-Goals (Out of Scope)
- Object transforms (move/resize/rotate) beyond basic selection.
- Snap-to-grid/guides and advanced navigation (minimap).
- Complex gesture inertia or physics beyond basic pan/zoom.

## Design Considerations (Optional)
- Cursor feedback for panning (grab/grabbing) to communicate mode.
- Optional content padding so zoom-to-fit leaves a comfortable margin.
- Clear affordance for reset-viewport in toolbar or keyboard shortcut help.

## Technical Considerations (Optional)
- Use non-passive wheel listener on the stage container to prevent page scroll conflicts.
- Avoid re-creating Konva nodes between renders; prefer stable refs and memoization.
- Consider devicePixelRatio for crisp rendering at various zoom levels.
- Test touch gestures for mobile/trackpads; gate multi-touch pinch support behind a flag if needed.

## Success Metrics
- Pan/zoom feel smooth on typical hardware (~60 FPS target) with no layout thrash.
- Pointer-centered zoom is predictable; scale and position remain stable.
- No unintended page scroll during canvas interaction.

## Open Questions
- Exact zoom bounds and step granularity.
- Whether to support pinch-to-zoom in this phase.
- Initial viewport (fit-to-content vs 1:1 at origin).

## Risks & Mitigations
- Scroll conflicts → explicit wheel handling + preventDefault on canvas container.
- Re-render churn → memoized components, stable props, and selector-based UI store.
