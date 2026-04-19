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
  '❤️ Improve heart health',
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
  '🧂 Low sodium',
  '🩸 Diabetic-friendly',
]

const DIETARY_STYLES = [
  '🫒 Mediterranean',
  '🍜 Asian',
  '🌮 Latin / Mexican',
  '🍝 Italian',
  '🍔 American',
  '🧆 Middle Eastern',
  '🍣 Japanese',
  '🥘 Indian',
  '🫕 French',
  '🌍 African',
]

const ALLERGIES = [
  '🥜 Tree nuts',
  '🦐 Shellfish',
  '🥛 Dairy',
  '🌾 Gluten',
  '🥚 Eggs',
  '🐟 Fish',
  '🫘 Soy',
  '🥜 Peanuts',
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

const SKILL_LEVELS = [
  '🥄 Beginner — I follow recipes closely',
  '🍳 Home cook — comfortable with most recipes',
  '👨‍🍳 Experienced — I improvise often',
  '⭐ Chef-level — I create my own dishes',
]

const SEX_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

const TOTAL_STEPS = 9

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
    age: '',
    sex: '',
    heightFt: '',
    heightIn: '',
    weightLbs: '',
    goals: [],
    dietary: [],
    dietaryStyles: [],
    allergies: [],
    cookTime: '',
    adventurousness: '',
    cookingFor: '',
    skillLevel: '',
    medications: '',
    additionalNotes: '',
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
        return { ...prev, allergies: prev.allergies.includes(NONE) ? [] : [NONE] }
      }
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
    if (step === 2) {
      const ageNum = parseInt(profile.age, 10)
      return !profile.sex || !(ageNum >= 1 && ageNum <= 120)
    }
    if (step === 3) return profile.goals.length === 0
    if (step === 4) return profile.dietary.length === 0
    if (step === 5) return profile.dietaryStyles.length === 0
    if (step === 6) return profile.allergies.length === 0
    if (step === 7) return !profile.cookTime || !profile.adventurousness || !profile.cookingFor || !profile.skillLevel
    if (step === 8) return false
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
            <h2 className="ps-heading">A little about you, {firstName}</h2>
            <p className="ps-subheading">This helps us tailor portion sizes and nutritional guidance. Height and weight are optional.</p>

            <div className="ps-fields-row">
              <div className="ps-field">
                <label htmlFor="ps-age">Age <span className="ps-required">*</span></label>
                <input
                  id="ps-age"
                  type="number"
                  placeholder="e.g. 28"
                  min="1"
                  max="120"
                  value={profile.age}
                  onChange={e => setProfile(p => ({ ...p, age: e.target.value }))}
                />
              </div>
            </div>

            <div className="ps-field ps-field--gap">
              <label>Biological Sex <span className="ps-required">*</span></label>
              <div className="ps-sex-grid">
                {SEX_OPTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`ps-sex-btn${profile.sex === s ? ' ps-sex-btn--selected' : ''}`}
                    onClick={() => setSingle('sex', s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="ps-field ps-field--gap">
              <label>Height <span className="ps-optional">(optional)</span></label>
              <div className="ps-unit-row">
                <div className="ps-unit-input">
                  <input
                    type="number"
                    placeholder="ft"
                    min="0"
                    max="9"
                    value={profile.heightFt}
                    onChange={e => setProfile(p => ({ ...p, heightFt: e.target.value }))}
                  />
                  <span className="ps-unit-label">ft</span>
                </div>
                <div className="ps-unit-input">
                  <input
                    type="number"
                    placeholder="in"
                    min="0"
                    max="11"
                    value={profile.heightIn}
                    onChange={e => setProfile(p => ({ ...p, heightIn: e.target.value }))}
                  />
                  <span className="ps-unit-label">in</span>
                </div>
              </div>
            </div>

            <div className="ps-field ps-field--gap">
              <label>Weight <span className="ps-optional">(optional)</span></label>
              <div className="ps-unit-row">
                <div className="ps-unit-input ps-unit-input--wide">
                  <input
                    type="number"
                    placeholder="e.g. 160"
                    min="0"
                    value={profile.weightLbs}
                    onChange={e => setProfile(p => ({ ...p, weightLbs: e.target.value }))}
                  />
                  <span className="ps-unit-label">lbs</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="ps-step">
            <h2 className="ps-heading">What are your health goals?</h2>
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

      case 4:
        return (
          <div className="ps-step">
            <h2 className="ps-heading">Any dietary restrictions?</h2>
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

      case 5:
        return (
          <div className="ps-step">
            <h2 className="ps-heading">What cuisines do you love?</h2>
            <p className="ps-subheading">Pick your favourite culinary styles. We'll lean into these when generating recipes.</p>
            <div className="ps-options-list">
              {DIETARY_STYLES.map(s => (
                <OptionRow
                  key={s}
                  label={s}
                  selected={profile.dietaryStyles.includes(s)}
                  onClick={() => toggleMulti('dietaryStyles', s)}
                />
              ))}
            </div>
          </div>
        )

      case 6:
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

      case 7:
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

            <div className="ps-sub-question">
              <h3 className="ps-sub-heading">🔪 What's your cooking skill level?</h3>
              <div className="ps-options-list">
                {SKILL_LEVELS.map(s => (
                  <OptionRow
                    key={s}
                    label={s}
                    selected={profile.skillLevel === s}
                    onClick={() => setSingle('skillLevel', s)}
                  />
                ))}
              </div>
            </div>
          </div>
        )

      case 8:
        return (
          <div className="ps-step">
            <h2 className="ps-heading">Anything else we should know?</h2>
            <p className="ps-subheading">Both fields are optional, but help us give you safer, more personalised recipes.</p>

            <div className="ps-field">
              <label htmlFor="ps-meds">Current Medications <span className="ps-optional">(optional)</span></label>
              <textarea
                id="ps-meds"
                className="ps-textarea"
                placeholder="e.g. blood thinners, metformin, statins…"
                rows={3}
                value={profile.medications}
                onChange={e => setProfile(p => ({ ...p, medications: e.target.value }))}
              />
              <p className="ps-field-hint">Some foods interact with medications — we'll flag these where possible.</p>
            </div>

            <div className="ps-field ps-field--gap">
              <label htmlFor="ps-notes">Additional Notes <span className="ps-optional">(optional)</span></label>
              <textarea
                id="ps-notes"
                className="ps-textarea"
                placeholder="Anything else — health conditions, intolerances, taste preferences, dislikes…"
                rows={4}
                value={profile.additionalNotes}
                onChange={e => setProfile(p => ({ ...p, additionalNotes: e.target.value }))}
              />
            </div>
          </div>
        )

      case 9:
        return (
          <div className="ps-step ps-step--completion">
            <div className="ps-completion-icon">🌿</div>
            <h2 className="ps-completion-heading">You're all set, {firstName}!</h2>
            <p className="ps-completion-sub">
              Your health profile is ready. RecipeGen will now generate recipes built entirely around you.
            </p>

            <div className="ps-summary-card">
              {(profile.age || profile.sex) && (
                <div className="ps-summary-row">
                  <span className="ps-summary-label">Profile</span>
                  <div className="ps-summary-chips">
                    {profile.age && <SummaryChip label={`Age ${profile.age}`} variant="green" />}
                    {profile.sex && <SummaryChip label={profile.sex} variant="green" />}
                    {profile.weightLbs && <SummaryChip label={`${profile.weightLbs} lbs`} variant="green" />}
                  </div>
                </div>
              )}
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
                  <span className="ps-summary-label">Restrictions</span>
                  <div className="ps-summary-chips">
                    {profile.dietary.map(d => (
                      <SummaryChip key={d} label={d} variant="teal" />
                    ))}
                  </div>
                </div>
              )}
              {profile.dietaryStyles.length > 0 && (
                <div className="ps-summary-row">
                  <span className="ps-summary-label">Cuisines</span>
                  <div className="ps-summary-chips">
                    {profile.dietaryStyles.map(s => (
                      <SummaryChip key={s} label={s} variant="teal" />
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
              {profile.medications && (
                <div className="ps-summary-row">
                  <span className="ps-summary-label">Medications noted</span>
                  <div className="ps-summary-chips">
                    <SummaryChip label="✓ On file" variant="green" />
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
                    age: profile.age,
                    sex: profile.sex,
                    heightFt: profile.heightFt,
                    heightIn: profile.heightIn,
                    weightLbs: profile.weightLbs,
                    goals: profile.goals,
                    dietary: profile.dietary,
                    dietaryStyles: profile.dietaryStyles,
                    allergies: profile.allergies,
                    cookTime: profile.cookTime,
                    adventurousness: profile.adventurousness,
                    cookingFor: profile.cookingFor,
                    skillLevel: profile.skillLevel,
                    medications: profile.medications,
                    additionalNotes: profile.additionalNotes,
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
      <div className="si-blob si-blob-tl"></div>
      <div className="si-blob si-blob-br"></div>

      <main className="ps-main">
        <div className="ps-brand" onClick={() => navigate('/')}>
          <span>🌿</span>
          <span>RecipeGen</span>
        </div>

        <div className={`ps-card${step === 9 ? ' ps-card--completion' : ''}`}>

          <div className="ps-progress-track">
            <div
              className="ps-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {step < 9 && (
            <div className="ps-step-counter">Step {step} of {TOTAL_STEPS - 1}</div>
          )}

          <div className="ps-card-body">
            {renderStep()}
          </div>

          {step < 9 && (
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
                {step === 8 ? 'Finish' : 'Next'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ProfileSetup
