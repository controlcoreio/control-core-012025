import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import StripeCRMDashboard from './components/StripeCRMDashboard'
import BillingDashboard from './components/BillingDashboard'
import CustomerOverview from './components/CustomerOverview'
import DevOpsDashboard from './components/DevOpsDashboard'
import SystemHealth from './components/SystemHealth'
import TelemetryBilling from './components/TelemetryBilling'
import ChangeManagement from './components/ChangeManagement'
import DataRetention from './components/DataRetention'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stripe-crm" element={<StripeCRMDashboard />} />
          <Route path="/billing" element={<BillingDashboard />} />
          <Route path="/customers" element={<CustomerOverview />} />
          <Route path="/devops" element={<DevOpsDashboard />} />
          <Route path="/system-health" element={<SystemHealth />} />
          <Route path="/telemetry" element={<TelemetryBilling />} />
          <Route path="/change-management" element={<ChangeManagement />} />
          <Route path="/data-retention" element={<DataRetention />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
