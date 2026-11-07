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

      // Track maximum seen height as baseline full-screen height (keyboard closed)
      if (currentHeight > initialHeightRef.current) {
        initialHeightRef.current = currentHeight;
      }
      const baseline = initialHeightRef.current;

      // 2. Detect if keyboard is physically open:
      // The viewport MUST be significantly shrunk compared to baseline (> 100px).
      // When the user dismisses the keyboard via Android back button or chevron,
      // the viewport immediately expands back to baseline, causing isOpen to become FALSE instantly!
      const layoutShrunk = baseline > 0 && (baseline - currentHeight > 100);
      const visualShrunk = vv ? (baseline > 0 && (baseline - vv.height > 100)) : false;
      const isOpen = Boolean(isInputActive && (layoutShrunk || visualShrunk));

      if (!isOpen) {
        setIsKeyboardVisible(false);
        setKeyboardOffset(0);
        return;
      }

      // 3. Calculate CSS offset needed for position: fixed elements:
      // - If layout viewport shrank (e.g. Android Chrome with resizes-content):
      //   window.innerHeight already resized cleanly to fit above the keyboard.
      //   bottom: 0 is already docked perfectly on top of the virtual keyboard! offset is 0.
      // - If layout viewport did not shrink but visualViewport shrank (e.g. iOS Safari):
      //   The offset is strictly the keyboard height (baseline - vv.height).
      //   We do NOT use vv.offsetTop so page scrolling never causes the toolbar to jump!
      let offset = 0;
      if (layoutShrunk) {
        offset = 0;
      } else if (visualShrunk && vv) {
        offset = Math.max(0, Math.round(baseline - vv.height));
      }

      setIsKeyboardVisible(true);
      setKeyboardOffset(offset);
    };

    const handleResize = () => {
      checkKeyboard();
    };

    const handleFocusIn = () => {
      // Run immediately synchronously on 0ms so React updates state before browser paints next frame
      checkKeyboard();
      // Tick-based delay to allow the browser to animate the keyboard and resize the viewport
      setTimeout(checkKeyboard, 50);
      setTimeout(checkKeyboard, 200);
    };

    const handleFocusOut = () => {
      setTimeout(checkKeyboard, 100);
    };

    // Listen only to resize and focus events. NEVER listen to scroll events
    // so page scrolling is completely smooth and does not cause jitter!
    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return { isKeyboardVisible, keyboardOffset };
}
