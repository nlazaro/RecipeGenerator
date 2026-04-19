# RecipeGen — Project Brief

## End User Persona

RecipeGen's user is a **health-conscious home cook who has made a deliberate choice to cook for themselves** despite knowing how much easier it would be to order from Uber Eats or DoorDash. They are motivated — they want to eat better, feel better, and build a cooking habit — but they need the experience to be seamless enough that it doesn't add friction to that choice.

- They are not professional chefs. They may be learning as they go.
- They track their health goals (macros, calories, dietary preferences) and want food that aligns with them.
- They want to reduce food waste — cook with what they already have at home.
- They value personalization: a recipe that fits *their* allergies, *their* cook time, *their* goals.
- They will abandon the app if it feels like work. Every screen should feel like a helpful guide, not a form to fill out.
- The tone should always be warm, encouraging, and low-pressure — "The Encouraging Curator."

---

## The Hero Feature: Inventory System

The inventory is the core of RecipeGen. It is not just a list — it is the foundation of everything:

1. **Track what's at home** — users always know what ingredients they have without opening the fridge
2. **Analyze purchasing patterns** — over time, surface insights like "you buy a lot of protein but rarely have complex carbs"
3. **Enable AI personalization** — every recipe recommendation is generated using the confirmed inventory + user profile (goals, restrictions, allergies, cook time, past ratings)
4. **Make healthy eating plannable** — with a stocked, accurate inventory, the user can confidently answer "what can I cook tonight?" in seconds

---

## Core User Flow

```
/signin  →  /profile  →  /dashboard  →  /ingredients  →  /review  →  /recipes  →  cooking session  →  /rate
```

### Step-by-Step

1. **Sign in / Sign up** (`/signin`)
   - Email/password or Google OAuth
   - New users → `/profile`; returning users → `/dashboard`

2. **Profile setup** (`/profile`)
   - 9-step onboarding: goals, dietary restrictions, allergies, cook time, skill level, etc.
   - On completion → `/dashboard`

3. **Dashboard** (`/dashboard`)
   - 3-panel layout: left vertical nav, main content, right panel
   - Three states:
     - **New user (no inventory):** single warm CTA — "Let's stock your kitchen" → `/ingredients`
     - **Has inventory, no recipes yet:** show inventory summary + "Generate Recipes" CTA
     - **Returning user:** show analytics summary, recent recipes, inventory health

4. **Ingredient input** (`/ingredients`)
   - Method picker: Photo Scan / Type It In / Voice (stretch)
   - All methods lead to `/review`

5. **Inventory confirmation** (`/review`)
   - "ANALYSIS COMPLETE / IDENTIFIED ITEMS" page
   - User reviews, edits, deletes, or adds items
   - **"ADD TO INVENTORY"** → saves to Firestore, back to `/dashboard`
   - **"CONFIRM SELECTION →"** → saves + triggers recipe generation → `/recipes`
   - **"ADD MISSING ITEM"** → adds blank row for manual entry

6. **Recipe recommendations** (`/recipes`)
   - Gemini returns 2–3 recipes ranked by alignment with the user's profile
   - Each card shows:
     - Recipe name + photo
     - **Alignment score** (e.g. "94% match — high protein, under 30 min")
     - Estimated prep + cook time
     - Key ingredients used from their inventory
   - User selects one recipe to start cooking

7. **Cooking session** (voice-guided)
   - "Let's Start Cooking" button triggers ElevenLabs voice agent
   - Agent narrates each prep and cooking step in sequence
   - **Interactive verbal element (stretch goal):** user can speak to the agent:
     - "Next step" / "Repeat that" / "Go back"
     - "Set a timer for 10 minutes"
     - "How do I dice an onion?" / "What does simmer mean?"
     - "How much salt should I add?"
   - Agent responds contextually and continues the session

8. **Rate & Reflect** (`/rate`)
   - Triggered after cooking session ends (or user can rate from recipe history)
   - **Star rating:** 1–5 stars
   - **Short text description:** optional free-text note
   - **Quick tags** (user selects 0 or more):
     - "Took too long"
     - "Tastes bland"
     - "Too complicated"
     - "It's okay"
     - "Really good"
     - "Best thing I've ever made"
     - "Would make again"
     - "Remove from suggestions"
   - All feedback stored in Firestore and fed back into future Gemini recipe generation prompts

---

## Navigation Structure (Left Vertical Sidebar)

**3 primary nav items + 1 pinned bottom:**

