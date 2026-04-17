import base64
import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not set. Copy .env.example to .env and fill in your key.")

client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """You are a highly precise food inventory vision agent for a healthcare application. Your task is to analyze images of food, groceries, or refrigerators and extract the items present.

Rules:
1. You MUST output strictly in JSON format. Do not include conversational filler like "Here is the JSON."
2. The JSON must contain a single key called "inventory", which is a list of objects.
3. Each object must have exactly three keys:
   - "item_name" (string): The specific name of the food item. Be descriptive (e.g., "Banana" and "Greek Yogurt" instead of just "Yogurt" ).
   - "category" (string): Must be strictly categorized as one of the following: [Produce, Dairy, Protein, Pantry, Beverage, Snack, Other].
   - "count" (integer): The estimated visual quantity. If the item is in a container (like a jar of sauce or a carton of eggs), count the container as 1 unless individual items are clearly visible.

Example Output Format:
{
  "inventory": [
    {"item_name": "Granny Smith Apple", "category": "Produce", "count": 3},
    {"item_name": "Almond Milk", "category": "Dairy", "count": 1},
    {"item_name": "Chicken Breast", "category": "Protein", "count": 2}
  ]
}"""

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


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
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": data_url},
                        },
                        {
                            "type": "text",
                            "text": "Analyze this image and return the food inventory as JSON.",
                        },
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
