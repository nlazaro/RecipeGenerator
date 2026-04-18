import React from "react";
import "./Confirmation.css";

const ingredientsLeft = [
    "2 Fresh Pacific Cod Fillets (6oz)",
    "2 tbsp Cold-Pressed Olive Oil",
    "Zest of 1 Sicilian Lemon",
];

const ingredientsRight = [
    "1 Large Organic Fennel Bulb",
    "Smoked Paprika & Sea Salt",
    "Micro-cilantro for garnish",
];

const instructions = [
    {
        number: "01",
        title: "PREPARATION",
        text: "Pat the cod fillets dry with linen towels. This is critical for achieving a crisp blackened exterior. Thinly shave the fennel bulb using a mandoline, reserving the fronds for garnish.",
    },
    {
        number: "02",
        title: "THE SEARING",
        text: "Heat a heavy cast-iron skillet over medium-high heat until it begins to smoke slightly. Add the olive oil and sear the spiced cod for 4 minutes per side without moving them to develop a crust.",
    },
    {
        number: "03",
        title: "FINISHING",
        text: "Toss the shaved fennel with lemon juice and a touch of sea salt. Plate the cod atop the fennel salad and garnish with micro-cilantro and fennel fronds.",
    },
];

export default function Confirmation() {
    return (
        <div className="recipe-page">
            <nav className="topbar">
                <div className="brand">RECIPE.AI</div>

                <div className="nav-right">
                    <a href="/">EXPLORE</a>
                    <a href="/" className="active">
                        RECIPES
                    </a>
                    <a href="/">SAVED</a>
                    <span className="icon">↻</span>
                    <span className="icon">⚙</span>
                    <div className="avatar">J</div>
                </div>
            </nav>

            <main className="hero-grid">
                <section className="hero-left">
                    <div className="label">SIGNATURE DISH</div>

                    <h1 className="recipe-title">
                        BLACKENED
                        <br />
                        COD &amp; FENNEL
                    </h1>

                    <div className="hero-image-wrap">
                        <img
                            className="hero-image"
                            src="https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80"
                            alt="Blackened cod plated with fennel"
                        />
                    </div>
                </section>

                <aside className="recipe-sidebar">
                    <div className="meta-block">
                        <div className="meta-row">
                            <span>PREP TIME</span>
                            <strong>15 MIN</strong>
                        </div>
                        <div className="meta-row">
                            <span>COOK TIME</span>
                            <strong>10 MIN</strong>
                        </div>
                        <div className="meta-row">
                            <span>SERVINGS</span>
                            <strong>02</strong>
                        </div>
                        <div className="meta-row">
                            <span>DIFFICULTY</span>
                            <strong>MODERATE</strong>
                        </div>
                    </div>

                    <div className="sidebar-buttons">
                        <button className="btn btn-dark">SAVE TO COLLECTION</button>
                        <button className="btn btn-light">EXPORT PDF</button>
                    </div>

                    <div className="nutrition">
                        <h4>NUTRITIONAL DATA</h4>
                        <div className="nutrition-grid">
                            <div className="nutrition-card">
                                <span>CALORIES</span>
                                <strong>320</strong>
                            </div>
                            <div className="nutrition-card">
                                <span>PROTEIN</span>
                                <strong>42g</strong>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            <section className="ingredients-section">
                <h2>
                    <span className="section-number">01</span> INGREDIENTS
                </h2>

                <div className="ingredients-grid">
                    <ul>
                        {ingredientsLeft.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>

                    <ul>
                        {ingredientsRight.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="instructions-section">
                <h2>
                    <span className="section-number">02</span> INSTRUCTIONS
                </h2>

                <div className="instructions-list">
                    {instructions.map((step) => (
                        <div className="instruction-item" key={step.number}>
                            <div className="instruction-number">{step.number}</div>

                            <div className="instruction-content">
                                <h3>{step.title}</h3>
                                <p>{step.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}