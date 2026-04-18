import { useState } from 'react'
import SignIn from './SignIn'
import ProfileSetup from './ProfileSetup'
import Landing from './Landing'
import './App.css'

function App() {
  const [page, setPage] = useState('landing')

  if (page === 'signin') return <SignIn onNavigate={setPage} />
  if (page === 'profile') return <ProfileSetup onNavigate={setPage} />

  return <Landing onNavigate={setPage} />
}

export default App