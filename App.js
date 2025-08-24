// src/App.js
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import StudentDashboard from './components/Dashboard/StudentDashboard'
import TeacherDashboard from './components/Dashboard/TeacherDashboard'
import ParentDashboard from './components/Dashboard/ParentDashboard'
import CanvasEditor from './components/Canvas/CanvasEditor'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/teacher" element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/parent" element={
              <ProtectedRoute requiredRole="parent">
                <ParentDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/canvas/:sectionId" element={
              <ProtectedRoute>
                <CanvasEditor />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
