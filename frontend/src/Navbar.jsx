import { useNavigate, useLocation } from "react-router-dom";
import "./navbar.css";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: "Review", path: "/review" },
        { label: "Recipes", path: "/confirmation" },
        { label: "Profile", path: "/profile" },
    ];

    return (
        <nav className="app-navbar">
            <div className="nav-logo" onClick={() => navigate("/")}>
                🌿 RecipeGen
            </div>

            <div className="nav-links">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={
                            location.pathname === item.path
                                ? "nav-link active"
                                : "nav-link"
                        }
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </nav>
    );
}