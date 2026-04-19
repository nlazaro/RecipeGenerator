import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import AppNav from "./AppNav";
import "./Inventory.css";

const CATEGORIES = ["Proteins", "Vegetables", "Fruits", "Grains", "Dairy", "Spices", "Condiments", "Other"];

const CAT_META = {
    Proteins:    { color: "#ef4444", emoji: "🥩" },
    Vegetables:  { color: "#22c55e", emoji: "🥦" },
    Fruits:      { color: "#f97316", emoji: "🍎" },
    Grains:      { color: "#eab308", emoji: "🌾" },
    Dairy:       { color: "#3b82f6", emoji: "🥛" },
    Spices:      { color: "#a855f7", emoji: "🌶️" },
    Condiments:  { color: "#ec4899", emoji: "🍯" },
    Other:       { color: "#9ca3af", emoji: "🥡" },
};

const SORT_OPTIONS = [
    { value: "name-az",   label: "Name A→Z" },
    { value: "name-za",   label: "Name Z→A" },
    { value: "qty-low",   label: "Qty: Low first" },
    { value: "qty-high",  label: "Qty: High first" },
    { value: "cat-az",    label: "Category A→Z" },
];

const LOW_THRESHOLD = 2;

function deriveCategory(item) {
    if (item.category && CATEGORIES.includes(item.category)) return item.category;
    const d = (item.detail || "").toLowerCase();
    if (d.includes("protein") || d.includes("meat") || d.includes("chicken") || d.includes("beef") || d.includes("fish") || d.includes("egg")) return "Proteins";
    if (d.includes("vegetable") || d.includes("veggie")) return "Vegetables";
    if (d.includes("fruit")) return "Fruits";
    if (d.includes("grain") || d.includes("rice") || d.includes("pasta") || d.includes("bread")) return "Grains";
    if (d.includes("dairy") || d.includes("milk") || d.includes("cheese") || d.includes("yogurt")) return "Dairy";
    if (d.includes("spice") || d.includes("herb")) return "Spices";
    if (d.includes("condiment") || d.includes("sauce") || d.includes("oil")) return "Condiments";
    return "Other";
}

const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);

const EditIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const TrashIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
);

const BLANK_ITEM = { item_name: "", category: "Other", count: 1, detail: "" };

