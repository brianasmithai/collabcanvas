import { useCallback, useRef, useEffect } from 'react';
import { useUIStore } from '../state/uiStore';
import { useRectangles } from './useRectangles';
import { useLocks } from './useLocks';
import { screenToWorld } from '../utils/geometry';
import { updateSelection, tryClaimObjectLock, releaseObjectLock } from '../services/presence';
import type { Rect } from '../types';
import { throttle } from '../utils/throttle';

export const useRectangleInteraction = (
  stageRef: React.RefObject<any>,
  transformerRef: React.RefObject<any>,
  rectRefs: React.RefObject<{ [key: string]: any }>,
  currentUserId?: string,
  currentUserName?: string
) => {
  const { selectionIds, setSelectionIds, clearSelection, toggleSelection, dragSelection, endDragSelection } = useUIStore();
  const { rectangles, createRect, updateRect, deleteRects } = useRectangles();
  const { viewport } = useUIStore();
  const { isLockedByOther, getLockOwner } = useLocks();

  const createRectangle = useCallback(async (x: number, y: number) => {
    const newRect: Omit<Rect, 'id'> = {
      x: x - 50,
      y: y - 25,
      width: 100,
      height: 50,
      rotation: 0,
      updatedAt: Date.now(),
      updatedBy: currentUserId || 'local-user',
    };
    
    try {
      const id = await createRect(newRect);
      setSelectionIds([id]);
    } catch (err) {
      console.error('Failed to create rectangle:', err);
    }
  }, [createRect, setSelectionIds, currentUserId]);

  const handleStageClick = useCallback(async (e: any) => {
    if (e.target === e.target.getStage()) {
      // Check if Ctrl/Cmd key is pressed for multi-select mode
      const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;
      
      if (!isCtrlPressed) {
        clearSelection();
        
        // Update selection in presence system (this will release locks)
        if (currentUserId && currentUserName) {
          try {
            await updateSelection(currentUserId, [], currentUserName);
          } catch (error) {
            console.error('❌ Failed to update selection on stage click:', error);
          }
        }
      }
    }
  }, [clearSelection, currentUserId, currentUserName]);

  const handleStageDoubleClick = useCallback((e: any) => {
    if (e.target === e.target.getStage()) {
      const stage = stageRef.current;
      if (stage) {
        const pointer = stage.getPointerPosition();
        if (pointer) {
          const worldPos = screenToWorld(pointer.x, pointer.y, viewport);
          createRectangle(worldPos.x, worldPos.y);
        }
      }
    }
  }, [viewport, createRectangle, stageRef]);

  const handleRectClick = useCallback(async (rectId: string, e?: any) => {
    if (!currentUserId) {
      console.warn('🔒 handleRectClick: No current user ID available');
      return;
    }
    const ownerNameFallback = currentUserName || 'User';

    // Check if Ctrl/Cmd key is pressed for multi-select mode
    const isCtrlPressed = e?.evt?.ctrlKey || e?.evt?.metaKey || false;

    // If Ctrl+click, toggle selection without locking
    if (isCtrlPressed) {
      toggleSelection(rectId);
      
      // Update presence with new selection
      const newSelectionIds = selectionIds.includes(rectId) 
        ? selectionIds.filter(id => id !== rectId)
        : [...selectionIds, rectId];
      
      try {
        await updateSelection(currentUserId, newSelectionIds, ownerNameFallback);
      } catch (e) {
        console.error('❌ Failed to update presence after toggle:', e);
      }
      return;
    }

    // Deselect path: if already selected, release lock then clear selection
    if (selectionIds.includes(rectId)) {
      try {
        await releaseObjectLock(rectId);
      } catch (e) {
        console.warn('⚠️ Failed to release lock on deselect:', e);
      }
      setSelectionIds([]);
      try {
        await updateSelection(currentUserId, [], ownerNameFallback);
      } catch (e) {
        console.error('❌ Failed to update presence after deselect:', e);
      }
      return;
    }

    // Authoritative: attempt to claim via transaction (even if local says locked, to allow stale-takeover)
    const { success, currentOwnerName } = await tryClaimObjectLock(
      rectId,
      currentUserId,
      ownerNameFallback
    );
    if (!success) {
      console.log(`🔒 Object locked by ${currentOwnerName ?? 'another user'}`);
      return;
    }

    // Now we own the lock → select and broadcast presence
    setSelectionIds([rectId]);
    try {
      await updateSelection(currentUserId, [rectId], ownerNameFallback);
    } catch (e) {
      console.error('❌ Failed to update presence after lock claim:', e);
    }
  }, [selectionIds, setSelectionIds, toggleSelection, currentUserId, currentUserName, isLockedByOther, getLockOwner]);

  // Handle drag selection completion
  const handleDragSelectionEnd = useCallback(async () => {
    if (!dragSelection.isActive || !currentUserId || !currentUserName) {
      return;
    }

    const selectionArea = {
      x: Math.min(dragSelection.startX, dragSelection.endX),
      y: Math.min(dragSelection.startY, dragSelection.endY),
      width: Math.abs(dragSelection.endX - dragSelection.startX),
      height: Math.abs(dragSelection.endY - dragSelection.startY),
    };

    // Find rectangles that intersect with the selection area
    const intersectingRectIds: string[] = [];
    
    rectangles.forEach(rect => {
      const rectRight = rect.x + rect.width;
      const rectBottom = rect.y + rect.height;
      const selectionRight = selectionArea.x + selectionArea.width;
      const selectionBottom = selectionArea.y + selectionArea.height;

      // Check if rectangle intersects with selection area
      if (rect.x < selectionRight && 
          rectRight > selectionArea.x && 
          rect.y < selectionBottom && 
          rectBottom > selectionArea.y) {
        intersectingRectIds.push(rect.id);
      }
    });

    if (intersectingRectIds.length > 0) {
      // Add intersecting rectangles to selection
      const newSelectionIds = [...new Set([...selectionIds, ...intersectingRectIds])];
      setSelectionIds(newSelectionIds);
      
      try {
        await updateSelection(currentUserId, newSelectionIds, currentUserName);
      } catch (e) {
        console.error('❌ Failed to update presence after drag selection:', e);
      }
    }

    endDragSelection();
  }, [dragSelection, rectangles, selectionIds, setSelectionIds, currentUserId, currentUserName, endDragSelection]);

  const handleRectDragMove = useCallback(async (rectId: string, newX: number, newY: number) => {
    console.log('🔄 useRectangleInteraction: Drag move received for', rectId, 'at', newX, newY);
    try {
      // Real-time update: RTDB only, no Firestore sync yet
      await updateRect(rectId, { 
        x: newX, 
        y: newY, 
        updatedAt: Date.now(),
        updatedBy: currentUserId || 'local-user'
      }, false); // isTransformComplete = false
      console.log('✅ useRectangleInteraction: Drag move update sent to RTDB');
    } catch (err) {
      console.error('❌ useRectangleInteraction: Failed to update rectangle position during drag:', err);
    }
  }, [updateRect, currentUserId]);

  const handleRectDragEnd = useCallback(async (rectId: string, newX: number, newY: number) => {
    console.log('🎯 useRectangleInteraction: Drag END received for', rectId, 'at', newX, newY);
    try {
      // Final update: RTDB + immediate Firestore sync
      console.log('🎯 useRectangleInteraction: Drag ended, saving final position to both RTDB and Firestore');
      await updateRect(rectId, { 
        x: newX, 
        y: newY, 
        updatedAt: Date.now(),
        updatedBy: currentUserId || 'local-user'
      }, true); // isTransformComplete = true
      console.log('✅ useRectangleInteraction: Final position saved to both RTDB and Firestore');
    } catch (err) {
      console.error('❌ useRectangleInteraction: Failed to update rectangle position:', err);
    }
  }, [updateRect, currentUserId]);

  useEffect(() => {
    if (transformerRef.current && selectionIds.length > 0) {
      const nodes = selectionIds.map(id => rectRefs.current[id]).filter(Boolean);
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectionIds, transformerRef, rectRefs]);

  const throttledTransformUpdate = useRef<((updates: Partial<Rect>, rectId: string) => void) | null>(null);
  
  if (!throttledTransformUpdate.current) {
    throttledTransformUpdate.current = throttle(async (updates: Partial<Rect>, rectId: string) => {
      try {
        // Real-time transform update: RTDB only, no Firestore sync yet
        await updateRect(rectId, updates, false); // isTransformComplete = false
      } catch (err) {
        console.error('Failed to update rectangle transform:', err);
      }
    }, 50);
  }

  const handleTransformEnd = useCallback(async () => {
    if (transformerRef.current && selectionIds.length > 0) {
      const nodes = transformerRef.current.nodes();
      
      for (const node of nodes) {
        const rectId = rectangles.find(rect => rectRefs.current[rect.id] === node)?.id;
        if (rectId && throttledTransformUpdate.current) {
          (throttledTransformUpdate.current as any).flush();
          
          const newWidth = node.width() * node.scaleX();
          const newHeight = node.height() * node.scaleY();
          
          node.width(newWidth);
          node.height(newHeight);
          node.scaleX(1);
          node.scaleY(1);
          
          try {
            // Final transform update: RTDB + immediate Firestore sync
            console.log('🎯 useRectangleInteraction: Transform ended, saving final state to both RTDB and Firestore');
            await updateRect(rectId, {
              x: node.x(),
              y: node.y(),
              width: newWidth,
              height: newHeight,
              rotation: node.rotation(),
              updatedAt: Date.now(),
              updatedBy: currentUserId || 'local-user'
            }, true); // isTransformComplete = true
          } catch (err) {
            console.error('Failed to update rectangle transform:', err);
          }
        }
      }
    }
  }, [selectionIds, rectangles, updateRect, currentUserId, transformerRef, rectRefs]);

  const deleteSelectedRectangles = useCallback(async () => {
    if (selectionIds.length > 0) {
      try {
        console.log('🗑️ useRectangleInteraction: Deleting selected rectangles:', selectionIds);
        await deleteRects(selectionIds);
        console.log('🗑️ useRectangleInteraction: Rectangles deleted, clearing selection');
        clearSelection();
        
        // Explicitly update presence to clear selection for all users
        if (currentUserId) {
          console.log('🗑️ useRectangleInteraction: Updating presence to clear selection');
          await updateSelection(currentUserId, [], 'User');
        }
      } catch (err) {
        console.error('Failed to delete rectangles:', err);
      }
    }
  }, [selectionIds, deleteRects, clearSelection, currentUserId]);

  useEffect(() => {
        if (currentUserId) {
          updateSelection(currentUserId, selectionIds, 'User');
        }
  }, [currentUserId, selectionIds]);

  // Clear selection if any selected rectangles are deleted by other users
  useEffect(() => {
    if (selectionIds.length > 0) {
      const existingRectIds = rectangles.map(rect => rect.id);
      const deletedSelectionIds = selectionIds.filter(id => !existingRectIds.includes(id));
      
      if (deletedSelectionIds.length > 0) {
        console.log('🗑️ useRectangleInteraction: Clearing selection for deleted rectangles:', deletedSelectionIds);
        clearSelection();
        
        // Update presence to clear selection
        if (currentUserId) {
          updateSelection(currentUserId, [], 'User');
        }
      }
    }
  }, [rectangles, selectionIds, clearSelection, currentUserId]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedRectangles();
      } else if (e.key === 'n' || e.key === 'N') {
        // Create rectangle at center of viewport
        const centerX = (window.innerWidth / 2 - viewport.x) / viewport.scale;
        const centerY = (window.innerHeight / 2 - viewport.y) / viewport.scale;
        createRectangle(centerX, centerY);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelectedRectangles, createRectangle, viewport]);

  // Cleanup live transforms on unmount
  useEffect(() => {
    return () => {
      // On unmount, mark any active transforms from this user as inactive
      if (currentUserId && selectionIds.length > 0) {
        console.log('🧹 useRectangleInteraction: Cleaning up active transforms on unmount');
        selectionIds.forEach(async (id) => {
          try {
            await updateRect(id, { 
              updatedBy: currentUserId,
              updatedAt: Date.now()
            }, true); // isTransformComplete = true
          } catch (err) {
            console.error('Failed to cleanup transform on unmount:', err);
          }
        });
      }
    };
  }, [currentUserId, selectionIds, updateRect]);

  return {
    handleStageClick,
    handleStageDoubleClick,
    handleRectClick,
    handleRectDragMove,
    handleRectDragEnd,
    handleTransformEnd,
    deleteSelectedRectangles,
    handleDragSelectionEnd,
  };
};
