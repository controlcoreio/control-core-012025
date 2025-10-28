import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { SignupPage } from './pages/SignupPage'
import { DownloadPackagesPage } from './pages/DownloadPackagesPage'
import { PlanSelectionPage } from './pages/PlanSelectionPage'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<SignupPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/plans" element={<PlanSelectionPage />} />
        <Route path="/downloads" element={<DownloadPackagesPage />} />
      </Routes>
      <Toaster />
    </div>
  )
}

export default App
