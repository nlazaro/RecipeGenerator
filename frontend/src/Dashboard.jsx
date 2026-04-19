import { useEffect, useState } from "react";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { doc, getDoc, collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { signOut } from "firebase/auth";
import Sidebar from "./Sidebar";

const CATEGORY_COLORS = ["#006947", "#69f6b8", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"];

function categorise(inventory) {
    const map = {};
    inventory.forEach((item) => {
        const key = item.category || "Other";
        map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, count], i) => ({
        name,
        count,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
}

function GaugeChart({ pct }) {
    const r = 54;
    const circ = 2 * Math.PI * r;
    const dash = Math.min(pct, 1) * circ;
    const label = pct >= 0.8 ? "Well Stocked" : pct >= 0.4 ? "Getting There" : "Needs Restocking";
    return (
        <svg viewBox="0 0 130 130" className="db-gauge-svg">
            <circle cx="65" cy="65" r={r} fill="none" stroke="#e8f5ee" strokeWidth="14" />
            <circle
                cx="65" cy="65" r={r} fill="none"
                stroke="url(#gaugeGrad)" strokeWidth="14"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                transform="rotate(-90 65 65)"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
            <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#006947" />
                    <stop offset="100%" stopColor="#69f6b8" />
                </linearGradient>
            </defs>
            <text x="65" y="60" textAnchor="middle" className="db-gauge-pct">
                {Math.round(pct * 100)}%
            </text>
            <text x="65" y="78" textAnchor="middle" className="db-gauge-label">
                {label}
            </text>
        </svg>
    );
}

const TILES = [
    { icon: "📷", title: "Scan Photo", desc: "Snap your fridge or pantry", color: "tile-green", route: "/ingredients" },
    { icon: "✏️", title: "Type Ingredients", desc: "Add items manually", color: "tile-teal", route: "/ingredients" },
    { icon: "✨", title: "Generate Recipes", desc: "Cook something new", color: "tile-amber", route: "/ingredients" },
    { icon: "📖", title: "Recipe History", desc: "Revisit past meals", color: "tile-purple", route: "/confirmation" },
];

export default function Dashboard() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [recentRecipes, setRecentRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid) { navigate("/signin"); return; }

        async function load() {
            try {
                const snap = await getDoc(doc(db, "users", uid));
                if (snap.exists()) {
                    const data = snap.data();
                    setProfile(data);
                    setInventory(data.inventory || []);
                }
                const rSnap = await getDocs(
                    query(collection(db, "users", uid, "recipes"), orderBy("createdAt", "desc"), limit(6))
                );
                setRecentRecipes(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [navigate]);

    const firstName = (profile?.name || profile?.displayName || auth.currentUser?.displayName || "Chef").split(" ")[0];
    const displayName = profile?.name || profile?.displayName || auth.currentUser?.displayName || "Chef";

    const inventoryUpdated = profile?.inventoryUpdatedAt?.toDate
        ? profile.inventoryUpdatedAt.toDate()
        : null;
    const daysSince = inventoryUpdated
        ? Math.floor((Date.now() - inventoryUpdated.getTime()) / 86400000)
        : null;

    const categories = categorise(inventory);
    const gaugePct = Math.min(inventory.length / 20, 1);

    const goals = [profile?.goals?.[0], profile?.dietary?.[0], profile?.allergies?.[0]].filter(Boolean);

    if (loading) {
        return (
            <div className="db-loading">
                <div className="db-spinner" />
                <p>Loading your kitchen...</p>
            </div>
        );
    }

    return (
        <div className="db-root">
            <Sidebar />

            <div className="db-page">
            {/* TOP BAR */}
            <header className="db-topbar">
                <div className="db-topbar-left">
                    <span className="db-topbar-title">Home</span>
                    {goals.map((g) => (
                        <span key={g} className="db-goal-chip">{g}</span>
                    ))}
                </div>
                <div className="db-topbar-right">
                    <span className="db-topbar-name">{displayName}</span>
                    <button className="db-signout" onClick={async () => { await signOut(auth); navigate("/signin"); }}>
                        Sign out
                    </button>
                </div>
            </header>

            <div className="db-body">

                {/* MAIN */}
                <main className="db-main">
                    {/* GREETING */}
                    <div className="db-greeting">
                        <h1>Hello, {firstName}!</h1>
                        <p>Here's your kitchen at a glance.</p>
                    </div>

                    {/* TILES */}
                    <div className="db-tiles">
                        {TILES.map((t) => (
                            <div key={t.title} className={`db-tile ${t.color}`} onClick={() => navigate(t.route)}>
                                <span className="db-tile-icon">{t.icon}</span>
                                <span className="db-tile-title">{t.title}</span>
                                <span className="db-tile-desc">{t.desc}</span>
                            </div>
                        ))}
                    </div>

                    {/* KPI ROW */}
                    <div className="db-kpi-row">
                        {[
                            { label: "Ingredients", value: inventory.length, note: daysSince !== null ? `Updated ${daysSince}d ago` : "No scans yet" },
                            { label: "Recipes Generated", value: recentRecipes.length, note: "All time" },
                            { label: "Avg Rating", value: "—", note: "Rate after cooking" },
                            { label: "Last Cooked", value: recentRecipes[0]?.createdAt?.toDate ? recentRecipes[0].createdAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—", note: "Most recent" },
                        ].map((k) => (
                            <div key={k.label} className="db-kpi">
                                <span className="db-kpi-value">{k.value}</span>
                                <span className="db-kpi-label">{k.label}</span>
                                <span className="db-kpi-note">{k.note}</span>
                            </div>
                        ))}
                    </div>

                    {/* INVENTORY TABLE */}
                    <div className="db-card">
                        <div className="db-card-header">
                            <h2 className="db-card-title">Inventory</h2>
                            <button className="db-chip" onClick={() => navigate("/ingredients")}>+ Update</button>
                        </div>
                        {inventory.length === 0 ? (
                            <div className="db-empty">
                                <p>No ingredients scanned yet.</p>
                                <button className="db-btn-primary" onClick={() => navigate("/ingredients")}>Add Ingredients</button>
                            </div>
                        ) : (
                            <table className="db-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Item</th>
                                        <th>Category</th>
                                        <th>Detail</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map((item, i) => (
                                        <tr key={i}>
                                            <td className="db-table-num">{String(i + 1).padStart(2, "0")}</td>
                                            <td className="db-table-name">{item.item_name}</td>
                                            <td><span className="db-table-cat">{item.category || "—"}</span></td>
                                            <td className="db-table-detail">{item.detail || item.count ? `Qty: ${item.count}` : "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* RECIPE HISTORY */}
                    {recentRecipes.length > 0 && (
                        <div className="db-card" style={{ marginTop: 20 }}>
                            <div className="db-card-header">
                                <h2 className="db-card-title">Recipe History</h2>
                            </div>
                            <table className="db-table">
                                <thead>
                                    <tr>
                                        <th>Recipe</th>
                                        <th>Ingredients Used</th>
                                        <th>Date</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentRecipes.map((entry) => {
                                        const title =
                                            entry.recipes?.name ||
                                            entry.recipes?.recipe_name ||
                                            entry.recipes?.title ||
                                            (Array.isArray(entry.recipes?.recipes) && entry.recipes.recipes[0]?.name) ||
                                            "Untitled Recipe";
                                        const date = entry.createdAt?.toDate
                                            ? entry.createdAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                            : "—";
                                        return (
                                            <tr key={entry.id} className="db-table-row-link" onClick={() => navigate("/confirmation", { state: { recipes: entry.recipes } })}>
                                                <td className="db-table-name">{title}</td>
                                                <td>{entry.inventoryUsed?.length || 0} items</td>
                                                <td>{date}</td>
                                                <td className="db-table-arrow">→</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>

                {/* RIGHT PANEL */}
                <aside className="db-right">
                    <div className="db-card">
                        <h3 className="db-right-heading">Kitchen Readiness</h3>
                        <GaugeChart pct={gaugePct} />
                        <p className="db-gauge-sub">{inventory.length} of 20 suggested ingredients</p>
                    </div>

                    {categories.length > 0 && (
                        <div className="db-card" style={{ marginTop: 20 }}>
                            <h3 className="db-right-heading">By Category</h3>
                            <div className="db-cat-list">
                                {categories.map((c) => (
                                    <div key={c.name} className="db-cat-row">
                                        <span className="db-cat-dot" style={{ background: c.color }} />
                                        <span className="db-cat-name">{c.name}</span>
                                        <span className="db-cat-count">{c.count}</span>
                                        <div className="db-cat-bar-track">
                                            <div
                                                className="db-cat-bar-fill"
                                                style={{ width: `${(c.count / inventory.length) * 100}%`, background: c.color }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
            </div>
        </div>
    );
}