export default function Inventory() {
    const navigate = useNavigate();
    const [uid, setUid] = useState(null);
    const [displayName, setDisplayName] = useState("");
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState("All");
    const [stockFilter, setStockFilter] = useState("all");
    const [sortBy, setSortBy] = useState("name-az");

    const [editingIdx, setEditingIdx] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [addingNew, setAddingNew] = useState(false);
    const [newItem, setNewItem] = useState({ ...BLANK_ITEM });

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async user => {
            if (!user) { navigate("/signin"); return; }
            setUid(user.uid);
            setDisplayName(user.displayName || user.email || "");
            const snap = await getDoc(doc(db, "users", user.uid));
            setInventory(snap.data()?.inventory || []);
            setLoading(false);
        });
        return unsub;
    }, [navigate]);

    async function persist(updated) {
        setSaving(true);
        try {
            await updateDoc(doc(db, "users", uid), { inventory: updated });
            setInventory(updated);
        } catch (e) {
            console.error("Save failed", e);
        } finally {
            setSaving(false);
        }
    }

    function startEdit(realIdx) {
        const item = inventory[realIdx];
        setEditingIdx(realIdx);
        setEditValues({
            item_name: item.item_name || "",
            category:  deriveCategory(item),
            count:     item.count ?? item.quantity ?? 1,
            detail:    item.detail || "",
        });
    }

    async function saveEdit(realIdx) {
        const updated = inventory.map((item, i) => i === realIdx
            ? { ...item, item_name: editValues.item_name, category: editValues.category, count: Number(editValues.count), detail: editValues.detail }
            : item
        );
        await persist(updated);
        setEditingIdx(null);
    }

    async function deleteItem(realIdx) {
        const updated = inventory.filter((_, i) => i !== realIdx);
        await persist(updated);
        if (editingIdx === realIdx) setEditingIdx(null);
    }

    async function saveNew() {
        if (!newItem.item_name.trim()) return;
        const updated = [...inventory, { ...newItem, count: Number(newItem.count) }];
        await persist(updated);
        setAddingNew(false);
        setNewItem({ ...BLANK_ITEM });
    }

    const enriched = useMemo(() => inventory.map((item, i) => ({
        ...item,
        _idx: i,
        _cat: deriveCategory(item),
        _qty: parseFloat(item.count ?? item.quantity ?? 0),
    })), [inventory]);

    const activeCats = useMemo(() => {
        const seen = new Set(enriched.map(i => i._cat));
        return CATEGORIES.filter(c => seen.has(c));
    }, [enriched]);

    const filtered = useMemo(() => {
        let items = [...enriched];
        if (catFilter !== "All") items = items.filter(i => i._cat === catFilter);
        if (stockFilter === "low") items = items.filter(i => i._qty <= LOW_THRESHOLD);
        if (search.trim()) {
            const q = search.toLowerCase();
            items = items.filter(i => i.item_name?.toLowerCase().includes(q) || i._cat.toLowerCase().includes(q));
        }
        items.sort((a, b) => {
            if (sortBy === "name-az")   return (a.item_name || "").localeCompare(b.item_name || "");
            if (sortBy === "name-za")   return (b.item_name || "").localeCompare(a.item_name || "");
            if (sortBy === "qty-low")   return a._qty - b._qty;
            if (sortBy === "qty-high")  return b._qty - a._qty;
            if (sortBy === "cat-az")    return a._cat.localeCompare(b._cat);
            return 0;
        });
        return items;
    }, [enriched, catFilter, stockFilter, search, sortBy]);

    const totalItems  = inventory.length;
    const lowCount    = enriched.filter(i => i._qty <= LOW_THRESHOLD && i._qty >= 0).length;
    const catCounts   = useMemo(() => {
        const m = {};
        enriched.forEach(i => { m[i._cat] = (m[i._cat] || 0) + 1; });
        return m;
    }, [enriched]);

    if (loading) {
        return (
            <div className="inv-loading">
                <div className="inv-spinner" />
                <span>Loading your pantry…</span>
            </div>
        );
    }

    return (
        <div className="inv-page">
            <AppNav displayName={displayName} />

            {/* HEADER */}
            <div className="inv-header">
                <div className="inv-header-inner">
                    <div>
                        <p className="inv-eyebrow">Pantry</p>
                        <h1 className="inv-title">Inventory{saving && <span className="inv-saving">saving…</span>}</h1>
                    </div>
                    <div className="inv-kpis">
                        <div className="inv-kpi">
                            <span className="inv-kpi-v">{totalItems}</span>
                            <span className="inv-kpi-l">Total Items</span>
                        </div>
                        <div className="inv-kpi">
                            <span className="inv-kpi-v inv-kpi-v--warn">{lowCount}</span>
                            <span className="inv-kpi-l">Low Stock</span>
                        </div>
                        <div className="inv-kpi">
                            <span className="inv-kpi-v">{activeCats.length}</span>
                            <span className="inv-kpi-l">Categories</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CATEGORY TABS */}
            <div className="inv-tabs-bar">
                <div className="inv-tabs">
                    <button
                        className={`inv-tab${catFilter === "All" ? " inv-tab--active" : ""}`}
                        onClick={() => setCatFilter("All")}
                    >
                        All <span className="inv-tab-badge">{inventory.length}</span>
                    </button>
                    {activeCats.map(c => (
                        <button
                            key={c}
                            className={`inv-tab${catFilter === c ? " inv-tab--active" : ""}`}
                            style={catFilter === c ? { borderBottomColor: CAT_META[c]?.color } : {}}
                            onClick={() => setCatFilter(c)}
                        >
                            {CAT_META[c]?.emoji} {c}
                            <span className="inv-tab-badge">{catCounts[c] || 0}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="inv-toolbar">
                <div className="inv-toolbar-inner">
                    <div className="inv-search-wrap">
                        <svg className="inv-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            className="inv-search"
                            type="text"
                            placeholder="Search items…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="inv-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button
                        className={`inv-low-btn${stockFilter === "low" ? " inv-low-btn--on" : ""}`}
                        onClick={() => setStockFilter(s => s === "low" ? "all" : "low")}
                    >
                        ⚠ Low Stock
                    </button>
                    <button className="inv-add-btn" onClick={() => { setAddingNew(true); setEditingIdx(null); }}>
                        <PlusIcon /> Add Item
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="inv-content">
                <div className="inv-table-card">
                    {filtered.length === 0 && !addingNew ? (
                        <div className="inv-empty">
                            {inventory.length === 0
                                ? <>
                                    <span style={{ fontSize: 40 }}>🥗</span>
                                    <p>Your pantry is empty. Add ingredients to get started.</p>
                                    <button className="inv-add-btn" onClick={() => navigate("/review")}>
                                        <PlusIcon /> Scan or type ingredients
                                    </button>
                                  </>
                                : <>
                                    <span style={{ fontSize: 32 }}>🔍</span>
                                    <p>No items match your filters.</p>
                                    <button className="inv-clear-link" onClick={() => { setSearch(""); setCatFilter("All"); setStockFilter("all"); }}>
                                        Clear filters
                                    </button>
                                  </>
                            }
                        </div>
                    ) : (
                        <table className="inv-table">
                            <thead>
                                <tr>
                                    <th className="inv-th inv-th--n">#</th>
                                    <th className="inv-th">Item</th>
                                    <th className="inv-th">Category</th>
                                    <th className="inv-th">Quantity</th>
                                    <th className="inv-th">Status</th>
                                    <th className="inv-th inv-th--act" />
                                </tr>
                            </thead>
                            <tbody>
                                {/* New item row */}
                                {addingNew && (
                                    <tr className="inv-tr inv-tr--editing">
                                        <td className="inv-td inv-td--n">—</td>
                                        <td className="inv-td">
                                            <input
                                                className="inv-row-input"
                                                placeholder="Item name"
                                                value={newItem.item_name}
                                                onChange={e => setNewItem(v => ({ ...v, item_name: e.target.value }))}
                                                autoFocus
                                            />
                                        </td>
                                        <td className="inv-td">
                                            <select
                                                className="inv-row-select"
                                                value={newItem.category}
                                                onChange={e => setNewItem(v => ({ ...v, category: e.target.value }))}
                                            >
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </td>
                                        <td className="inv-td">
                                            <div className="inv-qty-group">
                                                <input
                                                    className="inv-row-input inv-row-input--sm"
                                                    type="number"
                                                    min="0"
                                                    value={newItem.count}
                                                    onChange={e => setNewItem(v => ({ ...v, count: e.target.value }))}
                                                />
                                            </div>
                                        </td>
                                        <td className="inv-td" />
                                        <td className="inv-td inv-td--act">
                                            <button className="inv-row-save" onClick={saveNew}>Save</button>
                                            <button className="inv-row-cancel" onClick={() => { setAddingNew(false); setNewItem({ ...BLANK_ITEM }); }}>✕</button>
                                        </td>
                                    </tr>
                                )}

                                {filtered.map((item, visIdx) => {
                                    const realIdx = item._idx;
                                    const isEditing = editingIdx === realIdx;
                                    const isLow = item._qty <= LOW_THRESHOLD;
                                    const meta = CAT_META[item._cat] || CAT_META.Other;

                                    if (isEditing) {
                                        return (
                                            <tr key={realIdx} className="inv-tr inv-tr--editing">
                                                <td className="inv-td inv-td--n">{visIdx + 1}</td>
                                                <td className="inv-td">
                                                    <input
                                                        className="inv-row-input"
                                                        value={editValues.item_name}
                                                        onChange={e => setEditValues(v => ({ ...v, item_name: e.target.value }))}
                                                        autoFocus
                                                    />
                                                </td>
                                                <td className="inv-td">
                                                    <select
                                                        className="inv-row-select"
                                                        value={editValues.category}
                                                        onChange={e => setEditValues(v => ({ ...v, category: e.target.value }))}
                                                    >
                                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </td>
                                                <td className="inv-td">
                                                    <input
                                                        className="inv-row-input inv-row-input--sm"
                                                        type="number"
                                                        min="0"
                                                        value={editValues.count}
                                                        onChange={e => setEditValues(v => ({ ...v, count: e.target.value }))}
                                                    />
                                                </td>
                                                <td className="inv-td" />
                                                <td className="inv-td inv-td--act">
                                                    <button className="inv-row-save" onClick={() => saveEdit(realIdx)}>Save</button>
                                                    <button className="inv-row-cancel" onClick={() => setEditingIdx(null)}>✕</button>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={realIdx} className={`inv-tr${isLow ? " inv-tr--low" : ""}`}>
                                            <td className="inv-td inv-td--n">{visIdx + 1}</td>
                                            <td className="inv-td inv-td--name">
                                                <span className="inv-item-emoji">{meta.emoji}</span>
                                                <span className="inv-item-name">{item.item_name}</span>
                                            </td>
                                            <td className="inv-td">
                                                <span
                                                    className="inv-cat-tag"
                                                    style={{ background: meta.color + "18", color: meta.color }}
                                                >
                                                    {item._cat}
                                                </span>
                                            </td>
                                            <td className="inv-td inv-td--qty">{item._qty}</td>
                                            <td className="inv-td">
                                                <span className={`inv-status${isLow ? " inv-status--low" : " inv-status--ok"}`}>
                                                    {isLow ? "Low" : "OK"}
                                                </span>
                                            </td>
                                            <td className="inv-td inv-td--act">
                                                <div className="inv-row-act-group">
                                                    <button className="inv-row-act inv-row-act--edit" title="Edit" onClick={() => startEdit(realIdx)}>
                                                        <EditIcon />
                                                    </button>
                                                    <button className="inv-row-act inv-row-act--del" title="Delete" onClick={() => deleteItem(realIdx)}>
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Ghost add row */}
                                {!addingNew && inventory.length > 0 && (
                                    <tr className="inv-tr inv-tr--ghost" onClick={() => { setAddingNew(true); setEditingIdx(null); }}>
                                        <td className="inv-td inv-td--ghost" colSpan={6}>
                                            <PlusIcon /> Add item
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
