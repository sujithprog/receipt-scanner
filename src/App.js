// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import MainHub from './components/layout/MainHub';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ReceiptScanner from './components/receiptScanner/ReceiptScanner';
import ReceiptDetail from './components/receiptScanner/ReceiptDetail';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <MainHub />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/receipt-scanner" 
            element={
              <ProtectedRoute>
                <ReceiptScanner />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/receipt/:id" 
            element={
              <ProtectedRoute>
                <ReceiptDetail />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;