import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import "./confirmation.css";

export default function Confirmation() {
    const location = useLocation();
    const navigate = useNavigate();
    const recipeList = location.state?.recipes?.recipes || [];
    const [selected, setSelected] = useState(null);

    const [isFavorited, setIsFavorited] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    function handleSelectRecipe(i) {
        setSelected(i);
        setIsFavorited(false);
        setRating(0);
        setHoverRating(0);
        setFeedback("");
        setSaved(false);
    }

    async function handleSave() {
        const uid = auth.currentUser?.uid;
        if (!uid || selected === null) return;
        const recipe = recipeList[selected];
        setSaving(true);
        try {
            await addDoc(collection(db, "users", uid, "recipes"), {
                title: recipe.title,
                description: recipe.description,
                ingredients: recipe.ingredients,
                steps: recipe.steps,
                prep_time: recipe.prep_time,
                cook_time: recipe.cook_time,
                servings: recipe.servings,
                isFavorited,
                rating: rating || null,
                feedback: feedback.trim() || null,
                savedAt: new Date(),
            });
            setSaved(true);
        } finally {
            setSaving(false);
        }
    }

    if (!recipeList.length) {
        return (
            <div className="recipe-page">
                <nav className="topbar">
                    <div className="brand">RECIPEGEN</div>
                </nav>
                <div style={{ padding: "48px", textAlign: "center" }}>
                    <p style={{ color: "#888", marginBottom: "24px" }}>No recipes found.</p>
                    <button className="btn btn-dark" style={{ width: "auto", padding: "16px 32px" }} onClick={() => navigate("/review")}>
                        ← GO BACK
                    </button>
                </div>
            </div>
        );
    }

    if (selected !== null) {
        const recipe = recipeList[selected];
        const half = Math.ceil(recipe.ingredients.length / 2);
        const leftIngredients = recipe.ingredients.slice(0, half);
        const rightIngredients = recipe.ingredients.slice(half);

        return (
            <div className="recipe-page">
                <nav className="topbar">
                    <div className="brand">RECIPEGEN</div>
                    <div className="nav-right">
                        <button className="back-btn" onClick={() => setSelected(null)}>← ALL RECIPES</button>
                    </div>
                </nav>

                <main className="hero-grid">
                    <section className="hero-left">
                        <div className="label">AI GENERATED RECIPE</div>
                        <h1 className="recipe-title">{recipe.title.toUpperCase()}</h1>
                        <p className="recipe-description">{recipe.description}</p>
                    </section>

                    <aside className="recipe-sidebar">
                        <div className="meta-block">
                            <div className="meta-row">
                                <span>PREP TIME</span>
                                <strong>{recipe.prep_time.toUpperCase()}</strong>
                            </div>
                            <div className="meta-row">
                                <span>COOK TIME</span>
                                <strong>{recipe.cook_time.toUpperCase()}</strong>
                            </div>
                            <div className="meta-row">
                                <span>SERVINGS</span>
                                <strong>{String(recipe.servings).padStart(2, "0")}</strong>
                            </div>
                        </div>

                        {/* Favorite + Rating */}
                        <div className="save-block">
                            <div className="favorite-row">
                                <button
                                    className={`fav-btn ${isFavorited ? "fav-active" : ""}`}
                                    onClick={() => setIsFavorited(v => !v)}
                                    aria-label="Toggle favourite"
                                >
                                    {isFavorited ? "♥" : "♡"} {isFavorited ? "Favourited" : "Add to Favourites"}
                                </button>
                            </div>

                            <div className="rating-row">
                                <span className="rating-label">RATE THIS RECIPE</span>
                                <div className="stars">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            className={`star ${n <= (hoverRating || rating) ? "star-on" : ""}`}
                                            onClick={() => setRating(n)}
                                            onMouseEnter={() => setHoverRating(n)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            aria-label={`Rate ${n} stars`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="feedback-row">
                                <span className="rating-label">FEEDBACK (OPTIONAL)</span>
                                <textarea
                                    className="feedback-input"
                                    placeholder="e.g. Too salty, great texture, would make again..."
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <button
                                className="btn btn-dark"
                                onClick={handleSave}
                                disabled={saving || saved}
                            >
                                {saved ? "✓ SAVED" : saving ? "SAVING..." : "SAVE TO COLLECTION"}
                            </button>

                            <button className="btn btn-light" onClick={() => navigate("/review")}>
                                START OVER
                            </button>
                        </div>
                    </aside>
                </main>

                <section className="ingredients-section">
                    <h2>
                        <span className="section-number">01</span> INGREDIENTS
                    </h2>
                    <div className="ingredients-grid">
                        <ul>
                            {leftIngredients.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                        <ul>
                            {rightIngredients.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="instructions-section">
                    <h2>
                        <span className="section-number">02</span> INSTRUCTIONS
                    </h2>
                    <div className="instructions-list">
                        {recipe.steps.map((step, i) => (
                            <div className="instruction-item" key={i}>
                                <div className="instruction-number">{String(i + 1).padStart(2, "0")}</div>
                                <div className="instruction-content">
                                    <p>{step}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="recipe-page">
            <nav className="topbar">
                <div className="brand">RECIPEGEN</div>
                <div className="nav-right">
                    <button className="back-btn" onClick={() => navigate("/review")}>← BACK</button>
                </div>
            </nav>

            <header className="selection-header">
                <div className="label">AI GENERATED</div>
                <h1 className="recipe-title">YOUR RECIPES</h1>
                <p className="selection-subtitle">Select a recipe to view the full instructions.</p>
            </header>

            <div className="recipe-cards">
                {recipeList.map((recipe, i) => (
                    <div className="recipe-card" key={i} onClick={() => handleSelectRecipe(i)}>
                        <div className="card-number">{String(i + 1).padStart(2, "0")}</div>
                        <div className="card-body">
                            <h2 className="card-title">{recipe.title}</h2>
                            <p className="card-desc">{recipe.description}</p>
                            <div className="card-meta">
                                <span>PREP {recipe.prep_time.toUpperCase()}</span>
                                <span>COOK {recipe.cook_time.toUpperCase()}</span>
                                <span>{recipe.servings} SERVINGS</span>
                            </div>
                        </div>
                        <div className="card-arrow">→</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
