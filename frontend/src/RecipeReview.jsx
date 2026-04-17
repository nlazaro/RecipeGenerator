import React from "react";
import "./reciple_review.css";

const ingredients = [
    { id: "01", name: "Heirloom Tomatoes", detail: "Approx. 400g • Ripe" },
    { id: "02", name: "Fresh Basil Leaves", detail: "1 bunch • Organic" },
    { id: "03", name: "Garlic Bulbs", detail: "2 units • Purple" },
    { id: "04", name: "Extra Virgin Olive Oil", detail: "Visible in frame" },
];

export default function recipe_review() {
    return (
        <div className="container">
            <header className="header">
                <h4>ANALYSIS COMPLETE</h4>
                <h1>IDENTIFIED ITEMS</h1>
            </header>

            <div className="content">
                <div className="imageSection">
                    <img
                        src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
                        alt=""
                    />
                    <div className="tag top">Confidence 98% • Heirloom Tomatoes</div>
                    <div className="tag bottom">Confidence 94% • Fresh Basil</div>
                </div>

                <div className="panel">
                    <div className="panelHeader">
                        <h3>INGREDIENTS</h3>
                        <span>04 ITEMS</span>
                    </div>

                    <div className="list">
                        {ingredients.map((item) => (
                            <div key={item.id} className="listItem">
                                <span className="id">{item.id}</span>
                                <div>
                                    <p className="name">{item.name}</p>
                                    <p className="detail">{item.detail}</p>
                                </div>
                                <span className="edit">✎</span>
                            </div>
                        ))}
                    </div>

                    <button className="primary">CONFIRM SELECTION →</button>
                    <button className="secondary">ADD MISSING ITEM</button>
                </div>
            </div>

            <footer className="footer">
                <p>
                    “The quality of identification improves with natural lighting and
                    clear separation of ingredients.”
                </p>
            </footer>
        </div>
    );
}