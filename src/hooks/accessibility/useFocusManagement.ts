import { useCallback, useEffect, useRef } from "react";

export interface FocusManagementConfig {
  enableFocusTrap: boolean;
  enableFocusRestore: boolean;
  enableKeyboardNavigation: boolean;
}

export interface FocusManagementHelpers {
  trapFocus: (container: HTMLElement) => () => void;
  restoreFocus: () => void;
  focusElement: (selector: string) => boolean;
  handleKeyboardNavigation: (event: KeyboardEvent) => void;
  setFocusableElements: (elements: HTMLElement[]) => void;
}

export const useFocusManagement = (
  config: Partial<FocusManagementConfig> = {},
): FocusManagementHelpers => {
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const focusableElements = useRef<HTMLElement[]>([]);

  const defaultConfig: FocusManagementConfig = {
    enableFocusTrap: true,
    enableFocusRestore: true,
    enableKeyboardNavigation: true,
    ...config,
  };

  // Get all focusable elements within a container
  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
      "[contenteditable]",
    ].join(", ");

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }, []);

  // Trap focus within a container
  const trapFocus = useCallback(
    (container: HTMLElement) => {
      if (!defaultConfig.enableFocusTrap) {
        return () => {};
      }

      // Store the currently focused element to restore later
      lastFocusedElement.current = document.activeElement as HTMLElement;

      const focusableElements = getFocusableElements(container);

      if (focusableElements.length === 0) {
        return () => {};
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (event: KeyboardEvent) => {
        if (event.key !== "Tab") return;

        if (event.shiftKey) {
          // Shift + Tab: moving backwards
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: moving forwards
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      };

      const handleEscapeKey = (event: KeyboardEvent) => {
        if (
          event.key === "Escape" &&
          defaultConfig.enableFocusRestore &&
          lastFocusedElement.current
        ) {
          lastFocusedElement.current.focus();
          lastFocusedElement.current = null;
        }
      };

      container.addEventListener("keydown", handleTabKey);
      container.addEventListener("keydown", handleEscapeKey);

      // Focus the first element
      firstElement.focus();

      // Return cleanup function
      return () => {
        container.removeEventListener("keydown", handleTabKey);
        container.removeEventListener("keydown", handleEscapeKey);
      };
    },
    [defaultConfig.enableFocusTrap, defaultConfig.enableFocusRestore, getFocusableElements],
  );

  // Restore focus to the previously focused element
  const restoreFocus = useCallback(() => {
    if (defaultConfig.enableFocusRestore && lastFocusedElement.current) {
      lastFocusedElement.current.focus();
      lastFocusedElement.current = null;
    }
  }, [defaultConfig.enableFocusRestore]);

  // Focus an element by selector
  const focusElement = useCallback((selector: string): boolean => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus({ preventScroll: false });
      return true;
    }
    return false;
  }, []);

  // Set custom focusable elements for keyboard navigation
  const setFocusableElements = useCallback((elements: HTMLElement[]) => {
    focusableElements.current = elements;
  }, []);

  // Handle global keyboard navigation
  const handleKeyboardNavigation = useCallback(
    (event: KeyboardEvent) => {
      if (!defaultConfig.enableKeyboardNavigation) return;

      // Handle section navigation with F6
      if (event.key === "F6") {
        event.preventDefault();

        const sections = ["#game-info", "#game-board", "#game-controls"];

        const currentSection = sections.find((selector) => {
          const element = document.querySelector(selector);
          return element?.contains(document.activeElement);
        });

        const currentIndex = currentSection ? sections.indexOf(currentSection) : -1;
        const nextIndex = (currentIndex + 1) % sections.length;

        focusElement(sections[nextIndex]);
      }

      // Handle Home/End keys for first/last focusable element
      if (event.key === "Home" && event.ctrlKey) {
        event.preventDefault();
        const firstFocusable = document.querySelector(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) as HTMLElement;
        firstFocusable?.focus();
      }

      if (event.key === "End" && event.ctrlKey) {
        event.preventDefault();
        const allFocusable = document.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        const lastFocusable = allFocusable[allFocusable.length - 1] as HTMLElement;
        lastFocusable?.focus();
      }
    },
    [defaultConfig.enableKeyboardNavigation, focusElement],
  );

  // Set up global keyboard event listeners
  useEffect(() => {
    if (defaultConfig.enableKeyboardNavigation) {
      window.addEventListener("keydown", handleKeyboardNavigation);

      return () => {
        window.removeEventListener("keydown", handleKeyboardNavigation);
      };
    }
  }, [defaultConfig.enableKeyboardNavigation, handleKeyboardNavigation]);

  // Store focus when component mounts
  useEffect(() => {
    if (defaultConfig.enableFocusRestore) {
      lastFocusedElement.current = document.activeElement as HTMLElement;
    }
  }, [defaultConfig.enableFocusRestore]);

  return {
    trapFocus,
    restoreFocus,
    focusElement,
    handleKeyboardNavigation,
    setFocusableElements,
  };
};
