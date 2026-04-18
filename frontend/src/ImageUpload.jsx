import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, auth } from './firebase'
import { collection, getDocs, query, orderBy, doc, setDoc } from 'firebase/firestore'

const ANALYZE_URL = 'http://localhost:8000/analyze-image'
const RECIPE_URL = 'http://localhost:8000/generate-recipes' // swap when teammate is ready

const CATEGORIES = ['Produce', 'Dairy', 'Protein', 'Pantry', 'Beverage', 'Snack', 'Other']

export default function ImageUpload() {
  const navigate = useNavigate()
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setInventory(null)
    setError(null)
  }

  async function handleAnalyze() {
    if (!image) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('image', image)
      const response = await fetch(ANALYZE_URL, { method: 'POST', body: formData })
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()
      setInventory(data.inventory)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleItemChange(index, field, value) {
    setInventory(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: field === 'count' ? parseInt(value) || 1 : value } : item
    ))
  }

  function handleRemoveItem(index) {
    setInventory(prev => prev.filter((_, i) => i !== index))
  }

  function handleAddItem() {
    setInventory(prev => [...prev, { item_name: '', category: 'Other', count: 1 }])
  }

  async function handleConfirm() {
    if (!inventory || inventory.length === 0) return
    const uid = auth.currentUser?.uid
    let liked_recipes = []
    let disliked_recipes = []

    if (uid) {
      await setDoc(doc(db, 'users', uid), {
        inventory,
        inventoryUpdatedAt: new Date(),
      }, { merge: true })

      const snap = await getDocs(query(collection(db, 'users', uid, 'recipes'), orderBy('savedAt', 'desc')))
      const saved = snap.docs.map(d => d.data()).filter(r => r.rating)
      liked_recipes = saved.filter(r => r.rating >= 4).slice(0, 3).map(r => r.title)
      disliked_recipes = saved.filter(r => r.rating <= 2).slice(0, 3).map(r => r.title)
    }

    try {
      const response = await fetch(RECIPE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory, liked_recipes, disliked_recipes })
      })
      if (!response.ok) throw new Error(`Recipe API error: ${response.status}`)
      const data = await response.json()

      navigate('/confirmation', { state: { recipes: data, inventory } })
    } catch (err) {
      alert('Inventory saved! Recipe generation failed: ' + err.message)
    }
  }

  return (
    <div>
      <button onClick={() => navigate('/')} style={{ marginBottom: 16 }}>← Back</button>
      <h2>Scan Your Food</h2>

      <input type="file" accept="image/*" onChange={handleFileChange} />

      {preview && (
        <img src={preview} alt="Preview" style={{ maxWidth: 300, marginTop: 12, display: 'block' }} />
      )}

      {image && (
        <button onClick={handleAnalyze} disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Analyzing...' : 'Analyze Image'}
        </button>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {inventory && (
        <div>
          <h3>Review Detected Items</h3>
          <p>Edit, remove, or add items before confirming.</p>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Count</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, i) => (
                <tr key={i}>
                  <td>
                    <input
                      value={item.item_name}
                      onChange={e => handleItemChange(i, 'item_name', e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      value={item.category}
                      onChange={e => handleItemChange(i, 'category', e.target.value)}
                    >
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.count}
                      onChange={e => handleItemChange(i, 'count', e.target.value)}
                      style={{ width: 60 }}
                    />
                  </td>
                  <td>
                    <button onClick={() => handleRemoveItem(i)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={handleAddItem} style={{ marginTop: 8 }}>+ Add Item</button>
          <br />
          <button onClick={handleConfirm} style={{ marginTop: 8 }}>
            Confirm & Generate Recipes
          </button>
        </div>
      )}
    </div>
  )
}
