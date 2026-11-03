import { useState, useEffect, useRef } from 'react';

export interface VirtualKeyboardState {
  isKeyboardVisible: boolean;
  keyboardOffset: number;
}

export function useVirtualKeyboard(): VirtualKeyboardState {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const initialHeightRef = useRef<number>(typeof window !== 'undefined' ? window.innerHeight : 0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Track baseline screen height when keyboard is closed
    if (initialHeightRef.current === 0) {
      initialHeightRef.current = window.innerHeight;
    }

    const checkKeyboard = () => {
      // 1. Check if an editable input/textarea/TipTap editor is currently focused
      const activeEl = document.activeElement;
      const isInputActive = Boolean(
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'TEXTAREA' ||
         activeEl.getAttribute('contenteditable') === 'true' ||
         activeEl.closest('.tiptap-editor') ||
         activeEl.closest('[contenteditable="true"]') ||
         activeEl.classList.contains('ProseMirror'))
      );

      // If no input is focused, reset baseline height (e.g. orientation changes or initial load)
      if (!isInputActive) {
        initialHeightRef.current = window.innerHeight;
        setIsKeyboardVisible(false);
        setKeyboardOffset(0);
        return;
      }

      const vv = window.visualViewport;
      const currentHeight = window.innerHeight;
      const baseline = initialHeightRef.current;

      // 2. Detect if keyboard is open:
      // - In Android Chrome / resizing viewport: window.innerHeight shrinks significantly
      // - In iOS Safari: window.innerHeight stays constant, but visualViewport.height shrinks
      const layoutShrunk = baseline > 0 && (baseline - currentHeight > 100);
      const visualShrunk = vv ? (baseline > 0 && baseline - vv.height > 100) : false;
      const isOpen = layoutShrunk || visualShrunk;

      if (!isOpen) {
        setIsKeyboardVisible(false);
        setKeyboardOffset(0);
        return;
      }

      // 3. Calculate CSS offset needed for position: fixed elements:
      // - In Android Chrome: window.innerHeight already shrank to the area above the keyboard.
      //   Therefore, bottom: 0 is ALREADY flush against the keyboard! Offset must be 0!
      // - In iOS Safari: window.innerHeight did not shrink, so fixed elements at bottom: 0
      //   fall behind the keyboard. The offset needed is: window.innerHeight - (vv.height + vv.offsetTop).
      let offset = 0;
      if (vv) {
        const diff = currentHeight - (vv.height + vv.offsetTop);
        offset = Math.max(0, Math.round(diff));
      }

      setIsKeyboardVisible(true);
      setKeyboardOffset(offset);
    };

    const handleResizeOrScroll = () => {
      checkKeyboard();
    };

    const handleFocusIn = () => {
      // Tick-based delay to allow the browser to animate the keyboard and resize the viewport
      setTimeout(checkKeyboard, 80);
      setTimeout(checkKeyboard, 250);
    };

    const handleFocusOut = () => {
      setTimeout(checkKeyboard, 120);
    };

    window.visualViewport?.addEventListener('resize', handleResizeOrScroll);
    window.visualViewport?.addEventListener('scroll', handleResizeOrScroll);
    window.addEventListener('resize', handleResizeOrScroll);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResizeOrScroll);
      window.visualViewport?.removeEventListener('scroll', handleResizeOrScroll);
      window.removeEventListener('resize', handleResizeOrScroll);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return { isKeyboardVisible, keyboardOffset };
}
