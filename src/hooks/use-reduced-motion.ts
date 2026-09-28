import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);
    const onChange = () => setReduced(mediaQuery.matches);

    onChange();
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
