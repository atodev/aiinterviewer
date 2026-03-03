import { useState, useRef } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const finalTranscriptRef = useRef('');

  useSpeechRecognitionEvent('start', () => {
    setIsRecording(true);
    setTranscript('');
    finalTranscriptRef.current = '';
  });

  useSpeechRecognitionEvent('end', () => {
    setIsRecording(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);
    if (event.isFinal) {
      finalTranscriptRef.current = text;
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('[useRecorder] speech recognition error:', event.error, event.message);
    setIsRecording(false);
  });

  async function startRecording() {
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      console.error('[useRecorder] microphone permission denied');
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
    });
  }

  async function stopRecording(): Promise<string | null> {
    ExpoSpeechRecognitionModule.stop();
    // Give the 'end' event a moment to fire and finalise the transcript
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
    const result = finalTranscriptRef.current || transcript;
    console.log('[useRecorder] final transcript:', result);
    return result.trim() || null;
  }

  return { isRecording, transcript, startRecording, stopRecording };
}
