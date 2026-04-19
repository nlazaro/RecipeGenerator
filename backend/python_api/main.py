import base64
import json
import os

import google.generativeai as genai
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not set.")

UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
if not UNSPLASH_ACCESS_KEY:
    raise RuntimeError("UNSPLASH_ACCESS_KEY is not set.")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("GOOGLE_API_KEY is not set.")


client = Groq(api_key=GROQ_API_KEY)
genai.configure(api_key=GOOGLE_API_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

INVENTORY_PROMPT = """You are a highly precise food inventory agent for a healthcare application. Your task is to extract food and drink items only.

Rules:
1. You MUST output strictly in JSON format. Do not include conversational filler like "Here is the JSON."
2. The JSON must contain a single key called "inventory", which is a list of objects.
3. Each object must have exactly three keys:
   - "item_name" (string)
   - "category" (string): must be one of [Produce, Dairy, Protein, Pantry, Beverage, Snack, Other]
   - "count" (integer)
4. ONLY include items that are edible food or drink. If an item is not a food or drink (e.g. clothing, tools, furniture, electronics), silently skip it — do not include it in the output.
5. If the input contains no food or drink items at all, return: {"inventory": []}
"""

RECIPE_PROMPT = """You are a creative chef AI. Given a list of available ingredients, generate 3 diverse recipe suggestions.

Rules:
1. Output strictly valid JSON — no markdown, no extra text.
2. The JSON must have a single key "recipes" containing a list of 3 recipe objects.
3. Each recipe object must have exactly these keys:
   - "title" (string): Recipe name
   - "description" (string): One sentence describing the dish
   - "ingredients" (list of strings): Only ingredients from the provided inventory
   - "steps" (list of strings): Clear, numbered cooking steps
   - "prep_time" (string): e.g. "10 minutes"
   - "cook_time" (string): e.g. "20 minutes"
   - "servings" (integer)
4. Only use ingredients that are in the provided inventory.
5. Make the recipes varied (e.g. one simple, one more involved, one creative).

Example output:
{
  "recipes": [
    {
      "title": "Garlic Chicken Stir-fry",
      "description": "A quick and flavourful weeknight chicken dish.",
      "ingredients": ["Chicken Breast", "Garlic", "Soy Sauce"],
      "steps": ["1. Slice chicken into strips.", "2. Heat oil in pan.", "3. Add garlic and chicken, stir-fry 8 minutes.", "4. Add soy sauce and serve."],
      "prep_time": "10 minutes",
      "cook_time": "15 minutes",
      "servings": 2
    }
  ]
}"""


class InventoryItem(BaseModel):
    item_name: str
    category: str = ""
    count: int = 1
    detail: str = ""


class ChatRequest(BaseModel):
    message: str
    health_profile: str
    current_inventory: list[str]


class RecipeRequest(BaseModel):
    inventory: list[InventoryItem]
    liked_recipes: list[str] = []
    disliked_recipes: list[str] = []


class TextRequest(BaseModel):
    text: str


@app.post("/generate-recipes")
async def generate_recipes(body: RecipeRequest):
    if not body.inventory:
        raise HTTPException(status_code=400, detail="Inventory cannot be empty.")

    item_list = "\n".join(
        f"- {item.item_name} (x{item.count})" for item in body.inventory
    )
    prompt = f"{RECIPE_PROMPT}\n\nAvailable ingredients:\n{item_list}"

    if body.liked_recipes:
        liked = "\n".join(f"- {t}" for t in body.liked_recipes)
        prompt += f"\n\nThe user has enjoyed these recipes before — suggest something in a similar style:\n{liked}"

    if body.disliked_recipes:
        disliked = "\n".join(f"- {t}" for t in body.disliked_recipes)
        prompt += f"\n\nThe user did NOT enjoy these recipes — avoid suggesting anything similar:\n{disliked}"

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")

    try:
        result = json.loads(response.choices[0].message.content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Model returned non-JSON response.")

    if "recipes" not in result:
        raise HTTPException(status_code=500, detail="Model response missing 'recipes' key.")

    return result


@app.post("/analyze-image")
async def analyze_image(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

    mime_type = image.content_type or "image/jpeg"
    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{mime_type};base64,{b64_image}"

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": INVENTORY_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": data_url}},
                        {"type": "text", "text": "Analyze this image and return the food inventory as JSON."},
                    ],
                },
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")

    raw_content = response.choices[0].message.content
    try:
        result = json.loads(raw_content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Model returned non-JSON response.")

    if "inventory" not in result:
        raise HTTPException(status_code=500, detail="Model response missing 'inventory' key.")

    return result


@app.get("/recipe-image")
async def recipe_image(title: str):
    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            "https://api.unsplash.com/search/photos",
            params={"query": title, "per_page": 1, "orientation": "landscape"},
            headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Unsplash API error.")
    results = resp.json().get("results", [])
    if not results:
        return {"image_url": None}
    return {"image_url": results[0]["urls"]["regular"]}


@app.post("/analyze-text")
async def analyze_text(payload: TextRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text input cannot be empty.")

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": INVENTORY_PROMPT},
                {
                    "role": "user",
                    "content": f"Convert this food list into structured inventory JSON: {payload.text}",
                },
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")

    raw_content = response.choices[0].message.content
    try:
        result = json.loads(raw_content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Model returned non-JSON response.")

    if "inventory" not in result:
        raise HTTPException(status_code=500, detail="Model response missing 'inventory' key.")

    return result


@app.post("/api/chat")
async def chat(body: ChatRequest):
    system_instructions = f"""
You are an expert clinical dietician and medical dietary assistant.

USER HEALTH PROFILE: {body.health_profile}
USER FRIDGE INVENTORY: {body.current_inventory}

CRITICAL RULES:
1. STRICT MEDICAL COMPLIANCE: Base all your health warnings and nutritional advice strictly on official FDA food-drug interaction guides and condition-specific clinical nutrition guidelines (e.g., AHA, ADA).
2. Never suggest a recipe or food that conflicts with the user's medical profile or medications.
3. Answer their question based ONLY on the food they actually have in their inventory.
4. If there is a risk of a food-drug interaction, you must refuse the recipe and explain the medical reasoning clearly.
"""
    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instructions,
        )
        response = model.generate_content(body.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

    return {"response": response.text}
