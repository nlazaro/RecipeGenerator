import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Analytics = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

const Pantry = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v4H3z" /><path d="M3 7v14h18V7" /><line x1="12" y1="7" x2="12" y2="21" />
    </svg>
);

const Chef = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
    </svg>
);

const Gear = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const NAV_ITEMS = [
    { label: "Analytics", route: "/dashboard", Icon: Analytics },
    { label: "Inventory",  route: "/inventory", Icon: Pantry   },
    { label: "Recipes",    route: "/recipes",   Icon: Chef     },
];

const BOTTOM_ITEMS = [
    { label: "Settings",   route: "/profile",   Icon: Gear     },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const isActive = (route) =>
        route === "/dashboard" ? pathname === route : pathname.startsWith(route);

    return (
        <aside className="sb-root">
            <div className="sb-logo" onClick={() => navigate("/dashboard")}>
                <span className="sb-logo-mark">✦</span>
                <span className="sb-logo-text">RecipeGen</span>
            </div>

            <nav className="sb-nav">
                {NAV_ITEMS.map(({ label, route, Icon }) => (
                    <button
                        key={route}
                        className={`sb-item${isActive(route) ? " sb-item--active" : ""}`}
                        onClick={() => navigate(route)}
                        title={label}
                    >
                        {isActive(route) && <span className="sb-pip" />}
                        <span className="sb-icon"><Icon /></span>
                        <span className="sb-label">{label}</span>
                    </button>
                ))}
            </nav>

            <div className="sb-bottom">
                {BOTTOM_ITEMS.map(({ label, route, Icon }) => (
                    <button
                        key={route}
                        className={`sb-item${isActive(route) ? " sb-item--active" : ""}`}
                        onClick={() => navigate(route)}
                        title={label}
                    >
                        <span className="sb-icon"><Icon /></span>
                        <span className="sb-label">{label}</span>
                    </button>
                ))}
            </div>
        </aside>
    );
}
