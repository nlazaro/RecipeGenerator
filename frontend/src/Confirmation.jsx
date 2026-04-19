import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";
import AppNav from "./AppNav";
import "./Confirmation.css";

const RECIPE_URL = "http://localhost:8000/generate-recipes";

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function matchToInventory(ingredients, inv) {
    return [...inv]
        .sort((a, b) => (b.item_name?.length || 0) - (a.item_name?.length || 0))
        .filter(item => item.item_name)
        .map(item => {
            const name = item.item_name.toLowerCase().trim();
            const ing = ingredients.find(s => s.toLowerCase().includes(name));
            if (!ing) return null;
            const numMatch = ing.trim().match(/^(\d+(?:\/\d+)?|\d*\.\d+)/);
            let qty = 1;
            if (numMatch) {
                const raw = numMatch[1];
                qty = raw.includes("/")
                    ? Math.max(1, Math.round(parseFloat(raw.split("/")[0]) / parseFloat(raw.split("/")[1])))
                    : Math.max(1, Math.round(parseFloat(raw)));
            }
            return { item, qty, checked: true };
        })
        .filter(Boolean);
}

export default function Confirmation() {
    const location = useLocation();
    const navigate = useNavigate();
    const [recipeList, setRecipeList] = useState(location.state?.recipes?.recipes || []);
    const inventory = location.state?.inventory || [];
    const [selected, setSelected] = useState(null);
    const [regenerating, setRegenerating] = useState(false);
    const [regenError, setRegenError] = useState("");

    const [isFavorited, setIsFavorited] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [recipeImage, setRecipeImage] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);

    const [cookingState, setCookingState] = useState("idle"); // "idle" | "cooking" | "done"
    const [elapsed, setElapsed] = useState(0);
    const [deductions, setDeductions] = useState([]);
    const [deducting, setDeducting] = useState(false);
    const [deducted, setDeducted] = useState(false);

    const displayName = auth.currentUser?.displayName || "";

    useEffect(() => {
        if (selected === null) { setRecipeImage(null); return; }
        const title = recipeList[selected]?.title;
        if (!title) return;
        setImageLoading(true);
        fetch(`http://localhost:8000/recipe-image?title=${encodeURIComponent(title)}`)
            .then(r => r.json())
            .then(d => setRecipeImage(d.image_url || null))
            .catch(() => setRecipeImage(null))
            .finally(() => setImageLoading(false));
    }, [selected]);

    useEffect(() => {
        if (cookingState !== "cooking") return;
        const interval = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => clearInterval(interval);
    }, [cookingState]);

    function resetCookingState() {
        setCookingState("idle");
        setElapsed(0);
        setDeductions([]);
        setDeducted(false);
    }

    function handleSelectRecipe(i) {
        setSelected(i);
        setIsFavorited(false);
        setRating(0);
        setHoverRating(0);
        setFeedback("");
        setSaved(false);
        resetCookingState();
    }

    function handleBackToList() {
        setSelected(null);
        resetCookingState();
    }

    function handleStartCooking() {
        setElapsed(0);
        setCookingState("cooking");
    }

    function handleEndCooking() {
        setCookingState("done");
        const recipe = recipeList[selected];
        setDeductions(matchToInventory(recipe?.ingredients || [], inventory));
    }

    function toggleDeduction(i) {
        setDeductions(prev => prev.map((d, idx) => idx === i ? { ...d, checked: !d.checked } : d));
    }

    function adjustDeduction(i, delta) {
        setDeductions(prev => prev.map((d, idx) => {
            if (idx !== i) return d;
            return { ...d, qty: Math.max(0, d.qty + delta) };
        }));
    }

    async function handleDeductInventory() {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        setDeducting(true);
        try {
            const userSnap = await getDoc(doc(db, "users", uid));
            const freshInventory = userSnap.data()?.inventory || [];
            const active = deductions.filter(d => d.checked && d.qty > 0);
            const updated = freshInventory.map(item => {
                const d = active.find(d => d.item.item_name === item.item_name);
                if (!d) return item;
                return { ...item, quantity: Math.max(0, parseFloat(item.quantity || 0) - d.qty) };
            });
            await updateDoc(doc(db, "users", uid), { inventory: updated });
            setDeducted(true);
        } catch (err) {
            console.error("Inventory update failed:", err);
        } finally {
            setDeducting(false);
        }
    }

    async function handleRegenerate() {
        setRegenerating(true);
        setRegenError("");
        const uid = auth.currentUser?.uid;
        let liked_recipes = [], disliked_recipes = [];
        try {
            if (uid) {
                const snap = await getDocs(query(collection(db, "users", uid, "recipes"), orderBy("savedAt", "desc")));
                const savedR = snap.docs.map(d => d.data()).filter(r => r.rating);
                liked_recipes = savedR.filter(r => r.rating >= 4).slice(0, 3).map(r => r.title);
                disliked_recipes = savedR.filter(r => r.rating <= 2).slice(0, 3).map(r => r.title);
            }
            const response = await fetch(RECIPE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inventory, liked_recipes, disliked_recipes }),
            });
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            setRecipeList(data.recipes || []);
        } catch (err) {
            setRegenError("Failed to regenerate: " + err.message);
        } finally {
            setRegenerating(false);
        }
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

    /* ── EMPTY STATE ── */
    if (!recipeList.length) {
        return (
            <div className="cf-page">
                <AppNav displayName={displayName} />
                <div className="cf-empty">
                    <span className="cf-empty-icon">🍽️</span>
                    <p className="cf-empty-title">No recipes found</p>
                    <p className="cf-empty-sub">Something went wrong generating your recipes.</p>
                    <button className="cf-cta-btn" onClick={() => navigate("/review")}>← Back to Recipe Input</button>
                </div>
            </div>
        );
    }

    /* ── DETAIL VIEW ── */
    if (selected !== null) {
        const recipe = recipeList[selected];
        const half = Math.ceil(recipe.ingredients.length / 2);
        const pantryMatches = matchToInventory(recipe.ingredients || [], inventory);
        const matchedNames = new Set(pantryMatches.map(m => m.item.item_name.toLowerCase()));

        function isMatched(ing) {
            return [...matchedNames].some(name => ing.toLowerCase().includes(name));
        }

        return (
              <div className="cf-page">
                  <AppNav displayName={displayName} />

                  <div className="cf-detail-header">
                      <div className="cf-detail-header-inner">
                          <button className="cf-back-btn" onClick={handleBackToList}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                              </svg>
                              All Recipes
                          </button>
                          <div className="cf-eyebrow">AI GENERATED RECIPE</div>
                          <h1 className="cf-detail-title">{recipe.title}</h1>
                          <p className="cf-detail-desc">{recipe.description}</p>
                      </div>
                  </div>
                </div>

                {(recipeImage || imageLoading) && (
                    <div className="cf-hero-wrap">
                        {imageLoading
                            ? <div className="cf-hero-skeleton" />
                            : <img className="cf-hero-img" src={recipeImage} alt={recipe.title} />
                        }
                    </div>
                )}

                <div className="cf-detail-body">
                    <div className="cf-detail-main">

                        <div className="cf-meta-chips">
                            {recipe.prep_time && (
                                <div className="cf-chip">
                                    <span className="cf-chip-label">PREP</span>
                                    <span className="cf-chip-val">{recipe.prep_time}</span>
                                </div>
                            )}
                            {recipe.cook_time && (
                                <div className="cf-chip">
                                    <span className="cf-chip-label">COOK</span>
                                    <span className="cf-chip-val">{recipe.cook_time}</span>
                                </div>
                            )}
                            {recipe.servings && (
                                <div className="cf-chip">
                                    <span className="cf-chip-label">SERVES</span>
                                    <span className="cf-chip-val">{recipe.servings}</span>
                                </div>
                            )}
                            {pantryMatches.length > 0 && (
                                <div className="cf-chip cf-chip--pantry">
                                    <span className="cf-chip-label">PANTRY MATCH</span>
                                    <span className="cf-chip-val cf-chip-val--green">
                                        {pantryMatches.length}/{recipe.ingredients.length}
                                    </span>
                                </div>
                            )}
                        </div>

                        <section className="cf-section">
                            <div className="cf-section-hd">
                                <span className="cf-section-num">01</span>
                                <h2 className="cf-section-title">Ingredients</h2>
                                {pantryMatches.length > 0 && (
                                    <span className="cf-ingr-legend">
                                        <span className="cf-legend-dot cf-legend-dot--on" /> in pantry
                                        <span className="cf-legend-dot" /> not in pantry
                                    </span>
                                )}
                            </div>
                            <div className="cf-ingredients-grid">
                                <ul className="cf-ingr-list">
                                    {recipe.ingredients.slice(0, half).map((item, i) => (
                                        <li key={i} className={isMatched(item) ? "cf-ingr--matched" : "cf-ingr--missing"}>
                                            {item}
                                            {isMatched(item) && <span className="cf-ingr-badge">✓ pantry</span>}
                                        </li>
                                    ))}
                                </ul>
                                <ul className="cf-ingr-list">
                                    {recipe.ingredients.slice(half).map((item, i) => (
                                        <li key={i} className={isMatched(item) ? "cf-ingr--matched" : "cf-ingr--missing"}>
                                            {item}
                                            {isMatched(item) && <span className="cf-ingr-badge">✓ pantry</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section className="cf-section">
                            <div className="cf-section-hd">
                                <span className="cf-section-num">02</span>
                                <h2 className="cf-section-title">Instructions</h2>
                            </div>
                            <div className="cf-steps">
                                {recipe.steps.map((step, i) => (
                                    <div key={i} className="cf-step">
                                        <div className="cf-step-num">{String(i + 1).padStart(2, "0")}</div>
                                        <p className="cf-step-text">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* ── SIDEBAR ── */}
                    <aside className="cf-sidebar">
                        <div className="cf-sidebar-panel">

                            <button
                                className={`cf-fav-btn${isFavorited ? " cf-fav-btn--on" : ""}`}
                                onClick={() => setIsFavorited(v => !v)}
                            >
                                {isFavorited ? "♥" : "♡"} {isFavorited ? "Favourited" : "Add to Favourites"}
                            </button>

                            {/* ── COOKING FLOW ── */}
                            <div className="cf-cook-section">
                                <div className="cf-sidebar-label">COOKING</div>

                                {cookingState === "idle" && (
                                    <>
                                        {pantryMatches.length > 0 && (
                                            <div className="cf-pantry-coverage">
                                                <span className="cf-coverage-pip" />
                                                {pantryMatches.length} of {recipe.ingredients.length} ingredients in your pantry
                                            </div>
                                        )}
                                        <button className="cf-cook-start-btn" onClick={handleStartCooking}>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5 3 19 12 5 21 5 3"/>
                                            </svg>
                                            Start Cooking
                                        </button>
                                    </>
                                )}

                                {cookingState === "cooking" && (
                                    <div className="cf-cook-active">
                                        <div className="cf-cook-live">
                                            <span className="cf-cook-pulse" />
                                            <span className="cf-cook-elapsed">{formatTime(elapsed)}</span>
                                        </div>
                                        <button className="cf-cook-end-btn" onClick={handleEndCooking}>
                                            ✓ Done Cooking
                                        </button>
                                    </div>
                                )}

                                {cookingState === "done" && (
                                    <div className="cf-cook-done-area">
                                        <div className="cf-cook-done-badge">
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                            Cooked in {formatTime(elapsed)}
                                        </div>

                                        {!deducted ? (
                                            deductions.length > 0 ? (
                                                <>
                                                    <div className="cf-sidebar-label" style={{ marginTop: 14 }}>USED FROM PANTRY</div>
                                                    <div className="cf-deduct-list">
                                                        {deductions.map((d, i) => {
                                                            const current = parseFloat(d.item.quantity || 0);
                                                            const remaining = Math.max(0, current - (d.checked ? d.qty : 0));
                                                            const isZero = d.checked && remaining === 0;
                                                            const isLow  = d.checked && !isZero && remaining <= 2;
                                                            return (
                                                                <div key={i} className={`cf-deduct-row${!d.checked ? " cf-deduct-row--off" : ""}`}>
                                                                    <label className="cf-deduct-check-label">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={d.checked}
                                                                            onChange={() => toggleDeduction(i)}
                                                                            className="cf-deduct-checkbox"
                                                                        />
                                                                        <span className="cf-deduct-name">{d.item.item_name}</span>
                                                                        <span className="cf-deduct-stock">
                                                                            {current}{d.item.unit ? ` ${d.item.unit}` : ""}
                                                                        </span>
                                                                    </label>
                                                                    {d.checked && (
                                                                        <div className="cf-deduct-controls">
                                                                            <div className="cf-deduct-qty-row">
                                                                                <span className="cf-deduct-minus-label">−</span>
                                                                                <button className="cf-deduct-adj" onClick={() => adjustDeduction(i, -1)}>−</button>
                                                                                <span className="cf-deduct-val">{d.qty}</span>
                                                                                <button className="cf-deduct-adj" onClick={() => adjustDeduction(i, 1)}>+</button>
                                                                            </div>
                                                                            <span className={`cf-deduct-after${isZero ? " cf-deduct-after--zero" : isLow ? " cf-deduct-after--low" : ""}`}>
                                                                                → {remaining}{d.item.unit ? ` ${d.item.unit}` : ""} left
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <button
                                                        className="cf-deduct-confirm-btn"
                                                        onClick={handleDeductInventory}
                                                        disabled={deducting || deductions.every(d => !d.checked || d.qty === 0)}
                                                    >
                                                        {deducting ? "Updating…" : "− Update Pantry"}
                                                    </button>
                                                </>
                                            ) : (
                                                <p className="cf-deduct-empty-msg">No pantry items matched this recipe.</p>
                                            )
                                        ) : (
                                            <div className="cf-deduct-success">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                                Pantry Updated
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="cf-sidebar-divider" />

                            <div className="cf-sidebar-block">
                                <div className="cf-sidebar-label">RATE THIS RECIPE</div>
                                <div className="cf-stars">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            className={`cf-star${n <= (hoverRating || rating) ? " cf-star--on" : ""}`}
                                            onClick={() => setRating(n)}
                                            onMouseEnter={() => setHoverRating(n)}
                                            onMouseLeave={() => setHoverRating(0)}
                                        >★</button>
                                    ))}
                                </div>
                            </div>

                            <div className="cf-sidebar-block">
                                <div className="cf-sidebar-label">FEEDBACK (OPTIONAL)</div>
                                <textarea
                                    className="cf-feedback"
                                    placeholder="e.g. Too salty, great texture, would make again…"
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="cf-sidebar-divider" />

                            <button className="cf-cta-btn" onClick={handleSave} disabled={saving || saved}>
                                {saved ? "✓ Saved to Collection" : saving ? "Saving…" : "Save to Collection"}
                            </button>
                            <button className="cf-ghost-btn" onClick={() => navigate("/review")}>
                                Start Over
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        );
    }

    /* ── SELECTION VIEW ── */
    return (
        <div className="cf-page">
            <AppNav displayName={displayName} />

            <div className="cf-sel-header">
                <div className="cf-sel-header-inner">
                    <div>
                        <div className="cf-eyebrow">AI GENERATED</div>
                        <h1 className="cf-sel-title">YOUR RECIPES</h1>
                        <p className="cf-sel-sub">
                            {recipeList.length} recipes crafted from your ingredients. Pick one to get cooking.
                        </p>
                    </div>
                    <div className="cf-sel-actions">
                        <button className="cf-regen-btn" onClick={handleRegenerate} disabled={regenerating}>
                            {regenerating ? (
                                <><div className="cf-regen-spin" /> Generating…</>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 4 23 10 17 10"/>
                                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                                    </svg>
                                    Regenerate
                                </>
                            )}
                        </button>
                        <button className="cf-ghost-btn cf-ghost-btn--sm" onClick={() => navigate("/review")}>← Back</button>
                    </div>
                </div>
                {regenError && <div className="cf-regen-error">{regenError}</div>}
            </div>

            <div className="cf-cards-body">
                {recipeList.map((recipe, i) => {
                    const matched = matchToInventory(recipe.ingredients || [], inventory).length;
                    const total   = recipe.ingredients?.length || 0;
                    return (
                        <div key={i} className="cf-card" onClick={() => handleSelectRecipe(i)}>
                            <div className="cf-card-num">{String(i + 1).padStart(2, "0")}</div>
                            <div className="cf-card-content">
                                <h2 className="cf-card-title">{recipe.title}</h2>
                                <p className="cf-card-desc">{recipe.description}</p>
                                <div className="cf-card-meta">
                                    {recipe.prep_time && <span>PREP {recipe.prep_time.toUpperCase()}</span>}
                                    {recipe.cook_time && <span>COOK {recipe.cook_time.toUpperCase()}</span>}
                                    {recipe.servings && <span>{recipe.servings} SERVINGS</span>}
                                    {matched > 0 && (
                                        <span className="cf-card-meta-pantry">
                                            ✓ {matched}/{total} in pantry
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="cf-card-arrow">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                                </svg>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
