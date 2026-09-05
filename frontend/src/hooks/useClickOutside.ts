import { useEffect, useRef, type RefObject } from 'react';

/**
 * Hook that detects clicks or touch events outside of a modal element to close it.
 *
 * @param onClose Callback to close the modal
 * @param enabled Whether the click-outside listener is active (defaults to true)
 * @param ignoreElement Optional element or list of elements to ignore clicks on
 * @param passedRef Optional external ref to bind to
 * @returns RefObject to attach to the modal/dialog container
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  onClose: () => void,
  enabled: boolean = true,
  ignoreElement?: Element | null | (Element | null)[],
  passedRef?: RefObject<T | null>,
): RefObject<T | null> {
  const internalRef = useRef<T | null>(null);
  const ref = passedRef || internalRef;

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const modalEl = ref.current;
      if (!modalEl) return;

      const target = event.target as Node | null;
      if (!target) return;

      // Click is inside the modal container
      if (modalEl.contains(target)) {
        return;
      }

      // Check if target is inside any explicitly provided ignore elements
      if (ignoreElement) {
        const ignoredList = Array.isArray(ignoreElement) ? ignoreElement : [ignoreElement];
        for (const el of ignoredList) {
          if (el && (el === target || el.contains(target))) {
            return;
          }
        }
      }

      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose, enabled, ignoreElement, ref]);

  return ref;
}

export default useClickOutside;
