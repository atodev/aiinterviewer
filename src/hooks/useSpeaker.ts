import { useState, useEffect, useRef, useCallback } from 'react';
import * as Speech from 'expo-speech';

export function useSpeaker() {
  const [enabled, setEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const enabledRef = useRef(true);       // stable ref so speak() never uses a stale value
  const pendingTextRef = useRef('');

  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  const speak = useCallback((text: string) => {
    pendingTextRef.current = text;
    if (!enabledRef.current) return;
    // Stop anything already playing then speak after a short delay
    // so the component has settled (especially on first question load)
    Speech.stop();
    setTimeout(() => {
      if (!enabledRef.current) return;
      setSpeaking(true);
      Speech.speak(text, {
        language: 'en-US',
        rate: 0.88,
        pitch: 1.05,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }, 400);
  }, []);

  function toggle() {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    if (!next) {
      Speech.stop();
      setSpeaking(false);
    } else if (pendingTextRef.current) {
      speak(pendingTextRef.current);
    }
  }

  return { enabled, speaking, speak, toggle };
}
