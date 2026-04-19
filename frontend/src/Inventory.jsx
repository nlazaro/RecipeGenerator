import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Sidebar from "./Sidebar";
import "./Inventory.css";

const CATEGORIES = ["Proteins", "Vegetables", "Fruits", "Grains", "Dairy", "Spices", "Condiments", "Other"];
const CATEGORY_COLORS = {
    Proteins:    "#006947",
    Vegetables:  "#16a34a",
    Fruits:      "#f59e0b",
    Grains:      "#d97706",
    Dairy:       "#3b82f6",
    Spices:      "#8b5cf6",
    Condiments:  "#ec4899",
    Other:       "#9ca3af",
};

function categoryColor(cat) {
    return CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;
}

function deriveCategory(item) {
    return item.category || (item.detail?.includes("•") ? item.detail.split("•")[0].trim() : null) || "Other";
}

function GaugeMini({ pct }) {
    const r = 40, circ = 2 * Math.PI * r;
    return (
        <svg viewBox="0 0 100 100" className="inv-gauge-svg">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#e8f5ee" strokeWidth="10" />
            <circle cx="50" cy="50" r={r} fill="none"
                stroke="url(#invGrad)" strokeWidth="10"
                strokeDasharray={`${Math.min(pct, 1) * circ} ${circ}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
            <defs>
                <linearGradient id="invGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#006947" />
                    <stop offset="100%" stopColor="#69f6b8" />
                </linearGradient>
            </defs>
            <text x="50" y="46" textAnchor="middle" className="inv-gauge-pct">{Math.round(pct * 100)}%</text>
            <text x="50" y="60" textAnchor="middle" className="inv-gauge-sub">stocked</text>
        </svg>
    );
}

export default function Inventory() {
    const navigate = useNavigate();

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [saving,  setSaving]      = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    const [search,    setSearch]    = useState("");
    const [catFilter, setCatFilter] = useState("All");

    const [editingIdx,  setEditingIdx]  = useState(null);
    const [editValues,  setEditValues]  = useState({});
    const [addingNew,   setAddingNew]   = useState(false);
    const [newItem,     setNewItem]     = useState({ item_name: "", category: "Other", count: "" });

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid) { navigate("/signin"); return; }
        getDoc(doc(db, "users", uid)).then((snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setInventory(data.inventory || []);
                setLastUpdated(data.inventoryUpdatedAt?.toDate?.() || null);
            }
            setLoading(false);
        });
    }, [navigate]);

    // ── Persist ───────────────────────────────────────────────────────────────
    const persist = useCallback(async (updated) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        setSaving(true);
        await setDoc(doc(db, "users", uid), {
            inventory: updated,
            inventoryUpdatedAt: new Date(),
        }, { merge: true });
        setLastUpdated(new Date());
        setSaving(false);
    }, []);

    // ── Edit ──────────────────────────────────────────────────────────────────
    const startEdit = (idx) => {
        const item = inventory[idx];
        setEditingIdx(idx);
        setEditValues({
            item_name: item.item_name || "",
            category:  deriveCategory(item),
            count:     item.count ?? "",
        });
    };

    const cancelEdit = () => { setEditingIdx(null); setEditValues({}); };

    const confirmEdit = async () => {
        const updated = inventory.map((item, i) =>
            i === editingIdx
                ? { item_name: editValues.item_name.trim(), category: editValues.category, count: editValues.count || undefined, detail: item.detail }
                : item
        );
        setInventory(updated);
        setEditingIdx(null);
        await persist(updated);
    };

    // ── Delete ─────────────────────────────────────────────────────────────────
    const deleteItem = async (idx) => {
        const updated = inventory.filter((_, i) => i !== idx);
        setInventory(updated);
        if (editingIdx === idx) setEditingIdx(null);
        await persist(updated);
    };

    // ── Add new ───────────────────────────────────────────────────────────────
    const confirmAdd = async () => {
        if (!newItem.item_name.trim()) return;
        const updated = [...inventory, {
            item_name: newItem.item_name.trim(),
            category:  newItem.category,
            count:     newItem.count ? Number(newItem.count) : undefined,
        }];
        setInventory(updated);
        setAddingNew(false);
        setNewItem({ item_name: "", category: "Other", count: "" });
        await persist(updated);
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const categorised = inventory.map((item) => ({ ...item, _cat: deriveCategory(item) }));

    const allCats = ["All", ...CATEGORIES.filter((c) =>
        categorised.some((item) => item._cat === c)
    )];

    const filtered = categorised.filter((item) => {
        const matchSearch = item.item_name?.toLowerCase().includes(search.toLowerCase());
        const matchCat    = catFilter === "All" || item._cat === catFilter;
        return matchSearch && matchCat;
    });

    const catBreakdown = CATEGORIES
        .map((c) => ({ name: c, count: categorised.filter((i) => i._cat === c).length }))
        .filter((c) => c.count > 0);

    const gaugePct = Math.min(inventory.length / 20, 1);

    const updatedStr = lastUpdated
        ? lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Never";

    if (loading) {
        return (
            <div className="inv-loading">
                <div className="inv-spinner" />
                <p>Loading your pantry...</p>
            </div>
        );
    }

    return (
        <div className="inv-root">
            <Sidebar />

            <div className="inv-page">
                {/* TOP BAR */}
                <header className="inv-topbar">
                    <div className="inv-topbar-left">
                        <h1 className="inv-topbar-title">Inventory</h1>
                        <span className="inv-topbar-meta">Last updated: {updatedStr}</span>
                        {saving && <span className="inv-saving">Saving…</span>}
                    </div>
                    <div className="inv-topbar-right">
                        <button className="inv-btn-secondary" onClick={() => navigate("/ingredients")}>
                            + Scan More
                        </button>
                        <button className="inv-btn-primary" onClick={() => navigate("/recipes")}>
                            Generate Recipes →
                        </button>
                    </div>
                </header>

                <div className="inv-body">
                    {/* MAIN */}
                    <main className="inv-main">
                        {/* STATS */}
                        <div className="inv-stats">
                            {[
                                { value: inventory.length,        label: "Total Items" },
                                { value: catBreakdown.length,     label: "Categories"  },
                                { value: inventory.filter(i => deriveCategory(i) === "Proteins").length, label: "Protein Sources" },
                                { value: inventory.filter(i => deriveCategory(i) === "Vegetables").length, label: "Vegetables" },
                            ].map((s) => (
                                <div key={s.label} className="inv-stat">
                                    <span className="inv-stat-value">{s.value}</span>
                                    <span className="inv-stat-label">{s.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* SEARCH + FILTER */}
                        <div className="inv-controls">
                            <div className="inv-search-wrap">
                                <svg className="inv-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <input
                                    className="inv-search"
                                    placeholder="Search ingredients…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {search && (
                                    <button className="inv-search-clear" onClick={() => setSearch("")}>✕</button>
                                )}
                            </div>
                            <div className="inv-cats">
                                {allCats.map((c) => (
                                    <button
                                        key={c}
                                        className={`inv-cat-chip${catFilter === c ? " inv-cat-chip--active" : ""}`}
                                        style={catFilter === c && c !== "All" ? { background: categoryColor(c), borderColor: categoryColor(c) } : {}}
                                        onClick={() => setCatFilter(c)}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="inv-card">
                            {inventory.length === 0 ? (
                                <div className="inv-empty">
                                    <p>Your pantry is empty.</p>
                                    <button className="inv-btn-primary" onClick={() => navigate("/ingredients")}>
                                        Add your first ingredients
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <table className="inv-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Item</th>
                                                <th>Category</th>
                                                <th>Qty</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((item, displayIdx) => {
                                                const realIdx = categorised.indexOf(item);
                                                const isEditing = editingIdx === realIdx;

                                                return (
                                                    <tr key={realIdx} className={isEditing ? "inv-row--editing" : ""}>
                                                        <td className="inv-td-num">{String(displayIdx + 1).padStart(2, "0")}</td>

                                                        {isEditing ? (
                                                            <>
                                                                <td>
                                                                    <input
                                                                        className="inv-inline-input"
                                                                        value={editValues.item_name}
                                                                        onChange={(e) => setEditValues(v => ({ ...v, item_name: e.target.value }))}
                                                                        onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                                                                        autoFocus
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <select
                                                                        className="inv-inline-select"
                                                                        value={editValues.category}
                                                                        onChange={(e) => setEditValues(v => ({ ...v, category: e.target.value }))}
                                                                    >
                                                                        {CATEGORIES.map((c) => (
                                                                            <option key={c} value={c}>{c}</option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        className="inv-inline-input inv-inline-input--sm"
                                                                        type="number"
                                                                        min="0"
                                                                        placeholder="Qty"
                                                                        value={editValues.count}
                                                                        onChange={(e) => setEditValues(v => ({ ...v, count: e.target.value }))}
                                                                        onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                                                                    />
                                                                </td>
                                                                <td className="inv-td-actions">
                                                                    <button className="inv-action inv-action--save" onClick={confirmEdit}>✓</button>
                                                                    <button className="inv-action inv-action--cancel" onClick={cancelEdit}>✕</button>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="inv-td-name">{item.item_name}</td>
                                                                <td>
                                                                    <span
                                                                        className="inv-cat-badge"
                                                                        style={{ background: categoryColor(item._cat) + "20", color: categoryColor(item._cat) }}
                                                                    >
                                                                        {item._cat}
                                                                    </span>
                                                                </td>
                                                                <td className="inv-td-qty">
                                                                    {item.count ? `×${item.count}` : (item.detail || "—")}
                                                                </td>
                                                                <td className="inv-td-actions">
                                                                    <button className="inv-action inv-action--edit" onClick={() => startEdit(realIdx)}>
                                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button className="inv-action inv-action--delete" onClick={() => deleteItem(realIdx)}>
                                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                                            <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                                                                        </svg>
                                                                    </button>
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                );
                                            })}

                                            {/* ADD NEW ROW */}
                                            {addingNew && (
                                                <tr className="inv-row--editing inv-row--new">
                                                    <td className="inv-td-num">+</td>
                                                    <td>
                                                        <input
                                                            className="inv-inline-input"
                                                            placeholder="Item name"
                                                            value={newItem.item_name}
                                                            onChange={(e) => setNewItem(v => ({ ...v, item_name: e.target.value }))}
                                                            onKeyDown={(e) => e.key === "Enter" && confirmAdd()}
                                                            autoFocus
                                                        />
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="inv-inline-select"
                                                            value={newItem.category}
                                                            onChange={(e) => setNewItem(v => ({ ...v, category: e.target.value }))}
                                                        >
                                                            {CATEGORIES.map((c) => (
                                                                <option key={c} value={c}>{c}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="inv-inline-input inv-inline-input--sm"
                                                            type="number"
                                                            min="0"
                                                            placeholder="Qty"
                                                            value={newItem.count}
                                                            onChange={(e) => setNewItem(v => ({ ...v, count: e.target.value }))}
                                                            onKeyDown={(e) => e.key === "Enter" && confirmAdd()}
                                                        />
                                                    </td>
                                                    <td className="inv-td-actions">
                                                        <button className="inv-action inv-action--save" onClick={confirmAdd}>✓</button>
                                                        <button className="inv-action inv-action--cancel" onClick={() => setAddingNew(false)}>✕</button>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    {filtered.length === 0 && inventory.length > 0 && (
                                        <p className="inv-no-results">No items match your search.</p>
                                    )}
                                </>
                            )}

                            <div className="inv-table-footer">
                                <button className="inv-add-btn" onClick={() => { setAddingNew(true); setEditingIdx(null); }}>
                                    + Add Item
                                </button>
                                {inventory.length > 0 && (
                                    <span className="inv-count">{inventory.length} item{inventory.length !== 1 ? "s" : ""} in pantry</span>
                                )}
                            </div>
                        </div>
                    </main>

                    {/* RIGHT PANEL */}
                    <aside className="inv-right">
                        <div className="inv-panel">
                            <h3 className="inv-panel-heading">Pantry Health</h3>
                            <GaugeMini pct={gaugePct} />
                            <p className="inv-panel-sub">{inventory.length} of 20 recommended items</p>
                        </div>

                        {catBreakdown.length > 0 && (
                            <div className="inv-panel">
                                <h3 className="inv-panel-heading">By Category</h3>
                                <div className="inv-breakdown">
                                    {catBreakdown.map((c) => (
                                        <div key={c.name} className="inv-breakdown-row">
                                            <span className="inv-breakdown-dot" style={{ background: categoryColor(c.name) }} />
                                            <span className="inv-breakdown-name">{c.name}</span>
                                            <span className="inv-breakdown-count">{c.count}</span>
                                            <div className="inv-breakdown-track">
                                                <div
                                                    className="inv-breakdown-fill"
                                                    style={{ width: `${(c.count / inventory.length) * 100}%`, background: categoryColor(c.name) }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="inv-panel">
                            <h3 className="inv-panel-heading">Quick Actions</h3>
                            <div className="inv-quick-actions">
                                <button className="inv-qa-btn" onClick={() => navigate("/ingredients")}>
                                    📷  Scan Photo
                                </button>
                                <button className="inv-qa-btn" onClick={() => navigate("/ingredients")}>
                                    ✏️  Type Ingredients
                                </button>
                                <button className="inv-qa-btn inv-qa-btn--primary" onClick={() => navigate("/recipes")} disabled={inventory.length === 0}>
                                    ✨  Generate Recipes
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
