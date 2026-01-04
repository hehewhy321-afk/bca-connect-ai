import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function scrollTopImmediate() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export function ScrollToTop() {
  const location = useLocation();
  const lastKeyRef = useRef<string | null>(null);

  // Disable browser scroll restoration (mobile browsers often restore scroll on refresh)
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Run as early as possible when location changes
  useLayoutEffect(() => {
    scrollTopImmediate();
  }, [location.pathname, location.key]);

  // Run again after paint + after load to defeat late scroll restoration
  useEffect(() => {
    // Avoid double-work in rare cases where key doesn't change
    if (lastKeyRef.current === location.key) return;
    lastKeyRef.current = location.key;

    scrollTopImmediate();

    const raf1 = requestAnimationFrame(() => scrollTopImmediate());
    const raf2 = requestAnimationFrame(() => scrollTopImmediate());

    const timeout = window.setTimeout(() => scrollTopImmediate(), 100);

    const onPageShow = () => scrollTopImmediate();
    window.addEventListener("pageshow", onPageShow);

    // If the page isn't fully loaded yet, also scroll on load
    const onLoad = () => scrollTopImmediate();
    if (document.readyState !== "complete") {
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(timeout);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("load", onLoad);
    };
  }, [location.key, location.pathname]);

  return null;
}

