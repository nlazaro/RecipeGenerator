import { useEffect, useState } from 'react'
import pokeImg from './assets/poke.png'
import tuscanImg from './assets/tuscan-pasta.jpg'
import './App.css'
import { useNavigate } from 'react-router-dom'



const NAV_SECTIONS = [
    { id: 'recipe-scan', label: 'Recipe Scan' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'ai-recipes', label: 'AI Recipes' },
    { id: 'nutrition', label: 'Nutrition' },
]

function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
    })
}

function Landing({ onNavigate }) {
    const navigate = useNavigate()
    const [showSecondNav, setShowSecondNav] = useState(false)
    const [activeSection, setActiveSection] = useState('recipe-scan')

    useEffect(() => {
        const onScroll = () => setShowSecondNav(window.scrollY > 120)
        window.addEventListener('scroll', onScroll, { passive: true })

        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        const observers = NAV_SECTIONS.map(({ id }) => {
            const el = document.getElementById(id)
            if (!el) return null

            const obs = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) setActiveSection(id)
                },
                { rootMargin: '-15% 0px -75% 0px', threshold: 0 }
            )

            obs.observe(el)
            return obs
        }).filter(Boolean)

        return () => observers.forEach((o) => o.disconnect())
    }, [])

    return (
        <div className="landing">
            <nav className="navbar nav-top">
                <div className="nav-inner">
                    <div className="nav-logo">
                        <span className="logo-leaf">🌿</span>
                        <span>RecipeGen</span>
                    </div>
                    <button className="nav-user-btn" onClick={() => onNavigate('signin')}>
                        <span>👤</span>
                    </button>
                </div>
            </nav>

            <nav className={`navbar-second ${showSecondNav ? 'navbar-second-visible' : ''}`}>
                <div className="nav-chips-wrap">
                    {NAV_SECTIONS.map(({ id, label }) => (
                        <button
                            key={id}
                            className={`sec-chip ${activeSection === id ? 'sec-chip-active' : ''}`}
                            onClick={() => scrollTo(id)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </nav>

            <section id="recipe-scan" className="hero">
                <div className="hero-inner">
                    <h1 className="hero-title">
                        Scan, plan, and cook
                        <br />
                        with <span className="accent-green">ingredients</span> you already have.
                    </h1>
                    <p className="hero-sub">
                        Track your ingredients. Cook around your dietary needs.
                    </p>

                    <div className="hero-visual">
                        <span className="ingr i1">🥑</span>
                        <span className="ingr i2">🐟</span>
                        <span className="ingr i3">🥕</span>
                        <span className="ingr i4">🥒</span>
                        <span className="ingr i5">🫛</span>
                        <span className="ingr i6">🌶️</span>
                        <span className="ingr i7">🥬</span>
                        <span className="ingr i8">🍋</span>
                        <span className="ingr i9">🧅</span>
                        <span className="ingr i10">🫚</span>

                        <div
                            className="pokebowl"
                            style={{ backgroundImage: `url(${pokeImg})` }}
                        />
                    </div>

                    <button
                        className="btn-primary-hero"
                        onClick={() => navigate('/review')}
                    >
                        Start Your Recipe
                    </button>
                    <a href="#how-it-works" className="how-link">How It Works</a>
                </div>
            </section>

            <section className="viz-section">
                <div className="section-wrap">
                    <p className="viz-eyebrow">Your kitchen, your way</p>
                    <h2 className="viz-headline">
                        Track and manage ingredients,
                        <br />
                        explore cooking variations, and
                        <br />
                        reduce food waste at home.
                    </h2>

                    <div className="viz-cards">
                        <div className="viz-card vc-green">
                            <div className="vc-icon-wrap"><span>✏️</span></div>
                            <h3>Type It In</h3>
                            <p>
                                Quickly log what's in your kitchen by typing items and quantities.
                                Your inventory updates instantly.
                            </p>
                            <div className="vc-demo-row">
                                <span className="vc-tag">🥑 Avocado × 2</span>
                                <span className="vc-tag">🥕 Carrot × 5</span>
                            </div>
                        </div>

                        <div className="viz-card vc-teal">
                            <div className="vc-icon-wrap"><span>📷</span></div>
                            <h3>Snap &amp; Detect</h3>
                            <p>
                                Point your camera at the fridge or pantry. Our vision model identifies
                                and counts your ingredients automatically.
                            </p>
                            <div className="vc-badge-row">
                                <span className="vc-scan-badge">✅ 6 items detected</span>
                            </div>
                        </div>

                        <div className="viz-card vc-dark">
                            <div className="vc-icon-wrap"><span>🎙️</span></div>
                            <h3>Just Say It</h3>
                            <p>
                                Tell RecipeGen what's in your kitchen out loud. ElevenLabs converts
                                your voice into a structured ingredient list in seconds.
                            </p>
                            <div className="vc-wave-row">
                                <span className="vc-wave-bar"></span>
                                <span className="vc-wave-bar"></span>
                                <span className="vc-wave-bar"></span>
                                <span className="vc-wave-bar"></span>
                                <span className="vc-wave-bar"></span>
                            </div>
                        </div>
                    </div>

                    <div className="viz-confirm-strip">
                        <span className="vcs-icon">🔍</span>
                        <div>
                            <strong>You're always in control.</strong>
                            <span>
                                {' '}Review and correct your inventory before any recipe is generated —
                                because you know your kitchen best.
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section id="how-it-works" className="hiw-section">
                <div className="hiw-wrap">
                    <div className="hiw-header">
                        <p className="hiw-eyebrow">The full experience</p>
                        <h2 className="hiw-title">
                            From empty fridge
                            <br />
                            to perfect plate.
                        </h2>
                        <p className="hiw-sub">
                            RecipeGen handles everything — ingredient detection, personalised
                            recipe matching, real-time voice guidance, and a feedback loop
                            that gets smarter every meal.
                        </p>
                    </div>

                    <div className="hiw-step">
                        <div className="hiw-panel hp-sage">
                            <div className="hp-input-methods">
                                <div className="hp-method">
                                    <span className="hp-method-icon">✏️</span>
                                    <span>Type it in</span>
                                </div>
                                <div className="hp-method hp-method-active">
                                    <span className="hp-method-icon">📷</span>
                                    <span>Snap a photo</span>
                                </div>
                                <div className="hp-method">
                                    <span className="hp-method-icon">🎙️</span>
                                    <span>Say it out loud</span>
                                </div>
                            </div>
                            <div className="hp-scan-result">
                                <div className="hp-scan-row"><span>🥑</span><span>Avocado</span><span className="hp-qty">× 2</span></div>
                                <div className="hp-scan-row"><span>🥕</span><span>Carrot</span><span className="hp-qty">× 4</span></div>
                                <div className="hp-scan-row"><span>🧅</span><span>Onion</span><span className="hp-qty">× 3</span></div>
                                <div className="hp-scan-footer">📷 6 items detected</div>
                            </div>
                        </div>
                        <div className="hiw-text">
                            <span className="hiw-num">01</span>
                            <h3>Log Your Ingredients</h3>
                            <p>
                                Add what's in your kitchen three ways — type items manually, snap
                                a photo of your fridge or pantry and let our vision model classify
                                everything, or just say it out loud via ElevenLabs voice input.
                                No manual entry required.
                            </p>
                        </div>
                    </div>

                    <div className="hiw-step hiw-step-rev">
                        <div className="hiw-text">
                            <span className="hiw-num">02</span>
                            <h3>Confirm &amp; Correct</h3>
                            <p>
                                AI is good — but you know your kitchen best. Before any recipe is
                                generated, review the detected inventory and correct anything that's
                                off. Tap any item to update quantities or remove it entirely.
                            </p>
                        </div>
                        <div className="hiw-panel hp-dark">
                            <div className="hp-inventory">
                                <div className="hp-inv-title">Your Inventory</div>
                                <div className="hp-inv-row">
                                    <span>🍅</span>
                                    <span>Tomato</span>
                                    <div className="hp-inv-edit">
                                        <span className="hp-inv-old">3</span>
                                        <span className="hp-inv-arrow">→</span>
                                        <span className="hp-inv-new">4</span>
                                    </div>
                                </div>
                                <div className="hp-inv-row">
                                    <span>🥬</span><span>Spinach</span><span className="hp-inv-check">✓</span>
                                </div>
                                <div className="hp-inv-row">
                                    <span>🧄</span><span>Garlic</span><span className="hp-inv-check">✓</span>
                                </div>
                                <div className="hp-inv-confirm">Inventory confirmed — ready to generate</div>
                            </div>
                        </div>
                    </div>

                    <div className="hiw-step">
                        <div className="hiw-panel hp-green">
                            <div className="hp-profile-tags">
                                <span className="hp-tag">🥗 Vegetarian</span>
                                <span className="hp-tag">⚡ High protein</span>
                                <span className="hp-tag">🚫 No nuts</span>
                            </div>
                            <div className="hp-recipe-cards">
                                <div className="hp-rcard hp-rcard-active">
                                    <div className="hp-rcard-img" style={{ backgroundImage: `url(${tuscanImg})` }} />
                                    <div className="hp-rcard-body">
                                        <strong>Creamy Tuscan Pasta</strong>
                                        <span>94% match · 25 min</span>
                                    </div>
                                </div>
                                <div className="hp-rcard">
                                    <div className="hp-rcard-img hp-rcard-placeholder">🥗</div>
                                    <div className="hp-rcard-body">
                                        <strong>Spinach Stir Fry</strong>
                                        <span>88% match · 15 min</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="hiw-text">
                            <span className="hiw-num">03</span>
                            <h3>AI Picks Your Recipe</h3>
                            <p>
                                Gemini analyses your confirmed ingredients against your personal
                                profile — dietary goals, restrictions, allergies, and past ratings —
                                then proposes 2–4 recipes ranked by how well they fit you right now.
                            </p>
                        </div>
                    </div>

                    <div className="hiw-step hiw-step-rev">
                        <div className="hiw-text">
                            <span className="hiw-num">04</span>
                            <h3>Cook with Your AI Guide</h3>
                            <p>
                                Pick a recipe and let ElevenLabs take over. A warm, natural voice
                                walks you through every prep and cooking step in real time —
                                hands-free, so you can focus entirely on the food.
                            </p>
                        </div>
                        <div className="hiw-panel hp-midnight">
                            <div className="hp-voice-ui">
                                <div className="hp-step-label">Step 2 of 6</div>
                                <div className="hp-step-text">
                                    "Dice the onion and garlic, then heat olive oil in a pan over medium heat..."
                                </div>
                                <div className="hp-voice-wave">
                                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                        <span
                                            key={i}
                                            className="hp-vbar"
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        ></span>
                                    ))}
                                </div>
                                <div className="hp-voice-controls">
                                    <button className="hp-vbtn">⏮ Repeat</button>
                                    <button className="hp-vbtn hp-vbtn-primary">Next ⏭</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hiw-step">
                        <div className="hiw-panel hp-warm">
                            <div className="hp-rating-ui">
                                <div className="hp-rating-title">How was it?</div>
                                <div className="hp-stars">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <span key={s} className={`hp-star ${s <= 4 ? 'hp-star-filled' : ''}`}>★</span>
                                    ))}
                                </div>
                                <div className="hp-feedback-tags">
                                    <span className="hp-ftag hp-ftag-yes">✅ Make again</span>
                                    <span className="hp-ftag hp-ftag-yes">😋 Delicious</span>
                                    <span className="hp-ftag hp-ftag-no">⏱ Too long</span>
                                </div>
                                <div className="hp-rating-note">
                                    "Great flavour but maybe reduce the garlic next time."
                                </div>
                            </div>
                        </div>
                        <div className="hiw-text">
                            <span className="hiw-num">05</span>
                            <h3>Rate &amp; Refine</h3>
                            <p>
                                After eating, give the recipe a 1–5 star rating and add quick notes.
                                RecipeGen remembers what you loved, what to tweak, and what to never
                                suggest again — getting smarter with every single meal.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="ai-recipes" className="ai-section">
                <div className="ai-inner">
                    <div className="ai-narrative">
                        <p className="ai-eyebrow">Powered by Gemini AI</p>
                        <h2 className="ai-title">
                            Recipes built around
                            <br />
                            exactly what you have.
                        </h2>
                        <p className="ai-desc">
                            Once your inventory is confirmed, RecipeGen sends every authenticated
                            ingredient straight to Gemini — alongside your dietary goals,
                            restrictions, allergies, and past meal ratings. No guessing.
                            No extra shopping. Just recipes that work with your kitchen, right now.
                        </p>

                        <ul className="ai-bullets">
                            <li>
                                <span className="ai-bullet-icon">✅</span>
                                <div>
                                    <strong>Inventory-first matching</strong>
                                    <span>Only recommends recipes you can make today — zero missing ingredients</span>
                                </div>
                            </li>
                            <li>
                                <span className="ai-bullet-icon">👤</span>
                                <div>
                                    <strong>Profile-aware suggestions</strong>
                                    <span>Dietary goals, restrictions, and allergies are baked into every recommendation</span>
                                </div>
                            </li>
                            <li>
                                <span className="ai-bullet-icon">⭐</span>
                                <div>
                                    <strong>Learns your taste over time</strong>
                                    <span>Past ratings and feedback continuously refine what Gemini proposes next</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="ai-flow-panel">
                        <div className="afp-block afp-inventory">
                            <div className="afp-block-label">
                                <span className="afp-dot afp-dot-green"></span>
                                Confirmed inventory — 9 items
                            </div>
                            <div className="afp-ingr-chips">
                                <span>🥑 Avocado</span>
                                <span>🥕 Carrot</span>
                                <span>🧅 Onion</span>
                                <span>🥬 Spinach</span>
                                <span>🌶️ Chili</span>
                                <span>🧄 Garlic</span>
                                <span>🍅 Tomato</span>
                                <span className="afp-chip-more">+2 more</span>
                            </div>
                        </div>

                        <div className="afp-connector">
                            <span className="afp-line"></span>
                            <div className="afp-gemini-badge">
                                <span>✦</span> Gemini AI
                            </div>
                            <span className="afp-line"></span>
                        </div>

                        <div className="afp-block afp-profile">
                            <div className="afp-block-label">
                                <span className="afp-dot afp-dot-purple"></span>
                                Your profile
                            </div>
                            <div className="afp-profile-pills">
                                <span>🥗 Vegetarian</span>
                                <span>⚡ High protein</span>
                                <span>🚫 No nuts</span>
                                <span>⭐ Past ratings</span>
                            </div>
                        </div>

                        <div className="afp-connector">
                            <span className="afp-line"></span>
                            <div className="afp-result-badge">2–4 recipes generated</div>
                            <span className="afp-line"></span>
                        </div>

                        <div className="afp-recipes">
                            <div className="afp-recipe afp-recipe-top">
                                <div className="afp-recipe-img" style={{ backgroundImage: `url(${tuscanImg})` }} />
                                <div className="afp-recipe-info">
                                    <div className="afp-recipe-meta">
                                        <strong>Creamy Tuscan Pasta</strong>
                                        <span className="afp-match">94% match</span>
                                    </div>
                                    <div className="afp-recipe-sub">⏱ 25 min · 🔥 520 kcal</div>
                                </div>
                                <span className="afp-pick-badge">Top pick</span>
                            </div>

                            <div className="afp-recipe-row">
                                <div className="afp-recipe afp-recipe-sm">
                                    <div className="afp-recipe-icon">🥗</div>
                                    <div className="afp-recipe-info">
                                        <strong>Spinach Stir Fry</strong>
                                        <span>88% · 15 min</span>
                                    </div>
                                </div>
                                <div className="afp-recipe afp-recipe-sm">
                                    <div className="afp-recipe-icon">🍜</div>
                                    <div className="afp-recipe-info">
                                        <strong>Tomato Ramen</strong>
                                        <span>82% · 20 min</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="nutrition" className="diet-section">
                <div className="diet-inner">
                    <div className="diet-header">
                        <p className="diet-eyebrow">Your profile. Every recipe.</p>
                        <h2 className="diet-title">
                            Every recommendation is built
                            <br />
                            around who you are.
                        </h2>
                        <p className="diet-sub">
                            Before Gemini generates a single recipe, it reads your full dietary profile —
                            your goals, restrictions, and allergies are hard filters, not suggestions.
                            Nothing that conflicts with your profile ever reaches your plate.
                        </p>
                    </div>

                    <div className="diet-layout">
                        <div className="diet-profile-card">
                            <div className="dpc-header">
                                <div className="dpc-avatar">S</div>
                                <div>
                                    <strong>Your Dietary Profile</strong>
                                    <span>Sent to Gemini on every request</span>
                                </div>
                            </div>

                            <div className="dpc-section">
                                <div className="dpc-label">🎯 Goals</div>
                                <div className="dpc-chips">
                                    <span className="dpc-chip dpc-chip-green">High protein</span>
                                    <span className="dpc-chip dpc-chip-green">Weight loss</span>
                                    <span className="dpc-chip dpc-chip-green">Low carb</span>
                                </div>
                            </div>

                            <div className="dpc-section">
                                <div className="dpc-label">🥗 Dietary style</div>
                                <div className="dpc-chips">
                                    <span className="dpc-chip dpc-chip-teal">Vegetarian</span>
                                    <span className="dpc-chip dpc-chip-teal">Dairy-free</span>
                                </div>
                            </div>

                            <div className="dpc-section">
                                <div className="dpc-label">🚫 Allergies — never included</div>
                                <div className="dpc-chips">
                                    <span className="dpc-chip dpc-chip-red">Tree nuts</span>
                                    <span className="dpc-chip dpc-chip-red">Shellfish</span>
                                </div>
                            </div>

                            <div className="dpc-section">
                                <div className="dpc-label">⭐ Taste from your ratings</div>
                                <div className="dpc-rating-row">
                                    <div className="dpc-rating-item">
                                        <span>Spicy food</span>
                                        <div className="dpc-bar-wrap">
                                            <div className="dpc-bar" style={{ width: '70%' }}></div>
                                        </div>
                                    </div>
                                    <div className="dpc-rating-item">
                                        <span>Quick meals</span>
                                        <div className="dpc-bar-wrap">
                                            <div className="dpc-bar dpc-bar-teal" style={{ width: '90%' }}></div>
                                        </div>
                                    </div>
                                    <div className="dpc-rating-item">
                                        <span>Complex recipes</span>
                                        <div className="dpc-bar-wrap">
                                            <div className="dpc-bar dpc-bar-muted" style={{ width: '30%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="dpc-footer">✦ Profile synced to Gemini AI</div>
                        </div>

                        <div className="diet-benefits">
                            <div className="db-card">
                                <span className="db-icon">🛡️</span>
                                <div>
                                    <h4>Allergy-safe by default</h4>
                                    <p>
                                        Allergens are hard-filtered before Gemini ever sees your inventory.
                                        They cannot appear in any suggestion, ever.
                                    </p>
                                </div>
                            </div>

                            <div className="db-card">
                                <span className="db-icon">🎯</span>
                                <div>
                                    <h4>Goal-aware every time</h4>
                                    <p>
                                        Whether you're building muscle or cutting calories, your macro targets
                                        shape the portions and ingredients Gemini chooses.
                                    </p>
                                </div>
                            </div>

                            <div className="db-card">
                                <span className="db-icon">🔄</span>
                                <div>
                                    <h4>Ratings refine your profile</h4>
                                    <p>
                                        Every star rating and note you leave after a meal is fed back into
                                        your profile — so future recipes drift toward what you actually love.
                                    </p>
                                </div>
                            </div>

                            <div className="db-card">
                                <span className="db-icon">✏️</span>
                                <div>
                                    <h4>Always editable</h4>
                                    <p>
                                        Changed your diet? Going keto? Add, remove, or update any restriction
                                        or goal from your profile at any time — changes take effect immediately.
                                    </p>
                                </div>
                            </div>

                            <div className="db-cta">
                                <button className="btn-primary-hero" onClick={() => onNavigate('profile')}>
                                    Configure Your Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta-dark">
                <div className="cta-wrap">
                    <h2>Ready for Peak Performance?</h2>
                    <p>Ready. RecipeGen will streamline your entire recipe experience to your performance.</p>
                    <button className="btn-pill-gradient btn-lg">Ready for Peak Form</button>
                </div>
            </section>

            <footer className="footer">
                <div className="footer-inner">
                    <div className="footer-top">
                        <div className="footer-brand">
                            <span className="footer-leaf">🌿</span>
                            <span>RecipeGen</span>
                        </div>
                        <nav className="footer-nav">
                            <a href="#">How It Works</a>
                            <a href="#">AI Recipes</a>
                            <a href="#">Nutrition</a>
                            <a href="#">Contact Us</a>
                        </nav>
                    </div>

                    <div className="footer-divider" />

                    <div className="footer-bottom">
                        <span className="footer-copy">© 2026 RecipeGen. All rights reserved.</span>
                        <div className="footer-legal">
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                        <div className="footer-made">Built with 🌿 for demo day</div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Landing