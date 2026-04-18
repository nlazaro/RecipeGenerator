# RecipeGenerator

A web app that scans your fridge/food inventory using AI and generates recipes based on what you have.

## Tech Stack

- **Frontend:** React + Vite
- **Auth & Database:** Firebase (Authentication, Firestore)
- **Image Analysis API:** FastAPI + Groq (Llama 4)
- **Recipe Generator API:** Gemini
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

### `POST /analyze-image`

Upload a food image and get back a detected inventory.

**Request:** multipart form data with field `image`

**Response:**
```json
{
  "inventory": [
    { "item_name": "Banana", "category": "Produce", "count": 3 }
  ]
}
```

### `POST /generate-recipes`

Takes a confirmed inventory and returns recipe suggestions.

**Request:**
```json
{
  "inventory": [
    { "item_name": "Banana", "category": "Produce", "count": 3 }
  ]
}
```

## Firestore Collections

| Collection | Description |
|---|---|
| `inventories` | Confirmed ingredient lists per user |
| `recipes` | Generated recipes linked to the inventory used |

## Pending Integrations

- `/generate-recipes` endpoint
- User dashboard / recipe display page
