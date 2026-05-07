// Guard de roles (RBAC) a nivel de rutas de la SPA
// Si el usuario no posee alguno de los roles requeridos, redirige a /403
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function RoleGuard({ roles = [], children }) {
  const { user } = useAuth()
  const location = useLocation()
  const userRoles = user?.roles || []
  const allowed = roles.length === 0 || userRoles.some(r => roles.includes(r))

  // Critical: enforce role-based page access; otherwise send to 403.
  if (!allowed) {
    return <Navigate to="/403" replace state={{ from: location }} />
  }

  return children
}

export default RoleGuard
