// Ruta protegida por autenticación
// Redirige a /login guardando la ruta de origen para volver tras autenticarse
import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute() {
  const { token } = useAuth()
  const location = useLocation()

  // Critical: block access if no valid session; send user back to login preserving intended path.
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

export default ProtectedRoute
