import { useState, useEffect } from 'react'
import './App.css'
import { auth, googleProvider } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import ImageUpload from './ImageUpload'

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

  return (
    <div>
      {user ? (
        <>
          <p>Logged in as {user.displayName} ({user.email})</p>
          <button onClick={handleSignOut}>Sign Out</button>
          <ImageUpload />
        </>
      ) : (
        <button onClick={handleSignIn}>Sign in with Google</button>
      )}
    </div>
  )
}

export default App
