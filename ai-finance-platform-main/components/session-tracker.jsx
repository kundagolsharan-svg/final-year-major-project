"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { logUserSessionAction } from "@/actions/settings";

export function SessionTracker() {
  const { sessionId, isLoaded } = useAuth();
  const prevSessionId = useRef(undefined);

  useEffect(() => {
    if (!isLoaded) return;

    // Track active session locally to prevent multiple logs across tabs
    const activeSession = typeof window !== 'undefined' ? localStorage.getItem("active_session") : null;

    if (sessionId) {
      if (activeSession !== sessionId) {
        // First time this session is active on this browser
        localStorage.setItem("active_session", sessionId);
        logUserSessionAction("LOGIN").catch(console.error);
      }
    } else if (!sessionId && activeSession) {
      // Session ended
      localStorage.removeItem("active_session");
      logUserSessionAction("LOGOUT").catch(console.error);
    }

    prevSessionId.current = sessionId;
  }, [sessionId, isLoaded]);

  return null;
}
