import React, { useRef, useState } from "react";
import "./reciple_review.css";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { collection, getDocs, query, orderBy, doc, setDoc } from "firebase/firestore";

const RECIPE_URL = "http://localhost:8000/generate-recipes";

export default function recipe_review() {

    const removeImage = (indexToRemove) => {
        setSelectedImages((prev) =>
            prev.filter((_, index) => index !== indexToRemove)
        );
    };

    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [ingredients, setIngredients] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mode, setMode] = useState("image");
    const [textInput, setTextInput] = useState("");

    useEffect(() => {

        if (mode !== "image") return;
        const allIngredients = selectedImages.flatMap(img => img.ingredients || []);
        setIngredients(allIngredients);
    }, [selectedImages]);

    const removeIngredient = (id) => {
        setIngredients((prev) => prev.filter((item) => item.id !== id));
    };

    const addIngredient = () => {
        const newItem = {
            id: Date.now().toString(), // ✅ FIXED
            name: "New Ingredient",
            detail: "Edit me",
        };
        setIngredients((prev) => [...prev, newItem]);
    };

    const editIngredient = (id) => {
        const newName = prompt("Enter new name:");
        if (!newName) return;

        const newQty = prompt("Enter quantity:");
        if (!newQty) return;

        setIngredients((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        name: newName,
                        detail: `Qty: ${newQty}`, // or keep category if needed
                    }
                    : item
            )
        );
    };

    const maxReached = selectedImages.length >= 9;

    const handleConfirm = async () => {
        if (ingredients.length === 0) return;
        setError("");
        setLoading(true);

        const inventory = ingredients.map((item) => ({
            item_name: item.name,
            detail: item.detail,
        }));

        const uid = auth.currentUser?.uid;

        let liked_recipes = [];
        let disliked_recipes = [];

        try {
            if (uid) {
                await setDoc(doc(db, "users", uid), {
                    inventory,
                    inventoryUpdatedAt: new Date(),
                }, { merge: true });

                const snap = await getDocs(query(collection(db, "users", uid, "recipes"), orderBy("savedAt", "desc")));
                const saved = snap.docs.map(d => d.data()).filter(r => r.rating);
                liked_recipes = saved.filter(r => r.rating >= 4).slice(0, 3).map(r => r.title);
                disliked_recipes = saved.filter(r => r.rating <= 2).slice(0, 3).map(r => r.title);
            }

            const response = await fetch(RECIPE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inventory, liked_recipes, disliked_recipes }),
            });

            if (!response.ok) throw new Error(`Recipe API error: ${response.status}`);
            const data = await response.json();

            navigate("/confirmation", { state: { recipes: data, inventory } });
        } catch (err) {
            setError("Inventory saved! Recipe generation failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleTextSubmit = async () => {
        if (!textInput.trim()) return;

        setError("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:8000/analyze-text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: textInput }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Failed to analyze text.");
            }

            const mappedIngredients = (data.inventory || []).map((item, index) => ({
                id: Date.now().toString() + Math.random(),
                id: String(index + 1).padStart(2, "0"),
                name: item.item_name,
                detail: `${item.category} • Qty: ${item.count}`,
            }));

            setIngredients((prev) => [...prev, ...mappedIngredients]);
            setSelectedImages([]);  // ✅ clear image
        } catch (err) {
            setError(err.message || "Something went wrong.");
            setIngredients([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setError("");
        setLoading(true);

        // Preview URLs
        const newPreviews = files.map((file) => ({
            file,
            url: URL.createObjectURL(file),
            ingredients: [], // 👈 attach ingredients to this image
        }));

        // Add to existing images
        setSelectedImages((prev) => {
            const combined = [...prev, ...newPreviews];
            return combined.slice(0, 9); // ✅ limit to 9 images
        });

        // 👉 For now: only analyze the FIRST newly uploaded image
        const formData = new FormData();
        formData.append("image", files[0]);

        try {
            const response = await fetch("http://localhost:8000/analyze-image", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Failed to analyze image.");
            }

            const mappedIngredients = (data.inventory || []).map((item, index) => ({
                id: String(index + 1).padStart(2, "0"),
                name: item.item_name,
                detail: `${item.category} • Qty: ${item.count}`,
            }));

            setSelectedImages((prev) => {
                const updated = [...prev];

                // attach ingredients to the LAST added image
                const lastIndex = updated.length - newPreviews.length;

                updated[lastIndex].ingredients = mappedIngredients;

                return updated;
            });
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="container">
            <header className="header">
                <h4>
                    {loading
                        ? mode === "image"
                            ? "ANALYZING IMAGE"
                            : "ANALYZING TEXT"
                        : "ANALYSIS COMPLETE"}
                </h4>
                <h1>IDENTIFIED ITEMS</h1>
            </header>

            <div className="content">

                {/* ✅ TOGGLE */}
                <div style={{ marginBottom: "16px", display: "flex", gap: "10px" }}>
                    <button
                        onClick={() => {
                            setMode("image");
                            setTextInput("");
                        }}
                        style={{
                            padding: "8px 16px",
                            background: mode === "image" ? "#000" : "#ddd",
                            color: mode === "image" ? "#fff" : "#000",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                        }}
                    >
                        Upload Image
                    </button>

                    <button
                        onClick={() => {
                            setMode("text");
                            setSelectedImages([]);
                        }}
                        style={{
                            padding: "8px 16px",
                            background: mode === "text" ? "#000" : "#ddd",
                            color: mode === "text" ? "#fff" : "#000",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                        }}
                    >
                        Type Ingredients
                    </button>
                </div>

                {/* ✅ IMAGE / TEXT SECTION */}
                <div className="imageSection">

                    {mode === "text" && (
                        <div style={{ width: "100%" }}>
                            <textarea
                                placeholder="e.g. 2 apples, 1 gallon milk, chicken breast"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                style={{
                                    width: "100%",
                                    minHeight: "150px",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid #ccc",
                                    marginBottom: "12px",
                                }}
                            />

                            <button
                                onClick={handleTextSubmit}
                                disabled={loading || !textInput.trim()}
                                className="primary"
                            >
                                Analyze Text
                            </button>
                        </div>
                    )}

                    {mode === "image" && (
                        <>
                            {selectedImages.length === 0 ? (
                                <div className="uploadBox" onClick={handleUploadClick}>
                                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>⬆</div>
                                    <p>Click to upload image</p>
                                    <p style={{ color: "#777" }}>
                                        JPG, PNG, WEBP supported
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Show all uploaded images */}
                                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                        {selectedImages.map((img, index) => (
                                            <div
                                                key={index}
                                                style={{ position: "relative", display: "inline-block" }}
                                            >
                                                <img
                                                    src={img.url}
                                                    alt="Uploaded"
                                                    style={{ width: "120px", borderRadius: "8px" }}
                                                />

                                                {/* ❌ Delete button */}
                                                <button
                                                    onClick={() => removeImage(index)}
                                                    style={{
                                                        position: "absolute",
                                                        top: "5px",
                                                        right: "5px",
                                                        background: "rgba(0,0,0,0.6)",
                                                        color: "#fff",
                                                        border: "none",
                                                        borderRadius: "50%",
                                                        width: "24px",
                                                        height: "24px",
                                                        cursor: "pointer",
                                                        fontSize: "14px",
                                                        lineHeight: "24px",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* ✅ NEW BUTTON (this is what you wanted) */}
                                    <button
                                        disabled={maxReached}
                                        onClick={handleUploadClick}
                                        style={{
                                            marginTop: "12px",
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            border: "1px solid #ccc",
                                            cursor: "pointer",
                                        }}
                                    >
                                        + Add more images
                                    </button>

                                    {loading && <div className="tag top">Analyzing image...</div>}
                                </>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                            />
                        </>
                    )}
                </div>

                {/* ✅ PANEL */}
                <div className="panel">
                    <div className="panelHeader">
                        <h3>INGREDIENTS</h3>
                        <span>{String(ingredients.length).padStart(2, "0")} ITEMS</span>
                    </div>

                    {error && (
                        <p style={{ color: "red", marginBottom: "16px" }}>{error}</p>
                    )}

                    <div className="list">
                        {ingredients.map((item) => (
                            <div key={item.id} className="listItem">
                                <span className="id">{item.id}</span>
                                <div>
                                    <p className="name">{item.name}</p>
                                    <p className="detail">{item.detail}</p>
                                </div>

                                <span className="edit" onClick={() => editIngredient(item.id)}>
                                    ✎
                                </span>

                                <span className="delete" onClick={() => removeIngredient(item.id)}>
                                    🗑
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        className="primary"
                        onClick={handleConfirm}
                        disabled={loading || ingredients.length === 0}
                    >
                        CONFIRM SELECTION →
                    </button>

                    <button className="secondary" onClick={addIngredient}>
                        ADD MISSING ITEM
                    </button>
                </div>
            </div>

            <footer className="footer">
                <p>
                    “The quality of identification improves with natural lighting and
                    clear separation of ingredients.”
                </p>
            </footer>
        </div>
    );
}