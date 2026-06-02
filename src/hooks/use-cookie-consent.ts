"use client";
import { useState, useEffect, useCallback } from "react";

const COOKIE_KEY = "cookie-consent";

type ConsentStatus = "accepted" | "declined" | null;

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentStatus>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY) as ConsentStatus;
    setConsent(stored);
    setIsLoaded(true);
  }, []);

  const accept = useCallback(() => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setConsent("accepted");
  }, []);

  const decline = useCallback(() => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setConsent("declined");
  }, []);

  const showBanner = isLoaded && consent === null;

  return { consent, showBanner, accept, decline };
}
