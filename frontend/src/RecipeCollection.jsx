import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { collection, getDocs, orderBy, query, doc, updateDoc, deleteDoc } from "firebase/firestore";
import AppNav from "./AppNav";
import "./RecipeCollection.css";

const IMAGE_BASE = "http://localhost:8000/recipe-image";

export default function RecipeCollection() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [tab, setTab] = useState("all");
    const [recipeImage, setRecipeImage] = useState(null);
    const [hoverRating, setHoverRating] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid) { setLoading(false); return; }
        getDocs(query(collection(db, "users", uid, "recipes"), orderBy("savedAt", "desc")))
            .then(snap => setRecipes(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selected) { setRecipeImage(null); return; }
        setRecipeImage(null);
        fetch(`${IMAGE_BASE}?title=${encodeURIComponent(selected.title)}`)
            .then(r => r.json())
            .then(d => setRecipeImage(d.image_url || null))
            .catch(() => {});
    }, [selected?.id]);

    function handleSelect(recipe) {
        if (selected?.id === recipe.id) { setSelected(null); return; }
        setSelected(recipe);
        setHoverRating(0);
    }

    async function toggleFavorite(e, recipeId, currentVal) {
        e.stopPropagation();
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const next = !currentVal;
        await updateDoc(doc(db, "users", uid, "recipes", recipeId), { isFavorited: next });
        setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, isFavorited: next } : r));
        if (selected?.id === recipeId) setSelected(prev => ({ ...prev, isFavorited: next }));
    }

    async function handleRating(newRating) {
        if (!selected) return;
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        await updateDoc(doc(db, "users", uid, "recipes", selected.id), { rating: newRating });
        setRecipes(prev => prev.map(r => r.id === selected.id ? { ...r, rating: newRating } : r));
        setSelected(prev => ({ ...prev, rating: newRating }));
    }

    async function handleDelete(recipeId) {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        await deleteDoc(doc(db, "users", uid, "recipes", recipeId));
        setRecipes(prev => prev.filter(r => r.id !== recipeId));
        if (selected?.id === recipeId) setSelected(null);
    }

    const favorites = recipes.filter(r => r.isFavorited);
    const displayed = tab === "favorites" ? favorites : recipes;
    const ingredients = selected?.ingredients || [];
    const half = Math.ceil(ingredients.length / 2);

    if (loading) return (
        <>
            <AppNav displayName={auth.currentUser?.displayName} />
            <div className="col-page"><p className="col-loading">Loading your cookbook...</p></div>
        </>
    );

    return (
        <>
            <AppNav displayName={auth.currentUser?.displayName} />
            <div className="col-page">

                <header className="col-header">
                    <div>
                        <div className="col-eyebrow">SAVED RECIPES</div>
                        <h1 className="col-title">YOUR COOKBOOK</h1>
                    </div>
                    <div className="col-tabs">
                        <button
                            className={`col-tab ${tab === "all" ? "col-tab--active" : ""}`}
                            onClick={() => setTab("all")}
                        >
                            All <span className="col-tab-count">{recipes.length}</span>
                        </button>
                        <button
                            className={`col-tab ${tab === "favorites" ? "col-tab--active" : ""}`}
                            onClick={() => setTab("favorites")}
                        >
                            ♥ Favorites <span className="col-tab-count">{favorites.length}</span>
                        </button>
                    </div>
                </header>

                {!recipes.length ? (
                    <div className="col-empty-state">
                        <div className="col-empty-icon">🍳</div>
                        <p className="col-empty-title">No recipes yet</p>
                        <p className="col-empty-sub">Scan your ingredients and generate your first recipe to start building your cookbook.</p>
                        <button className="col-cta" onClick={() => navigate("/review")}>SCAN INGREDIENTS →</button>
                    </div>
                ) : tab === "favorites" && !favorites.length ? (
                    <div className="col-empty-state">
                        <div className="col-empty-icon">♡</div>
                        <p className="col-empty-title">No favorites yet</p>
                        <p className="col-empty-sub">Heart any recipe in your collection to pin it here.</p>
                        <button className="col-tab-switch" onClick={() => setTab("all")}>View All Recipes</button>
                    </div>
                ) : (
                    <div className={`col-body ${selected ? "col-body--split" : ""}`}>

                        {/* ── RECIPE LIST ── */}
                        <div className="col-list">
                            {displayed.map((recipe, i) => (
                                <div
                                    key={recipe.id}
                                    className={`col-row ${selected?.id === recipe.id ? "col-row--active" : ""}`}
                                    onClick={() => handleSelect(recipe)}
                                >
                                    <div className="col-row-num">{String(i + 1).padStart(2, "0")}</div>
                                    <div className="col-row-body">
                                        <div className="col-row-top">
                                            <span className="col-row-title">{recipe.title}</span>
                                            {recipe.isFavorited && <span className="col-fav-dot">♥</span>}
                                        </div>
                                        <p className="col-row-desc">{recipe.description}</p>
                                        <div className="col-row-meta">
                                            {recipe.prep_time && <span>PREP {recipe.prep_time.toUpperCase()}</span>}
                                            {recipe.cook_time && <span>COOK {recipe.cook_time.toUpperCase()}</span>}
                                            {recipe.rating > 0 && (
                                                <span className="col-row-stars">
                                                    {"★".repeat(recipe.rating)}{"☆".repeat(5 - recipe.rating)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-row-actions">
                                        <button
                                            className={`col-heart ${recipe.isFavorited ? "col-heart--on" : ""}`}
                                            onClick={(e) => toggleFavorite(e, recipe.id, recipe.isFavorited)}
                                            aria-label="Toggle favourite"
                                        >
                                            {recipe.isFavorited ? "♥" : "♡"}
                                        </button>
                                        <span className="col-row-arrow">
                                            {selected?.id === recipe.id ? "×" : "→"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── DETAIL PANEL ── */}
                        {selected && (
                            <div className="col-detail">
                                <button className="col-detail-close" onClick={() => setSelected(null)}>✕ CLOSE</button>

                                <div className="col-detail-hero">
                                    {recipeImage
                                        ? <img className="col-detail-img" src={recipeImage} alt={selected.title} />
                                        : <div className="col-detail-hero-placeholder" />
                                    }
                                    <div className="col-detail-hero-overlay" />
                                </div>

                                <div className="col-detail-content">
                                    <div className="col-detail-eyebrow">SAVED RECIPE</div>
                                    <h2 className="col-detail-title">{selected.title}</h2>
                                    <p className="col-detail-desc">{selected.description}</p>

                                    <div className="col-detail-meta">
                                        {selected.prep_time && (
                                            <div className="col-meta-chip">
                                                <span className="col-meta-label">PREP</span>
                                                <span className="col-meta-val">{selected.prep_time}</span>
                                            </div>
                                        )}
                                        {selected.cook_time && (
                                            <div className="col-meta-chip">
                                                <span className="col-meta-label">COOK</span>
                                                <span className="col-meta-val">{selected.cook_time}</span>
                                            </div>
                                        )}
                                        {selected.servings && (
                                            <div className="col-meta-chip">
                                                <span className="col-meta-label">SERVES</span>
                                                <span className="col-meta-val">{selected.servings}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-detail-actions">
                                        <button
                                            className={`col-detail-fav ${selected.isFavorited ? "col-detail-fav--on" : ""}`}
                                            onClick={(e) => toggleFavorite(e, selected.id, selected.isFavorited)}
                                        >
                                            {selected.isFavorited ? "♥ Favorited" : "♡ Add to Favorites"}
                                        </button>
                                        <div className="col-detail-stars">
                                            <span className="col-stars-label">RATE</span>
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <button
                                                    key={n}
                                                    className={`col-star ${n <= (hoverRating || selected.rating || 0) ? "col-star--on" : ""}`}
                                                    onClick={() => handleRating(n)}
                                                    onMouseEnter={() => setHoverRating(n)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    aria-label={`Rate ${n} stars`}
                                                >★</button>
                                            ))}
                                        </div>
                                    </div>

                                    {ingredients.length > 0 && (
                                        <div className="col-section">
                                            <h3 className="col-section-heading">
                                                <span className="col-section-num">01</span> INGREDIENTS
                                            </h3>
                                            <div className="col-ingredients-grid">
                                                <ul>
                                                    {ingredients.slice(0, half).map((item, i) => (
                                                        <li key={i}>{item}</li>
                                                    ))}
                                                </ul>
                                                <ul>
                                                    {ingredients.slice(half).map((item, i) => (
                                                        <li key={i}>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {selected.steps?.length > 0 && (
                                        <div className="col-section">
                                            <h3 className="col-section-heading">
                                                <span className="col-section-num">02</span> INSTRUCTIONS
                                            </h3>
                                            <div className="col-steps">
                                                {selected.steps.map((step, i) => (
                                                    <div className="col-step" key={i}>
                                                        <div className="col-step-num">{String(i + 1).padStart(2, "0")}</div>
                                                        <p className="col-step-text">{step}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="col-detail-footer">
                                        <button className="col-delete-btn" onClick={() => handleDelete(selected.id)}>
                                            Remove from Collection
                                        </button>
                                        <button className="col-cook-btn" onClick={() => navigate("/review")}>
                                            Cook Something New →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
