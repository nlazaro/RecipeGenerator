import { useState, useEffect } from 'react'
import './App.css'
import { auth, googleProvider, db } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc } from 'firebase/firestore'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return unsubscribe
  }, [])

  async function handleSignIn() {
    await signInWithPopup(auth, googleProvider)
  }

  async function handleSignOut() {
    await signOut(auth)
  }

  async function addTestRecipe() {
    const docRef = await addDoc(collection(db, 'recipes'), {
      title: 'Test Pasta',
      ingredients: ['pasta', 'tomato sauce', 'basil'],
      instructions: 'Boil pasta, add sauce, serve.',
      createdAt: new Date(),
      uid: user.uid
    })
    console.log('Recipe added with ID:', docRef.id)
    alert('Recipe added! Check Firebase console.')
  }

  return (
    <div>
      {user ? (
        <>
          <p>Logged in as {user.displayName} ({user.email})</p>
          <button onClick={handleSignOut}>Sign Out</button>
          <button onClick={addTestRecipe}>Add Test Recipe</button>
        </>
      ) : (
        <button onClick={handleSignIn}>Sign in with Google</button>
      )}
    </div>
  )
}

export default App
