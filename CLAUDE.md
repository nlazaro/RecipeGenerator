# RecipeGen — Project Brief

## What This App Is

RecipeGen is a web/mobile application that turns a user's available ingredients into a personalised, voice-guided cooking experience. The core loop:

1. **Ingredient input** — users log their inventory via one of three methods:
   - **Text** — manually type items and quantities
   - **Photo scan** — take a picture of their fridge/pantry; a vision model (e.g. Gemini Vision) classifies the ingredients
   - **Voice** — speak naturally via ElevenLabs; speech is transcribed and parsed into structured inventory items

2. **Inventory confirmation** — after initial classification the user reviews and can correct values (e.g. "actually 4 tomatoes, not 3") before the inventory is finalised

3. **AI recipe generation** — a Gemini API call takes the confirmed inventory + the user's profile (goals, dietary restrictions, allergies, preferences, past ratings) and returns several recipe suggestions

4. **Recipe selection** — the user is presented with 2–4 recipe cards and picks one

5. **Voice-guided cooking** — ElevenLabs walks the user through each prep and cooking step in real time

6. **Rate & reflect** — after eating, the user rates the recipe (1–5 stars) and can add notes (e.g. "great taste but too time-consuming", "remove from suggestions"). Feedback is stored and fed back into future recipe generation

## Demo Day Goals

- Fully functional ingredient input via at least text + photo scan
- Inventory UI with inline editing/confirmation
- Gemini-powered recipe generation personalised to the user profile
- At least one recipe detail view with step-by-step instructions
- ElevenLabs voice narration for cooking steps (stretch goal)
- Post-meal rating and feedback capture

## Tech Stack

- **Frontend**: React (Vite), hosted on Firebase Hosting
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **AI / ML**: Gemini API (recipe generation + vision classification), ElevenLabs (TTS voice guidance)
- **Auth**: Firebase Auth (email/password + Google OAuth)

## Design System

- Font: Manrope
- Primary green: `#006947`
- Primary container (light green): `#69f6b8`
- Surface: `#f6f6ff`
- On-surface: `#181b27`
- Gradient: `linear-gradient(135deg, #006947, #69f6b8)`
- No hard borders — use shadow + border-radius + subtle backgrounds
- Tone: "The Encouraging Curator" — warm, motivating, health-forward

## Frontend Dev Notes

- The landing page (`App.jsx` + `App.css`) is the primary focus right now
- Sign-in page lives in `SignIn.jsx` + `SignIn.css`
- Navigation: sticky main navbar + scroll-triggered secondary chip navbar
- Second navbar chips highlight based on `IntersectionObserver` — `rootMargin: '-15% 0px -75% 0px'`
- Pokebowl hero image: `src/assets/poke.png`
- Tuscan pasta image: `src/assets/tuscan-pasta.jpg`
