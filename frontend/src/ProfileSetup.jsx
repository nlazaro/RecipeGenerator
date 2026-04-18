import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProfileSetup.css'
import { db, auth } from './firebase'
import { doc, setDoc } from 'firebase/firestore'

/* ── Data ─────────────────────────────────────────────────── */

const GOALS = [
  '💪 Build muscle',
  '⚖️ Lose weight',
  '🌱 Eat more plants',
  '⚡ Boost energy',
  '🍽️ Cook better meals',
  '🧘 Manage stress',
  '🕐 Save time cooking',
]

const DIETARY = [
  '🥩 No restrictions',
  '🥗 Vegetarian',
  '🌿 Vegan',
  '🌾 Gluten-free',
  '🧀 Dairy-free',
  '🥑 Keto',
  '🍚 Low carb',
  '🫀 Heart healthy',
]

const ALLERGIES = [
  '🥜 Tree nuts',
  '🦐 Shellfish',
  '🥛 Dairy',
  '🌾 Gluten',
  '🥚 Eggs',
  '🐟 Fish',
  '🫘 Soy',
  'None of the above',
]

const COOK_TIMES = [
  '⚡ Under 15 minutes',
  '🕐 15–30 minutes',
  '🍳 30–60 minutes',
  '👨‍🍳 No limit, I love cooking',
]

const ADVENTUROUSNESS = [
  '😌 Keep it simple and familiar',
  '🌍 Mix it up sometimes',
  '🧪 Surprise me, I\'ll try anything',
]

const COOKING_FOR = [
  '🙋 Just me',
  '👫 Me + one other',
  '👨‍👩‍👧 Small family (3–4)',
  '🏠 A crowd (5+)',
]

const TOTAL_STEPS = 6

/* ── Helper components ────────────────────────────────────── */

function OptionRow({ label, selected, onClick, variant }) {
  return (
    <button
      type="button"
      className={`ps-option-row${selected ? (variant === 'allergy' ? ' ps-option-row--allergy' : ' ps-option-row--selected') : ''}`}
      onClick={onClick}
    >
      <span className="ps-option-label">{label}</span>
      {selected && <span className="ps-option-check">✓</span>}
    </button>
  )
}

function SummaryChip({ label, variant }) {
  return (
    <span className={`ps-summary-chip ps-summary-chip--${variant}`}>{label}</span>
  )
}

/* ── Main component ───────────────────────────────────────── */

