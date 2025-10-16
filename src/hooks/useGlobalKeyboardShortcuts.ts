import { useEffect } from 'react';

interface UseGlobalKeyboardShortcutsProps {
  setShowDebugPanel: (value: React.SetStateAction<boolean>) => void;
  setShowInstructionsPanel: (value: React.SetStateAction<boolean>) => void;
}

export const useGlobalKeyboardShortcuts = ({
  setShowDebugPanel,
  setShowInstructionsPanel,
}: UseGlobalKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Toggle debug panel with 'D' key
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setShowDebugPanel((prev) => !prev);
      }
      // Toggle instructions panel with 'I' key
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setShowInstructionsPanel((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowDebugPanel, setShowInstructionsPanel]);
};


