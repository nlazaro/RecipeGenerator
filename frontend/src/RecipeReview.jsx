import React, { useRef, useState } from "react";
import "./reciple_review.css";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { collection, getDocs, query, orderBy, doc, setDoc } from "firebase/firestore";

const RECIPE_URL = "http://localhost:8000/generate-recipes"; // swap when teammate is ready

export default function recipe_review() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [ingredients, setIngredients] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const removeIngredient = (id) => {
        setIngredients((prev) => prev.filter((item) => item.id !== id));
    };

    const addIngredient = () => {
        const newItem = {
            //id: Date.now().toString(),
            name: "New Ingredient",
            detail: "Edit me",
        };
        setIngredients((prev) => [...prev, newItem]);
    };

    const editIngredient = (id) => {
        const newName = prompt("Enter new name:");
        if (!newName) return;

        setIngredients((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, name: newName } : item
            )
        );
    };

    const handleConfirm = async () => {
        if (ingredients.length === 0) return;
        setError("");
        setLoading(true);

        const inventory = ingredients.map((item) => ({ item_name: item.name, detail: item.detail }));

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

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError("");
        setLoading(true);

        const previewUrl = URL.createObjectURL(file);
        setSelectedImage(previewUrl);

        const formData = new FormData();
        formData.append("image", file);

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

            setIngredients(mappedIngredients);
        } catch (err) {
            setError(err.message || "Something went wrong.");
            setIngredients([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <header className="header">
                <h4>{loading ? "ANALYZING IMAGE" : "ANALYSIS COMPLETE"}</h4>
                <h1>IDENTIFIED ITEMS</h1>
            </header>

            <div className="content">
                <div className="imageSection">
                    {!selectedImage ? (
                        <div
                            className="uploadBox"
                            onClick={handleUploadClick}
                            style={{
                                width: "100%",
                                height: "100%",
                                minHeight: "500px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                cursor: "pointer",
                                border: "2px dashed #ccc",
                                borderRadius: "8px",
                                background: "#f8f8f8",
                            }}
                        >
                            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⬆</div>
                            <p style={{ margin: 0, fontWeight: "600" }}>
                                Click to upload image
                            </p>
                            <p style={{ marginTop: "8px", color: "#777" }}>
                                JPG, PNG, WEBP supported
                            </p>
                        </div>
                    ) : (
                        <>
                            <img src={selectedImage} alt="Uploaded ingredient" />
                            {loading && (
                                <div className="tag top">Analyzing image...</div>
                            )}
                            {!loading && ingredients[0] && (
                                <div className="tag top">
                                    Detected • {ingredients[0].name}
                                </div>
                            )}
                            {!loading && ingredients[1] && (
                                <div className="tag bottom">
                                    Detected • {ingredients[1].name}
                                </div>
                            )}
                        </>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                    />
                </div>

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

                                <span
                                    className="edit"
                                    onClick={() => editIngredient(item.id)}
                                >
                                    ✎
                                </span>

                                <span
                                    className="delete"
                                    onClick={() => removeIngredient(item.id)}
                                >
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