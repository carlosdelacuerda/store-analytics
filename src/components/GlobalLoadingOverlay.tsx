"use client";

import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/store/hooks";

/** Wait this long before showing the overlay, so near-instant requests don't flash it. */
const SHOW_DELAY_MS = 150;
/** Once shown, keep it visible at least this long, so it doesn't flash off immediately either. */
const MIN_VISIBLE_MS = 400;

export default function GlobalLoadingOverlay() {
  const activeRequests = useAppSelector((s) => s.loading.activeRequests);
  const isBusy = activeRequests > 0;
  const [visible, setVisible] = useState(false);

  const visibleSinceRef = useRef<number | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearShowTimer = () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
    };
    const clearHideTimer = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    if (isBusy) {
      clearHideTimer();
      if (visibleSinceRef.current === null && !showTimerRef.current) {
        showTimerRef.current = setTimeout(() => {
          visibleSinceRef.current = Date.now();
          setVisible(true);
          showTimerRef.current = null;
        }, SHOW_DELAY_MS);
      }
    } else {
      clearShowTimer();
      if (visibleSinceRef.current !== null) {
        const elapsed = Date.now() - visibleSinceRef.current;
        const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
        clearHideTimer();
        hideTimerRef.current = setTimeout(() => {
          setVisible(false);
          visibleSinceRef.current = null;
          hideTimerRef.current = null;
        }, remaining);
      }
    }
  }, [isBusy]);

  // Clean up any pending timers on unmount.
  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Prevent background scrolling while the overlay blocks the screen.
  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-sm"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600" />
      <p className="text-sm font-medium text-gray-600">Loading…</p>
    </div>
  );
}
