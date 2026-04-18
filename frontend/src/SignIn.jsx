import { useState } from 'react'
import './SignIn.css'

function SignIn({ onNavigate }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="si-page">

      {/* Ambient background blobs */}
      <div className="si-blob si-blob-tl"></div>
      <div className="si-blob si-blob-br"></div>

      <main className="si-main">

        {/* Brand anchor */}
        <div className="si-brand">
          <div className="si-logo" onClick={() => onNavigate('landing')}>
            <span>🌿</span>
            <span>RecipeGen</span>
          </div>
          <p className="si-tagline">The Encouraging Curator</p>
        </div>

        {/* Card */}
        <div className="si-card">
          <div className="si-card-head">
            <h2>Welcome Back</h2>
            <p>Please enter your details to access your recipe journal.</p>
          </div>

          <form className="si-form" onSubmit={e => e.preventDefault()}>

            {/* Email */}
            <div className="si-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="si-field">
              <div className="si-field-row">
                <label htmlFor="password">Password</label>
                <a href="#" className="si-forgot">Forgot Password?</a>
              </div>
              <div className="si-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="si-eye"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" className="si-submit">Log In</button>
          </form>

          {/* Divider */}
          <div className="si-divider">
            <span className="si-divider-line"></span>
            <span className="si-divider-text">Or continue with</span>
            <span className="si-divider-line"></span>
          </div>

          {/* Social */}
          <div className="si-social">
            <button className="si-social-btn">
              <span className="si-social-icon">G</span>
              Google
            </button>
            <button className="si-social-btn">
              <span className="si-social-icon si-fb">f</span>
              Facebook
            </button>
          </div>

          {/* Switch to sign up */}
          <p className="si-switch">
            New to RecipeGen?{' '}
            <a href="#" className="si-link">Create an account</a>
          </p>
        </div>

        {/* Security note */}
        <div className="si-security">
          <span className="si-security-icon">🔒</span>
          <p>
            Your recipe data is secured with the highest standards.
            We prioritize your privacy and encryption across the entire
            RecipeGen experience.
          </p>
        </div>

      </main>

      {/* Footer */}
      <footer className="si-footer">
        <div className="si-footer-inner">
          <span className="si-footer-brand">RecipeGen</span>
          <div className="si-footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
          <div className="si-footer-social">
            <span>📷</span>
            <span>@</span>
          </div>
        </div>
        <p className="si-footer-copy">
          © 2024 RecipeGen Experience. All rights reserved.
        </p>
      </footer>

    </div>
  )
}

export default SignIn
