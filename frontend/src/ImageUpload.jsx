import { useState } from 'react'
import { db, auth } from './firebase'
import { collection, addDoc } from 'firebase/firestore'

const API_URL = 'http://localhost:8000/analyze-image'

export default function ImageUpload() {
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

      const response = await fetch(API_URL, { method: 'POST', body: formData })
      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data = await response.json()
      setInventory(data.inventory)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveToFirestore() {
    if (!inventory) return
    const user = auth.currentUser
    await addDoc(collection(db, 'inventories'), {
      uid: user?.uid ?? null,
      items: inventory,
      createdAt: new Date()
    })
    alert('Inventory saved!')
  }

  return (
    <div>
      <h2>Scan Your Food</h2>

      <input type="file" accept="image/*" onChange={handleFileChange} />

      {preview && (
        <div>
          <img src={preview} alt="Preview" style={{ maxWidth: 300, marginTop: 12 }} />
        </div>
      )}

      {image && (
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Image'}
        </button>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {inventory && (
        <div>
          <h3>Detected Items</h3>
          <ul>
            {inventory.map((item, i) => (
              <li key={i}>
                {item.item_name} — {item.category} (x{item.count})
              </li>
            ))}
          </ul>
          <button onClick={handleSaveToFirestore}>Save to Firestore</button>
          <button onClick={() => alert('Recipe generation coming soon!')}>
            Generate Recipes
          </button>
        </div>
      )}
    </div>
  )
}
