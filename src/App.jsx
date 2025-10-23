import { useState } from 'react'
import './App.css'
import LoginPage from './pages/LoginPage'
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ProtectedRoute from './ProtectedRoute';
import AdminResetLogs from './pages/AdminResetLogs';


function App() {

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
      <Route path="/admin/reset-logs" element={<AdminResetLogs />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  )
}

export default App
