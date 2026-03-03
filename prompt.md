🚀 The AI Interviewer Master Build Prompt
Role: Senior Full-Stack Mobile Architect (React Native & Firebase Expert)
Objective: Build "AI Interviewer" using Expo SDK 52+, Firebase, and Gemini 3 Flash/Pro.
Guiding Principle: DO NOT RUSH. Test and verify each component. Follow a modular, indexed architecture to save tokens and ensure stability.

1. Project Index & Scaffold (Strict Folder Structure)
   Create the following structure before writing core logic:

/src/api: Gemini & RevenueCat integration logic.

/src/components: UI atoms (Buttons, Cards, Animated Avatar).

/src/hooks: useInterviewer, useRecorder, useSubscription.

/src/screens: SetupScreen, InterviewScreen, PaywallScreen.

/src/services: firebaseConfig.ts, admobService.ts.

/src/store: Context API or Zustand for global state (User, Job Data).

2. Implementation Requirements
   Phase A: Setup & Firebase (The Foundation)

Initialize Firebase Auth (Anonymous) and Firestore.

SetupScreen: Build a form to capture geminiKey and jobDescription.

Index Check: Save these to users/{uid}/config.

Phase B: Multimodal Interview Engine

useInterviewer Hook: Logic to fetch 3 questions from Gemini based on the job description.

useRecorder Hook: Use expo-av to record audio. Implement a "Hold to Speak" gesture.

The Rubric Engine: Implement the Grading Rubric XML provided in the docs. Send raw audio + text context to Gemini 3 Flash for scoring.

Phase C: Monetization & Gating (The Business)

AdMob: Integrate BannerAd. Use Test ID: ca-app-pub-3940256099942544/6300978111.

RevenueCat: Initialize the SDK. Create an isPaid boolean in global state.

Logic: \* If (!isPaid) -> Show Ads, show "Free" (basic) feedback, blur "Improved Answer".

If (isPaid) -> Hide Ads, show "Pro" feedback (Gemini 3 Pro rewrite), enable Daily Refresh.

Phase D: The "Vibe" UI

Theme: Sleek Dark Mode (Slate-950 background, Emerald-500 accents).

Avatar: Create an AIAvatar component with a subtle CSS/Reanimated pulse that syncs with audio playback.

3. Execution Instructions
   Do not rush. Write the firebaseConfig first, then verify it connects before moving to the UI.

Modular Verification: After building each hook, write a small console.log test to verify API responses (especially Gemini multimodal audio uploads).

Token Efficiency: Always reference the project index. If a component is already written, do not rewrite it; import it.
