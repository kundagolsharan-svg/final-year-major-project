"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext({
  currency: { symbol: "₹", code: "INR", locale: "en-IN" },
  setCurrency: () => {},
});

export const CURRENCIES = [
  { symbol: "₹", code: "INR", locale: "en-IN", name: "Indian Rupee" },
  { symbol: "$", code: "USD", locale: "en-US", name: "US Dollar" },
  { symbol: "€", code: "EUR", locale: "de-DE", name: "Euro" },
  { symbol: "£", code: "GBP", locale: "en-GB", name: "British Pound" },
];

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(CURRENCIES[0]);

  useEffect(() => {
    const stored = localStorage.getItem("sampat-currency");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const match = CURRENCIES.find((c) => c.code === parsed.code);
        if (match) setCurrencyState(match);
      } catch (e) {}
    }
  }, []);

  const setCurrency = (code) => {
    const match = CURRENCIES.find((c) => c.code === code);
    if (match) {
      setCurrencyState(match);
      localStorage.setItem("sampat-currency", JSON.stringify(match));
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
