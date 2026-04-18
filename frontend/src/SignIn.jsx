import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './SignIn.css'
import { auth, googleProvider } from './firebase'
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

function SignIn() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState(null)

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      // change this later on to javiers page
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleGoogle() {
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
      // change this later on to javier page
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="si-page">

      {/* Ambient background blobs */}
      <div className="si-blob si-blob-tl"></div>
      <div className="si-blob si-blob-br"></div>

      <main className="si-main">

        {/* Brand anchor */}
        <div className="si-brand">
          <div className="si-logo" onClick={() => navigate('/')}>
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

          <form className="si-form" onSubmit={handleEmailSubmit}>

            {/* Email */}
            <div className="si-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                  value={password}
                  onChange={e => setPassword(e.target.value)}
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

            {error && <p style={{ color: 'red', fontSize: '0.85rem' }}>{error}</p>}

            <button type="submit" className="si-submit">
              {isSignUp ? 'Create Account' : 'Log In'}
            </button>
          </form>

          {/* Divider */}
          <div className="si-divider">
            <span className="si-divider-line"></span>
            <span className="si-divider-text">Or continue with</span>
            <span className="si-divider-line"></span>
          </div>

          {/* Social */}
          <div className="si-social">
            <button className="si-social-btn" type="button" onClick={handleGoogle}>
              <span className="si-social-icon">G</span>
              Google
            </button>
          </div>

          {/* Switch to sign up */}
          <p className="si-switch">
            {isSignUp ? 'Already have an account? ' : 'New to RecipeGen? '}
            <a href="#" className="si-link" onClick={e => { e.preventDefault(); setIsSignUp(v => !v) }}>
              {isSignUp ? 'Log in' : 'Create an account'}
            </a>
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
