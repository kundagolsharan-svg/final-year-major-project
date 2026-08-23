"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const PrivacyContext = createContext({
  isPrivacyMode: false,
  togglePrivacyMode: () => {},
});

export function PrivacyProvider({ children }) {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sampat-privacy-mode");
    if (stored === "true") {
      setIsPrivacyMode(true);
    }
  }, []);

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem("sampat-privacy-mode", next.toString());
      return next;
    });
  };

  return (
    <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacyMode }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
