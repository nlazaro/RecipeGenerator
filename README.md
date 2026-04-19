# RecipeGenerator

A web app that scans your fridge/food inventory using AI and generates recipes based on what you have.

## Tech Stack

- **Frontend:** React + Vite
- **Auth & Database:** Firebase (Authentication, Firestore)
- **Python API:** FastAPI + Groq (Llama 4 Scout for vision/text, Llama 3.3 70B for recipes)
- **Food Photos:** Unsplash API (on-demand per recipe)
- **Backend Functions:** Firebase Cloud Functions (Node.js)

## Project Structure

```
RecipeGenerator/
├── frontend/          # React app
└── backend/
    ├── functions/     # Firebase Cloud Functions
    └── python_api/    # FastAPI image analysis server
```

## Features

- Google and email/password authentication
- Upload a food image → AI detects and lists ingredients
- Review and edit the detected inventory before confirming
- Inventory saved to Firestore per user
- Recipe generation from confirmed inventory
- Recipes saved to Firestore once generated

## Getting Started

### Prerequisites

- Node.js
- Python 3
- Firebase CLI (`npm install -g firebase-tools`)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Python API

```bash
cd backend/python_api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API docs available at `http://localhost:8000/docs` when running.

### Firebase Functions (optional, for local emulation)

```bash
cd backend
firebase use recipegenerator-b1315
firebase emulators:start
```

## API

All endpoints served at `http://localhost:8000`.

### `POST /analyze-image`

Upload a food image; returns AI-detected inventory. Non-food items are silently ignored.

**Request:** `multipart/form-data` with field `image` (JPEG/PNG)

**Response:**
```json
{
  "inventory": [
    { "item_name": "Banana", "category": "Produce", "count": 3 }
  ]
}
```

---

### `POST /analyze-text`

Parse a free-text ingredient list into structured inventory. Non-food items are silently ignored.

**Request:**
```json
{ "text": "2 chicken breasts, a dozen eggs, some olive oil" }
```

**Response:**
```json
{
  "inventory": [
    { "item_name": "Chicken Breast", "category": "Protein", "count": 2 },
    { "item_name": "Eggs", "category": "Protein", "count": 12 },
    { "item_name": "Olive Oil", "category": "Pantry", "count": 1 }
  ]
}
```

---

### `POST /generate-recipes`

Takes a confirmed inventory and optional personalisation context; returns 3 recipe suggestions.

**Request:**
```json
{
  "inventory": [
    { "item_name": "Chicken Breast", "category": "Protein", "count": 2 }
  ],
  "liked_recipes": ["Garlic Chicken Stir-fry"],
  "disliked_recipes": ["Spicy Tofu Bowl"]
}
```
`liked_recipes` and `disliked_recipes` are optional arrays of recipe title strings pulled from the user's saved ratings (≥4 stars / ≤2 stars). The model uses them to personalise suggestions.

**Response:**
```json
{
  "recipes": [
    {
      "title": "Garlic Chicken Stir-fry",
      "description": "A quick and flavourful weeknight chicken dish.",
      "ingredients": ["Chicken Breast", "Garlic", "Soy Sauce"],
      "steps": ["Slice chicken into strips.", "Heat oil in pan.", "Stir-fry 8 minutes."],
      "prep_time": "10 minutes",
      "cook_time": "15 minutes",
      "servings": 2
    }
  ]
}
```

---

### `GET /recipe-image?title=<recipe title>`

Fetches a landscape food photo from Unsplash for a given recipe title. Called on demand when a user opens a recipe detail view.

**Query param:** `title` — the recipe title string (URL-encoded)

**Response:**
```json
{ "image_url": "https://images.unsplash.com/..." }
```
Returns `{ "image_url": null }` if no matching photo is found.

---

## Firestore Structure

```
users/{uid}
  ├── inventory: [...] (array field — full ingredient stock)
  └── recipes/{recipeId}
        title, description, ingredients, steps,
        prep_time, cook_time, servings,
        isFavorited, rating, feedback, savedAt
```

Security rules ensure each user can only read/write their own documents.
