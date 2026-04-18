import { Routes, Route } from 'react-router-dom'
import Landing from './Landing'
import SignIn from './SignIn'
import ProfileSetup from './ProfileSetup'
import RecipeReview from './RecipeReview'
import Confirmation from './Confirmation'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/profile" element={<ProfileSetup />} />
      <Route path="/review" element={<RecipeReview />} />
      <Route path="/confirmation" element={<Confirmation />} />
    </Routes>
  )
}

export default App