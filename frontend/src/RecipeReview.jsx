import React, { useState } from "react";
import "./reciple_review.css";
import { useNavigate } from "react-router-dom";

export default function recipe_review() {

    const [ingredients, setIngredients] = useState([
        { id: "01", name: "Heirloom Tomatoes", detail: "Approx. 400g • Ripe" },
        { id: "02", name: "Fresh Basil Leaves", detail: "1 bunch • Organic" },
        { id: "03", name: "Garlic Bulbs", detail: "2 units • Purple" },
        { id: "04", name: "Extra Virgin Olive Oil", detail: "Visible in frame" },
    ]);

    const removeIngredient = (id) => {
        setIngredients(ingredients.filter(item => item.id !== id));
    };

    const addIngredient = () => {
        const newItem = {
            // id: Date.now().toString(),
            name: "New Ingredient",
            detail: "Edit me",
        };
        setIngredients([...ingredients, newItem]);
    };

    const editIngredient = (id) => {
        const newName = prompt("Enter new name:");
        if (!newName) return;

        setIngredients(
            ingredients.map(item =>
                item.id === id ? { ...item, name: newName } : item
            )
        );
    };

    const navigate = useNavigate();

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
                                <span
                                    className="edit"
                                    onClick={() => editIngredient(item.id)}
                                >
                                    ✎
                                </span>

                                <span
                                    className="delete"
                                    onClick={() => removeIngredient(item.id)}>🗑</span>
                            </div>
                        ))}
                    </div>

                    <button
                        className="primary"
                        onClick={() => navigate("/")}
                    >
                        CONFIRM SELECTION →
                    </button>

                    <button className="secondary" onClick={addIngredient}>
                        ADD MISSING ITEM
                    </button>
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