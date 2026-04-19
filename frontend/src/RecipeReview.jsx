import React, { useRef, useState, useEffect } from "react";
import "./RecipeReview.css";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { collection, getDocs, query, orderBy, doc, setDoc } from "firebase/firestore";
import AppNav from "./AppNav";

const RECIPE_URL = "http://localhost:8000/generate-recipes";

const VALID_CATS = ["Proteins", "Vegetables", "Fruits", "Grains", "Dairy", "Spices", "Condiments", "Other"];

function toInventoryItem(item) {
    const cat = VALID_CATS.includes(item.category) ? item.category : "Other";
    const count = item.count != null && item.count !== "" ? Number(item.count) : undefined;
    return { item_name: item.name, category: cat, count, detail: item.detail };
}

const CameraIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
    </svg>
);

const TypeIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/>
        <line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
    </svg>
);

const UploadIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
);

const EditIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const TrashIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6"/><path d="M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
);

const ArrowIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
);

export default function RecipeReview() {
    const navigate    = useNavigate();
    const fileInputRef = useRef(null);

    const [displayName,    setDisplayName]    = useState("");
    const [ingredients,    setIngredients]    = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [loading,        setLoading]        = useState(false);
    const [error,          setError]          = useState("");
    const [mode,           setMode]           = useState("image");
    const [textInput,      setTextInput]      = useState("");
    const [inventorySaved, setInventorySaved] = useState(false);
    const [editingId,      setEditingId]      = useState(null);
    const [editDraft,      setEditDraft]      = useState({ name: "", detail: "" });
    const [dragOver,       setDragOver]       = useState(false);

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(u => setDisplayName(u?.displayName || ""));
        return unsub;
    }, []);

    useEffect(() => {
        if (mode !== "image") return;
        setIngredients(selectedImages.flatMap(img => img.ingredients || []));
    }, [selectedImages]);

    const maxReached = selectedImages.length >= 9;

    /* ── INGREDIENT CRUD ── */
    const removeIngredient = (id) =>
        setIngredients(prev => prev.filter(item => item.id !== id));

    const addIngredient = () => {
        const newId = Date.now().toString();
        setIngredients(prev => [...prev, { id: newId, name: "New Ingredient", detail: "Edit quantity", category: "Other" }]);
        setEditingId(newId);
        setEditDraft({ name: "New Ingredient", detail: "Edit quantity" });
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditDraft({ name: item.name, detail: item.detail });
    };

    const commitEdit = () => {
        if (!editDraft.name.trim()) return;
        setIngredients(prev =>
            prev.map(item => item.id === editingId ? { ...item, ...editDraft } : item)
        );
        setEditingId(null);
    };

    const cancelEdit = () => setEditingId(null);

    /* ── IMAGE UPLOAD ── */
    const handleUploadClick = () => fileInputRef.current?.click();

    const removeImage = (idx) =>
        setSelectedImages(prev => prev.filter((_, i) => i !== idx));

    const processFiles = async (files) => {
        if (!files.length) return;
        setError("");
        setLoading(true);

        const newPreviews = Array.from(files).map(file => ({
            file,
            url: URL.createObjectURL(file),
            ingredients: [],
        }));

        setSelectedImages(prev => [...prev, ...newPreviews].slice(0, 9));

        const formData = new FormData();
        formData.append("image", files[0]);

        try {
            const res  = await fetch("http://localhost:8000/analyze-image", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to analyze image.");

            const mapped = (data.inventory || []).map((item, i) => ({
                id:       Date.now().toString() + i,
                name:     item.item_name,
                detail:   `${item.category} · Qty: ${item.count}`,
                category: item.category || "Other",
                count:    item.count,
            }));

            setSelectedImages(prev => {
                const updated = [...prev];
                updated[updated.length - newPreviews.length].ingredients = mapped;
                return updated;
            });
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => processFiles(Array.from(e.target.files));

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
        if (files.length) processFiles(files);
    };

    /* ── TEXT ANALYSIS ── */
    const handleTextSubmit = async () => {
        if (!textInput.trim()) return;
        setError("");
        setLoading(true);
        try {
            const res  = await fetch("http://localhost:8000/analyze-text", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ text: textInput }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to analyze text.");

            const mapped = (data.inventory || []).map((item, i) => ({
                id:       Date.now().toString() + i,
                name:     item.item_name,
                detail:   `${item.category} · Qty: ${item.count}`,
                category: item.category || "Other",
                count:    item.count,
            }));
            setIngredients(prev => [...prev, ...mapped]);
            setTextInput("");
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    /* ── RECIPE GENERATION ── */
    const handleConfirm = async () => {
        if (ingredients.length === 0) return;
        setError("");
        setLoading(true);

        const newItems = ingredients.map(toInventoryItem);
        const uid      = auth.currentUser?.uid;
        let liked_recipes = [], disliked_recipes = [], inventory = newItems;

        try {
            if (uid) {
                const snap    = await getDocs(query(collection(db, "users", uid, "recipes"), orderBy("savedAt", "desc")));
                const history = snap.docs.map(d => d.data()).filter(r => r.rating);
                liked_recipes    = history.filter(r => r.rating >= 4).slice(0, 3).map(r => r.title);
                disliked_recipes = history.filter(r => r.rating <= 2).slice(0, 3).map(r => r.title);

                const { getDoc } = await import("firebase/firestore");
                const userDoc    = await getDoc(doc(db, "users", uid));
                const saved      = userDoc.data()?.inventory || [];
                const newNames   = new Set(newItems.map(i => i.item_name.toLowerCase()));
                inventory = [...newItems, ...saved.filter(i => !newNames.has(i.item_name.toLowerCase()))];

                await setDoc(doc(db, "users", uid), { inventory, inventoryUpdatedAt: new Date() }, { merge: true });
            }

            const res  = await fetch(RECIPE_URL, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ inventory, liked_recipes, disliked_recipes }),
            });
            if (!res.ok) throw new Error(`Recipe API error: ${res.status}`);
            const data = await res.json();
            navigate("/confirmation", { state: { recipes: data, inventory } });
        } catch (err) {
            setError("Recipe generation failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    /* ── SAVE TO PANTRY ── */
    const handleUpdateInventory = async () => {
        if (ingredients.length === 0) return;
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const inventory = ingredients.map(toInventoryItem);
        try {
            await setDoc(doc(db, "users", uid), { inventory, inventoryUpdatedAt: new Date() }, { merge: true });
            setInventorySaved(true);
            setTimeout(() => setInventorySaved(false), 2500);
        } catch (err) {
            setError("Failed to save: " + err.message);
        }
    };

    /* ── RENDER ── */
    return (
        <div className="rr-page">
            <AppNav displayName={displayName} />

            {/* Header */}
            <div className="rr-header-band">
                <div className="rr-header-inner">
                    <span className="rr-eyebrow">INGREDIENT SCAN</span>
                    <h1 className="rr-title">What&rsquo;s in<br />your kitchen?</h1>
                    <p className="rr-subtitle">
                        Upload a photo or type your ingredients &mdash; we&rsquo;ll identify everything and generate personalised recipes.
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className="rr-body">

                {/* ── LEFT: INPUT ── */}
                <div className="rr-input-col">

                    {/* Mode toggle */}
                    <div className="rr-mode-toggle">
                        <button
                            className={`rr-mode-btn${mode === "image" ? " rr-mode-btn--on" : ""}`}
                            onClick={() => { setMode("image"); setTextInput(""); }}
                        >
                            <CameraIcon /> Photo Scan
                        </button>
                        <button
                            className={`rr-mode-btn${mode === "text" ? " rr-mode-btn--on" : ""}`}
                            onClick={() => { setMode("text"); setSelectedImages([]); setIngredients([]); }}
                        >
                            <TypeIcon /> Type Items
                        </button>
                    </div>

                    {/* Image zone */}
                    {mode === "image" && (
                        <div className="rr-image-zone">
                            {selectedImages.length === 0 ? (
                                <div
                                    className={`rr-dropzone${dragOver ? " rr-dropzone--drag" : ""}`}
                                    onClick={handleUploadClick}
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                >
                                    <div className="rr-dropzone-icon"><UploadIcon /></div>
                                    <p className="rr-dropzone-title">Drop a photo here or click to browse</p>
                                    <p className="rr-dropzone-sub">JPG, PNG, WEBP &middot; up to 9 images</p>
                                </div>
                            ) : (
                                <div className="rr-image-grid">
                                    {selectedImages.map((img, i) => (
                                        <div className="rr-img-thumb" key={i}>
                                            <img src={img.url} alt="Uploaded ingredient scan" />
                                            <button className="rr-img-remove" onClick={() => removeImage(i)}>✕</button>
                                        </div>
                                    ))}
                                    {!maxReached && (
                                        <button className="rr-img-add" onClick={handleUploadClick}>
                                            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
                                            <span>Add</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {loading && mode === "image" && (
                                <div className="rr-analyzing">
                                    <div className="rr-pulse" />
                                    Analyzing image&hellip;
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                            />
                        </div>
                    )}

                    {/* Text zone */}
                    {mode === "text" && (
                        <div className="rr-text-zone">
                            <label className="rr-label" htmlFor="rr-text-input">
                                List your ingredients
                            </label>
                            <textarea
                                id="rr-text-input"
                                className="rr-textarea"
                                placeholder="e.g. 2 chicken breasts, 1 cup rice, 3 garlic cloves, olive oil&#10;&#10;Just write naturally — we'll sort it out."
                                value={textInput}
                                onChange={e => setTextInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleTextSubmit(); }}
                            />
                            <div className="rr-textarea-hint">
                                {textInput.length > 0 ? `${textInput.length} chars · Cmd+Enter to analyze` : ""}
                            </div>
                            <button
                                className="rr-analyze-btn"
                                onClick={handleTextSubmit}
                                disabled={loading || !textInput.trim()}
                            >
                                {loading ? "Analyzing\u2026" : "Analyze \u2192"}
                            </button>
                        </div>
                    )}

                    {error && <div className="rr-error">{error}</div>}
                </div>

                {/* ── RIGHT: PANEL ── */}
                <div className="rr-panel">
                    <div className="rr-panel-hd">
                        <div>
                            <div className="rr-panel-title">IDENTIFIED INGREDIENTS</div>
                            <div className="rr-panel-count">
                                {ingredients.length === 0
                                    ? "Nothing found yet"
                                    : `${ingredients.length} item${ingredients.length === 1 ? "" : "s"} ready`}
                            </div>
                        </div>
                        <button className="rr-add-btn" onClick={addIngredient}>
                            + Add item
                        </button>
                    </div>

                    <div className="rr-list">
                        {ingredients.length === 0 ? (
                            <div className="rr-list-empty">
                                <div className="rr-list-empty-icon">🥬</div>
                                <p>No ingredients yet</p>
                                <p>Upload a photo or type your items to get started</p>
                            </div>
                        ) : (
                            ingredients.map((item, i) => (
                                editingId === item.id ? (
                                    <div key={item.id} className="rr-item rr-item--editing">
                                        <span className="rr-item-num">{String(i + 1).padStart(2, "0")}</span>
                                        <div className="rr-item-edit">
                                            <input
                                                className="rr-edit-name"
                                                value={editDraft.name}
                                                onChange={e => setEditDraft(d => ({ ...d, name: e.target.value }))}
                                                onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                                                autoFocus
                                            />
                                            <input
                                                className="rr-edit-detail"
                                                value={editDraft.detail}
                                                onChange={e => setEditDraft(d => ({ ...d, detail: e.target.value }))}
                                                onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                                                placeholder="Category · Quantity"
                                            />
                                            <div className="rr-edit-actions">
                                                <button className="rr-edit-save" onClick={commitEdit}>Save</button>
                                                <button className="rr-edit-cancel" onClick={cancelEdit}>Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={item.id} className="rr-item">
                                        <span className="rr-item-num">{String(i + 1).padStart(2, "0")}</span>
                                        <div className="rr-item-body">
                                            <div className="rr-item-name">{item.name}</div>
                                            <div className="rr-item-detail">{item.detail}</div>
                                        </div>
                                        <div className="rr-item-actions">
                                            <button className="rr-icon-btn rr-icon-btn--edit" onClick={() => startEdit(item)} title="Edit">
                                                <EditIcon />
                                            </button>
                                            <button className="rr-icon-btn rr-icon-btn--del" onClick={() => removeIngredient(item.id)} title="Remove">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>
                                )
                            ))
                        )}
                    </div>

                    <div className="rr-panel-foot">
                        <button
                            className="rr-cta-btn"
                            onClick={handleConfirm}
                            disabled={loading || ingredients.length === 0}
                        >
                            {loading ? (
                                <><div className="rr-btn-spinner" /> Generating&hellip;</>
                            ) : (
                                <>Generate Recipes <ArrowIcon /></>
                            )}
                        </button>
                        <button
                            className="rr-save-btn"
                            onClick={handleUpdateInventory}
                            disabled={ingredients.length === 0}
                        >
                            {inventorySaved ? "✓ Saved to Pantry" : "Save to Pantry"}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
