'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { detectVerseReferences, type DetectedReference } from '@/data/verseDetector';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VoiceVerseResult {
  transcript: string;
  detected: DetectedReference[];
}

export interface UseVoiceBibleOptions {
  /** Called when a verse reference is confidently detected in the transcript */
  onDetected: (ref: string) => void;
  /** Minimum speech confidence threshold (0–1). Default: 0.5 */
  minConfidence?: number;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVoiceBible({ onDetected, minConfidence = 0.5 }: UseVoiceBibleOptions) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastDetected, setLastDetected] = useState<DetectedReference | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const onDetectedRef = useRef(onDetected);
  useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);

  // Ref so onend can check listening state without stale closure
  const isListeningRef = useRef(isListening);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  // ── Check browser support ─────────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  // ── Core start/stop ───────────────────────────────────────────────────────

  const start = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice recognition is not supported in this browser. Use Chrome or Edge.');
      return;
    }

    // Stop any existing session first
    recognitionRef.current?.stop();

    const recognition = new SpeechRecognition();
    recognition.continuous = true;      // keep listening between pauses
    recognition.interimResults = true;  // show live transcript as user speaks
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        const confidence: number = result[0].confidence ?? 1;

        if (result.isFinal) {
          if (confidence >= minConfidence) {
            finalText += text;
          }
        } else {
          interimText += text;
        }
      }

      // Show live transcript (interim + final combined)
      setTranscript(finalText || interimText);

      // Only try to detect from final results with sufficient confidence
      if (finalText.trim()) {
        const refs = detectVerseReferences(finalText);
        if (refs.length > 0) {
          const top = refs[0];
          setLastDetected(top);
          // Build a clean reference string e.g. "John 3:16"
          const refString = `${top.book} ${top.chapter}:${top.verse}`;
          onDetectedRef.current(refString);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow mic access and try again.');
      } else if (event.error === 'no-speech') {
        // Not a real error — just silence, keep listening
        return;
      } else {
        setError(`Voice error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if we're supposed to still be listening
      // (recognition stops automatically after a long enough silence)
      if (recognitionRef.current === recognition && isListeningRef.current) {
        try { recognition.start(); } catch { /* ignore duplicate start */ }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err: any) {
      setError(err?.message || 'Could not start voice recognition');
    }
  }, [minConfidence]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setTranscript('');
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    lastDetected,
    error,
    toggleListening,
    stop,
  };
}
