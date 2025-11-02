import { useState } from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom';
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ProtectedRoute from './ProtectedRoute';
import CustomerQueries from "./pages/CustomerQueries"
import { SidebarProvider } from "./context/SidebarContext";
import { OrdersProvider } from './context/OrdersContext';

import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Users from './pages/Users';
import Orders from './pages/Orders';

function App() {

  return (
    <SidebarProvider>
      <OrdersProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/queries" element={<ProtectedRoute><CustomerQueries /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        </Routes>
      </OrdersProvider>
    </SidebarProvider>
  )
}

export default App