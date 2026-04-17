import { useState } from 'react'
import SignIn from './SignIn'
import './App.css'

function App() {
  const [page, setPage] = useState('landing')

  if (page === 'signin') return <SignIn onNavigate={setPage} />

  return (
    <div className="landing">

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-inner">
          <div className="nav-logo">
            <span className="logo-leaf">🌿</span>
            <span>RecipeGen</span>
          </div>
          <div className="nav-actions">
            <button className="btn-ghost-nav" onClick={() => setPage('signin')}>Log In</button>
            <button className="btn-pill-gradient">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">
            Scan, plan, and cook<br />
            Scan, plan, and cook<br />
            with <span className="accent-green">you already have.</span>
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

            <div className="pokebowl">
              <div className="pokebowl-shine"></div>
            </div>
          </div>

          <button className="btn-primary-hero">Start Your Recipe</button>
          <a href="#how-it-works" className="how-link">How It Works</a>
        </div>
      </section>

      {/* Recipe Visualization */}
      <section className="viz-section">
        <div className="section-wrap">
          <h2 className="section-heading">Recipe Visualization</h2>
          <p className="section-sub">
            Track and manage ingredients, explore cooking variations,
            and reduce food waste at home.
          </p>
          <div className="viz-cards">
            <div className="viz-card vc-green">
              <div className="vc-icon-wrap"><span>📷</span></div>
              <h3>Rapid Scan</h3>
              <p>Scan your pantry &amp; inventory, and cook with what you have today.</p>
            </div>
            <div className="viz-card vc-purple">
              <div className="vc-icon-wrap"><span>🧠</span></div>
              <h3>Recipe AI</h3>
              <p>Generate recipes tailored to your health and dietary preferences.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Recipe Generation — dark */}
      <section className="ai-section">
        <div className="ai-wrap">
          <div className="ai-text">
            <h2>AI Recipe<br />Generation</h2>
            <p>
              Convert your ingredients from AI recipe generation,
              then scan your healthy kitchen choices.
            </p>
          </div>
          <div className="ai-card-stack">
            <div className="acs-bg"></div>
            <div className="ai-card">
              <div className="ac-photo">🥗</div>
              <div className="ac-body">
                <h4>Creamy Tuscan Pasta</h4>
                <div className="ac-badge">✅ AI match score</div>
                <div className="ac-stats">
                  <div><strong>8</strong><span>Recipe</span></div>
                  <div><strong>20</strong><span>Snacks</span></div>
                  <div><strong>1h 21m</strong><span>Prep time</span></div>
                </div>
                <button className="ac-btn">Recipe now</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dietary Intelligence */}
      <section className="diet-section">
        <div className="section-wrap">
          <h2 className="section-heading">Dietary Intelligence</h2>
          <p className="section-sub">
            RecipeGen uses dietary intelligence to personalize your
            cooking experience every single time.
          </p>
          <button className="btn-primary-hero" style={{ marginBottom: '48px' }}>
            Configure Your Profile
          </button>
          <div className="diet-cards">
            <div className="dc">
              <div className="dc-icon">👤</div>
              <h4>Profile Setup</h4>
              <p>Licowense features for dietary relationships.</p>
            </div>
            <div className="dc">
              <div className="dc-icon">⚙️</div>
              <h4>Features</h4>
              <p>Underhorme, scards and scan in your inventory.</p>
            </div>
            <div className="dc dc-teal">
              <div className="dc-icon">😊</div>
              <h4>Dietary Inventory</h4>
              <p>Configure live setups to review with your profile.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — dark */}
      <section className="cta-dark">
        <div className="cta-wrap">
          <h2>Ready for Peak Performance?</h2>
          <p>Ready. RecipeGen will streamline your entire recipe experience to your performance.</p>
          <button className="btn-pill-gradient btn-lg">Ready for Peak Form</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-wrap">
          <strong>RecipeGen</strong>
          <div className="footer-links">
            <a href="#">Contact Us</a>
            <a href="#">Terms</a>
            <a href="#">Privacy Policy</a>
          </div>
          <span>© 2024. All rights reserved.</span>
        </div>
      </footer>

    </div>
  )
}

export default App
