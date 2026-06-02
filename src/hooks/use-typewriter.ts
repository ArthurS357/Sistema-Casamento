"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface UseTypewriterOptions {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDelay?: number;
}

export function useTypewriter({
  phrases,
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDelay = 2000,
}: UseTypewriterOptions) {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const phraseIndex = useRef(0);
  const charIndex = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const tick = useCallback(() => {
    const current = phrases[phraseIndex.current];
    if (!current) return;

    if (!isDeleting) {
      charIndex.current += 1;
      setText(current.slice(0, charIndex.current));

      if (charIndex.current === current.length) {
        timeoutRef.current = setTimeout(() => setIsDeleting(true), pauseDelay);
        return;
      }
      timeoutRef.current = setTimeout(tick, typingSpeed);
    } else {
      charIndex.current -= 1;
      setText(current.slice(0, charIndex.current));

      if (charIndex.current === 0) {
        setIsDeleting(false);
        phraseIndex.current = (phraseIndex.current + 1) % phrases.length;
      }
      timeoutRef.current = setTimeout(tick, deletingSpeed);
    }
  }, [isDeleting, phrases, typingSpeed, deletingSpeed, pauseDelay]);

  useEffect(() => {
    timeoutRef.current = setTimeout(tick, typingSpeed);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [tick, typingSpeed]);

  return text;
}
