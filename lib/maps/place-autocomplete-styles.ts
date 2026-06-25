/** Visual tokens shared with Tailwind `input` fields in address forms. */
export const PLACE_AUTOCOMPLETE_RING = "0 0 0 1px var(--color-ink-200)";
export const PLACE_AUTOCOMPLETE_RING_FOCUS = "0 0 0 2px var(--color-brand-400)";

/** Apply surface styles after mount — Google's widget CSS loads later and overrides globals.css. */
export function applyPlaceAutocompleteSurfaceStyles(el: HTMLElement): void {
  el.style.setProperty("display", "block");
  el.style.setProperty("width", "100%");
  el.style.setProperty("height", "2.5rem");
  el.style.setProperty("min-height", "2.5rem");
  el.style.setProperty("box-sizing", "border-box");
  el.style.setProperty("color-scheme", "light");
  el.style.setProperty("background-color", "#ffffff");
  el.style.setProperty("color", "var(--color-ink-900)");
  el.style.setProperty("border", "none");
  el.style.setProperty("border-radius", "0.75rem");
  el.style.setProperty("box-shadow", PLACE_AUTOCOMPLETE_RING);
  el.style.setProperty(
    "font-family",
    'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  );
  el.style.setProperty("font-size", "0.875rem");
  el.style.setProperty("line-height", "1.25rem");
  el.style.setProperty("transition", "box-shadow 150ms ease");
}

export function setPlaceAutocompleteFocused(el: HTMLElement, focused: boolean): void {
  el.style.setProperty("box-shadow", focused ? PLACE_AUTOCOMPLETE_RING_FOCUS : PLACE_AUTOCOMPLETE_RING);
}

export function bindPlaceAutocompleteFocusRing(el: HTMLElement): () => void {
  const onFocusIn = () => setPlaceAutocompleteFocused(el, true);
  const onFocusOut = (event: FocusEvent) => {
    if (!el.contains(event.relatedTarget as Node | null)) {
      setPlaceAutocompleteFocused(el, false);
    }
  };
  el.addEventListener("focusin", onFocusIn);
  el.addEventListener("focusout", onFocusOut);
  return () => {
    el.removeEventListener("focusin", onFocusIn);
    el.removeEventListener("focusout", onFocusOut);
  };
}
