// src/App.jsx
/*
================================================================================
File Name : App.jsx
Author : Tahseen Raza
Created Date : 2026-06-10
Description : Main application component - handles routing and page navigation
              using singleton pattern for all page components
Company : Vaahan International
Copyright : (c) 2026 Vaahan International. All rights reserved.
================================================================================
*/

import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Category = lazy(() => import('./pages/Category'))
const Contact = lazy(() => import('./pages/Contact'))

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/category" element={<Category />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Suspense>
  )
}

export default App