function ProfileSetup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    name: '',
    goals: [],
    dietary: [],
    allergies: [],
    cookTime: '',
    adventurousness: '',
    cookingFor: '',
  })

  /* ── Toggle helpers ── */
  function toggleMulti(key, value, max) {
    setProfile(prev => {
      const arr = prev[key]
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter(v => v !== value) }
      }
      if (max && arr.length >= max) return prev
      return { ...prev, [key]: [...arr, value] }
    })
  }

  function toggleAllergy(value) {
    const NONE = 'None of the above'
    setProfile(prev => {
      if (value === NONE) {
        // selecting "none" clears all others
        return { ...prev, allergies: prev.allergies.includes(NONE) ? [] : [NONE] }
      }
      // selecting a real allergy clears "none"
      const filtered = prev.allergies.filter(v => v !== NONE)
      if (filtered.includes(value)) {
        return { ...prev, allergies: filtered.filter(v => v !== value) }
      }
      return { ...prev, allergies: [...filtered, value] }
    })
  }

  function setSingle(key, value) {
    setProfile(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }))
  }

  /* ── Validation ── */
  const nextDisabled = (() => {
    if (step === 1) return profile.name.trim() === ''
    if (step === 2) return profile.goals.length === 0
    if (step === 3) return profile.dietary.length === 0
    if (step === 4) return profile.allergies.length === 0
    if (step === 5) return !profile.cookTime || !profile.adventurousness || !profile.cookingFor
    return false
  })()

  /* ── Progress ── */
  const progressPct = Math.round((step / TOTAL_STEPS) * 100)

  /* ── Navigation ── */
  function handleNext() {
    if (step < TOTAL_STEPS) setStep(s => s + 1)
  }

  function handleBack() {
    if (step > 1) setStep(s => s - 1)
  }

  /* ── Render helpers ── */
  const firstName = profile.name.trim().split(' ')[0] || profile.name.trim()

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div className="ps-step">
            <h2 className="ps-heading">What should we call you?</h2>
            <p className="ps-subheading">We'll personalise your experience from the start.</p>
            <div className="ps-field">
              <label htmlFor="ps-name">First Name</label>
              <input
                id="ps-name"
                type="text"
                placeholder="Your first name"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                autoFocus
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="ps-step">
            <h2 className="ps-heading">Thanks {firstName}! What are your goals?</h2>
            <p className="ps-subheading">Select up to 3 that matter most to you.</p>
            <div className="ps-options-list">
              {GOALS.map(g => (
                <OptionRow
                  key={g}
                  label={g}
                  selected={profile.goals.includes(g)}
                  onClick={() => toggleMulti('goals', g, 3)}
                />
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="ps-step">
            <h2 className="ps-heading">Any dietary preferences?</h2>
            <p className="ps-subheading">Select everything that applies. These shape every recipe suggestion.</p>
            <div className="ps-options-list">
              {DIETARY.map(d => (
                <OptionRow
                  key={d}
                  label={d}
                  selected={profile.dietary.includes(d)}
                  onClick={() => toggleMulti('dietary', d)}
                />
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="ps-step">
            <h2 className="ps-heading">Any allergies?</h2>
            <p className="ps-subheading">These are hard filters — these ingredients will never appear in your recipes.</p>
            <div className="ps-options-list">
              {ALLERGIES.map(a => (
                <OptionRow
                  key={a}
                  label={a}
                  selected={profile.allergies.includes(a)}
                  onClick={() => toggleAllergy(a)}
                  variant="allergy"
                />
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="ps-step">
            <div className="ps-sub-question">
              <h3 className="ps-sub-heading">⏱ How much time do you have to cook?</h3>
              <div className="ps-options-list">
                {COOK_TIMES.map(t => (
                  <OptionRow
                    key={t}
                    label={t}
                    selected={profile.cookTime === t}
                    onClick={() => setSingle('cookTime', t)}
                  />
                ))}
              </div>
            </div>

            <div className="ps-sub-question">
              <h3 className="ps-sub-heading">🌶️ How adventurous are you?</h3>
              <div className="ps-options-list">
                {ADVENTUROUSNESS.map(a => (
                  <OptionRow
                    key={a}
                    label={a}
                    selected={profile.adventurousness === a}
                    onClick={() => setSingle('adventurousness', a)}
                  />
                ))}
              </div>
            </div>

            <div className="ps-sub-question">
              <h3 className="ps-sub-heading">👥 Who are you usually cooking for?</h3>
              <div className="ps-options-list">
                {COOKING_FOR.map(c => (
                  <OptionRow
                    key={c}
                    label={c}
                    selected={profile.cookingFor === c}
                    onClick={() => setSingle('cookingFor', c)}
                  />
                ))}
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="ps-step ps-step--completion">
            <div className="ps-completion-icon">🌿</div>
            <h2 className="ps-completion-heading">You're all set, {firstName}!</h2>
            <p className="ps-completion-sub">
              Your profile is ready. RecipeGen will now generate recipes built entirely around you.
            </p>

            <div className="ps-summary-card">
              {profile.goals.length > 0 && (
                <div className="ps-summary-row">
                  <span className="ps-summary-label">Goals</span>
                  <div className="ps-summary-chips">
                    {profile.goals.map(g => (
                      <SummaryChip key={g} label={g} variant="green" />
                    ))}
                  </div>
                </div>
              )}
              {profile.dietary.length > 0 && (
                <div className="ps-summary-row">
                  <span className="ps-summary-label">Diet</span>
                  <div className="ps-summary-chips">
                    {profile.dietary.map(d => (
                      <SummaryChip key={d} label={d} variant="teal" />
                    ))}
                  </div>
                </div>
              )}
              {profile.allergies.length > 0 && (
                <div className="ps-summary-row">
                  <span className="ps-summary-label">Allergies</span>
                  <div className="ps-summary-chips">
                    {profile.allergies.map(a => (
                      <SummaryChip key={a} label={a} variant="red" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              className="ps-cta-btn"
              disabled={saving}
              onClick={async () => {
                const uid = auth.currentUser?.uid
                if (uid) {
                  setSaving(true)
                  await setDoc(doc(db, 'users', uid), {
                    name: profile.name,
                    goals: profile.goals,
                    dietary: profile.dietary,
                    allergies: profile.allergies,
                    cookTime: profile.cookTime,
                    adventurousness: profile.adventurousness,
                    cookingFor: profile.cookingFor,
                    profileCompletedAt: new Date(),
                  }, { merge: true })
                  setSaving(false)
                }
                navigate('/')
              }}
            >
              {saving ? 'Saving...' : 'Start Cooking →'}
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="ps-page">
      {/* Ambient blobs — reuse si-blob classes */}
      <div className="si-blob si-blob-tl"></div>
      <div className="si-blob si-blob-br"></div>

      <main className="ps-main">
        {/* Brand */}
        <div className="ps-brand" onClick={() => navigate('/')}>
          <span>🌿</span>
          <span>RecipeGen</span>
        </div>

        {/* Card */}
        <div className={`ps-card${step === 6 ? ' ps-card--completion' : ''}`}>

          {/* Progress bar — sits at the very top of the card */}
          <div className="ps-progress-track">
            <div
              className="ps-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Step counter */}
          {step < 6 && (
            <div className="ps-step-counter">Step {step} of {TOTAL_STEPS - 1}</div>
          )}

          {/* Step content */}
          <div className="ps-card-body">
            {renderStep()}
          </div>

          {/* Navigation buttons */}
          {step < 6 && (
            <div className="ps-nav-btns">
              <button
                type="button"
                className={`ps-btn-back${step === 1 ? ' ps-btn-back--hidden' : ''}`}
                onClick={handleBack}
                tabIndex={step === 1 ? -1 : 0}
              >
                Back
              </button>
              <button
                type="button"
                className="ps-btn-next"
                onClick={handleNext}
                disabled={nextDisabled}
              >
                {step === 5 ? 'Finish' : 'Next'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ProfileSetup