| # | Label | Route | Purpose |
|---|---|---|---|
| 1 | **Analytics** | `/dashboard` | Health overview — macro tracking, goal progress, cooking streak, ingredient purchase patterns |
| 2 | **Inventory** | `/inventory` | Full inventory manager — add, edit, scan, category breakdown, pantry health score |
| 3 | **Recipes** | `/recipes` | AI recommendations + recipe history + ratings management (add/remove from suggestions, adjust ratings) |
| — | **Settings** | `/profile` | Pinned to bottom — dietary profile, preferences, account |

**Design rules for the sidebar:**
- Dark background (`#12151f`), green accent (`#69f6b8`) for active state
- Left pip indicator on active item
- Icon + text label — icons must be meaningful (not Unicode shapes)
- No "Home" item — Analytics IS the home
- Settings pinned to bottom, visually separated

---

## Demo Day Goals

- Fully functional ingredient input via text + photo scan
- Inventory UI with inline editing/confirmation
- Gemini recipe generation personalised to user profile with alignment score + prep time
- Recipe detail view with step-by-step instructions
- ElevenLabs voice narration for cooking steps (stretch goal)
- Interactive voice agent during cooking (stretch goal)
- Post-meal rating with stars + tags

---

## Tech Stack

- **Frontend**: React (Vite), hosted on Firebase Hosting
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **AI / ML**: Gemini API (recipe generation + vision classification), ElevenLabs (TTS + STT voice guidance)
- **Auth**: Firebase Auth (email/password + Google OAuth)

---

## Design System

- Font: Manrope
- Primary green: `#006947`
- Primary container (light green): `#69f6b8`
- Surface: `#f6f6ff`
- On-surface: `#181b27`
- Sidebar dark: `#12151f`
- Gradient: `linear-gradient(135deg, #006947, #69f6b8)`
- No hard borders — use shadow + border-radius + subtle backgrounds
- Tone: "The Encouraging Curator" — warm, motivating, health-forward
- Every screen should reduce friction, not add it

---

## Frontend Dev Notes

- Landing page: `Landing.jsx` + `App.css`
- Sign-in: `SignIn.jsx` + `SignIn.css`
- Profile setup: `ProfileSetup.jsx` + `ProfileSetup.css` — on completion → `/dashboard`
- Sidebar nav: `Sidebar.jsx` + `Sidebar.css` — shared across all authenticated pages
- Dashboard / Analytics: `Dashboard.jsx` + `Dashboard.css` — `/dashboard`
- Ingredient method picker: `IngredientInput.jsx` + `IngredientInput.css` — `/ingredients`
- Inventory confirmation: `RecipeReview.jsx` + `reciple_review.css` — `/review`
- Recipe recommendations: `Confirmation.jsx` + `confirmation.css` — `/recipes` (needs alignment score UI)
- Rate & Reflect: **not yet built** — `/rate`
- Inventory manager: **not yet built** — `/inventory`
- Macros / Analytics: **not yet built** — `/dashboard` (current Dashboard.jsx is a placeholder)
- Pokebowl hero image: `src/assets/poke.png`
- Tuscan pasta image: `src/assets/tuscan-pasta.jpg`

---

## Route Registry

| Route | Component | Status | Notes |
|---|---|---|---|
| `/` | `Landing` | ✅ Built | Public marketing page |
| `/signin` | `SignIn` | ✅ Built | New → `/profile`; returning → `/dashboard` |
| `/profile` | `ProfileSetup` | ✅ Built | On complete → `/dashboard` |
| `/dashboard` | `Dashboard` | 🔧 In progress | Analytics home — macro/goal overview |
| `/ingredients` | `IngredientInput` | ✅ Built | Method picker |
| `/review` | `RecipeReview` | ✅ Built | Inventory confirmation |
| `/inventory` | TBD | ❌ Not built | Full inventory manager |
| `/recipes` | `Confirmation` | 🔧 Needs update | Recipe recommendations + alignment scores |
| `/rate` | TBD | ❌ Not built | Post-meal rating with stars + tags |
| `/scan` | `ImageUpload` | ⚠️ Legacy | Superseded by `/ingredients` → `/review` |

---

## Screenshot Workflow
- Puppeteer is installed locally in the project (`node_modules`).
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:5173`
- Screenshots are saved automatically to `./temporary_screenshots/screenshot-N.png` (auto-incremented).
- Optional label suffix: `node screenshot.mjs http://localhost:5173 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root.
- After screenshotting, read the PNG from `./temporary_screenshots/` with the Read tool so you can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors, alignment, border-radius, shadows, image sizing
