import { Routes, Route } from 'react-router-dom'
import Landing from './Landing'
import SignIn from './SignIn'
import ProfileSetup from './ProfileSetup'
import RecipeReview from './RecipeReview'
import Confirmation from './Confirmation'
import ImageUpload from './ImageUpload'
import Dashboard from './Dashboard'
import IngredientInput from './IngredientInput'
import Inventory from './Inventory'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/profile" element={<ProfileSetup />} />
      <Route path="/scan" element={<ImageUpload />} />
      <Route path="/review" element={<RecipeReview />} />
      <Route path="/confirmation" element={<Confirmation />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/ingredients" element={<IngredientInput />} />
      <Route path="/inventory" element={<Inventory />} />
    </Routes>
  )
}

export default App
