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

## Getting Started

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

### Firebase Functions (for local emulation)

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
