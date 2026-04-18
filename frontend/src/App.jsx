import Demo from './demo.jsx';
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import RecipeReview from './RecipeReview.jsx';
import { Routes, Route } from "react-router-dom";
import Confirmation from "./Confirmation.jsx";



function App() {
  return (
    <Routes>
      <Route path="/" element={<RecipeReview />} />
      <Route path="/confirmation" element={<Confirmation />} />
    </Routes>
  );
}

export default App
