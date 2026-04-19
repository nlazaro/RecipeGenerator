import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import "./AppNav.css";

const PRIMARY_LINKS = [
    { label: "Recipe Input", route: "/review"     },
    { label: "Recipes",      route: "/recipes"    },
    { label: "Inventory",    route: "/inventory"  },
    { label: "Analytics",    route: "/dashboard"  },
];

const SettingsIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
);

const LogOutIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);

function activeSection(pathname) {
    if (pathname.startsWith("/inventory")) return "/inventory";
    if (pathname.startsWith("/recipes") || pathname.startsWith("/confirmation")) return "/recipes";
    if (pathname.startsWith("/review")) return "/review";
    if (pathname.startsWith("/dashboard")) return "/dashboard";
    return "/dashboard";
}

export default function AppNav({ displayName }) {
    const navigate     = useNavigate();
    const { pathname } = useLocation();

    const handleSignOut = async () => {
        await signOut(auth);
        navigate("/signin");
    };

    const firstName = displayName?.split(" ")[0] || "";

    return (
        <header className="appnav-root">

            {/* ── TIER 1: UTILITY BAR ── */}
            <div className="appnav-utility">
                <div className="appnav-utility-inner">
                    <div className="appnav-logo" onClick={() => navigate("/dashboard")}>
                        <span className="appnav-leaf">🌿</span>
                        <span>RecipeGen</span>
                    </div>

                    <div className="appnav-utility-right">
                        {firstName && (
                            <span className="appnav-greeting">Hi, <strong>{firstName}</strong></span>
                        )}
                        <div className="appnav-divider" />
                        <button className="appnav-util-btn" onClick={() => navigate("/profile")}>
                            <SettingsIcon />
                            <span>Settings</span>
                        </button>
                        <button className="appnav-util-btn appnav-util-btn--logout" onClick={handleSignOut}>
                            <LogOutIcon />
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── TIER 2: PRIMARY NAV ── */}
            <nav className="appnav-primary">
                <div className="appnav-primary-inner">
                    {PRIMARY_LINKS.map(({ label, route }) => {
                        const isActive = activeSection(pathname) === route;
                        return (
                            <button
                                key={route}
                                className={`appnav-link${isActive ? " appnav-link--active" : ""}`}
                                onClick={() => navigate(route)}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </nav>

        </header>
    );
}
