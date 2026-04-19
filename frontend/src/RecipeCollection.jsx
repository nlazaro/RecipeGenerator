import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import Navbar from "./Navbar";
import "./RecipeCollection.css";

export default function RecipeCollection() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid) { setLoading(false); return; }

        getDocs(query(collection(db, "users", uid, "recipes"), orderBy("savedAt", "desc")))
            .then(snap => setRecipes(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
            .finally(() => setLoading(false));
    }, []);

    function handleClick(recipe) {
        navigate("/confirmation", { state: { recipes: { recipes: [recipe] }, inventory: [] } });
    }

    const favorites = recipes.filter(r => r.isFavorited);
    const all = recipes;

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="collection-page">
                    <p className="collection-empty">Loading...</p>
                </div>
            </>
        );
    }

    if (!recipes.length) {
        return (
            <>
                <Navbar />
                <div className="collection-page">
                    <header className="collection-header">
                        <div className="collection-label">SAVED RECIPES</div>
                        <h1 className="collection-title">YOUR COLLECTION</h1>
                    </header>
                    <p className="collection-empty">No saved recipes yet. Generate some and save your favourites!</p>
                    <button className="collection-cta" onClick={() => navigate("/review")}>
                        GET STARTED →
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="collection-page">
                <header className="collection-header">
                    <div className="collection-label">SAVED RECIPES</div>
                    <h1 className="collection-title">YOUR COLLECTION</h1>
                    <p className="collection-subtitle">{recipes.length} recipe{recipes.length !== 1 ? "s" : ""} saved</p>
                </header>

                {favorites.length > 0 && (
                    <section className="collection-section">
                        <h2 className="section-heading">♥ FAVOURITES</h2>
                        <div className="recipe-grid favorites-grid">
                            {favorites.map(recipe => (
                                <RecipeCard key={recipe.id} recipe={recipe} onClick={() => handleClick(recipe)} favorite />
                            ))}
                        </div>
                    </section>
                )}

                <section className="collection-section">
                    <h2 className="section-heading">ALL RECIPES</h2>
                    <div className="recipe-list">
                        {all.map((recipe, i) => (
                            <div className="list-row" key={recipe.id} onClick={() => handleClick(recipe)}>
                                <div className="list-num">{String(i + 1).padStart(2, "0")}</div>
                                <div className="list-body">
                                    <div className="list-title-row">
                                        <span className="list-title">{recipe.title}</span>
                                        {recipe.isFavorited && <span className="fav-badge">♥</span>}
                                    </div>
                                    <p className="list-desc">{recipe.description}</p>
                                    <div className="list-meta">
                                        <span>PREP {recipe.prep_time?.toUpperCase()}</span>
                                        <span>COOK {recipe.cook_time?.toUpperCase()}</span>
                                        <span>{recipe.servings} SERVINGS</span>
                                        {recipe.rating && <span>{"★".repeat(recipe.rating)}{"☆".repeat(5 - recipe.rating)}</span>}
                                    </div>
                                </div>
                                <div className="list-arrow">→</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

function RecipeCard({ recipe, onClick, favorite }) {
    return (
        <div className={`fav-card ${favorite ? "fav-card--highlighted" : ""}`} onClick={onClick}>
            <div className="fav-card-body">
                <h3 className="fav-card-title">{recipe.title}</h3>
                <p className="fav-card-desc">{recipe.description}</p>
                <div className="fav-card-meta">
                    <span>PREP {recipe.prep_time?.toUpperCase()}</span>
                    <span>COOK {recipe.cook_time?.toUpperCase()}</span>
                </div>
                {recipe.rating && (
                    <div className="fav-card-stars">
                        {"★".repeat(recipe.rating)}{"☆".repeat(5 - recipe.rating)}
                    </div>
                )}
            </div>
            <div className="fav-card-arrow">→</div>
        </div>
    );
}
