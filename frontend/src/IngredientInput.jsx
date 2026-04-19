import React from "react";
import "./IngredientInput.css";
import { useNavigate } from "react-router-dom";

const METHODS = [
    {
        id: "photo",
        icon: "📷",
        title: "Photo Scan",
        description: "Take a picture of your fridge or pantry and we'll identify what's inside.",
        cta: "Scan Now",
        route: "/review",
        available: true,
    },
    {
        id: "text",
        icon: "✏️",
        title: "Type It In",
        description: "Manually enter your ingredients and quantities at your own pace.",
        cta: "Start Typing",
        route: "/review",
        available: true,
    },
    {
        id: "voice",
        icon: "🎙️",
        title: "Voice Input",
        description: "Just speak — we'll listen and build your inventory from what you say.",
        cta: "Coming Soon",
        route: null,
        available: false,
    },
];

export default function IngredientInput() {
    const navigate = useNavigate();

    return (
        <div className="ii-root">
            <nav className="ii-nav">
                <span className="ii-logo" onClick={() => navigate("/dashboard")}>RecipeGen</span>
                <button className="ii-back" onClick={() => navigate("/dashboard")}>
                    ← Back to Dashboard
                </button>
            </nav>

            <main className="ii-main">
                <div className="ii-header">
                    <p className="ii-eyebrow">Step 1 of 2</p>
                    <h1 className="ii-title">How would you like to<br />add your ingredients?</h1>
                    <p className="ii-subtitle">
                        Choose the method that works best for you. You can always edit the list before we generate your recipes.
                    </p>
                </div>

                <div className="ii-grid">
                    {METHODS.map((method) => (
                        <div
                            key={method.id}
                            className={`ii-card${!method.available ? " ii-card--disabled" : ""}`}
                            onClick={() => method.available && navigate(method.route)}
                        >
                            <div className="ii-card-icon">{method.icon}</div>
                            <h2 className="ii-card-title">{method.title}</h2>
                            <p className="ii-card-desc">{method.description}</p>
                            <span className={`ii-card-cta${!method.available ? " ii-card-cta--soon" : ""}`}>
                                {method.cta} {method.available && "→"}
                            </span>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
