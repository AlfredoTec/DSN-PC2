import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Navbar() {
  const { user, logout } = useAuth()
  const roles = user?.roles || []
  const location = useLocation()

  const hasRole = (r) => roles.includes(r)

  return (
    <nav style={{ display: 'flex', gap: '12px', padding: '10px', borderBottom: '1px solid #ddd', alignItems: 'center' }}>
      <Link to="/dashboard">Dashboard</Link>

      {(hasRole('Admin') || hasRole('Gerente') || hasRole('Empleado') || hasRole('Auditor')) && (
        <Link to="/products">Productos</Link>
      )}

      {hasRole('Admin') && <Link to="/roles">Roles</Link>}

      {(hasRole('Admin') || hasRole('Gerente')) && <Link to="/users">Usuarios</Link>}

      <span style={{ marginLeft: 'auto', color: '#555' }}>
        {user?.email} | Tienda: {user?.tienda_id ?? '-'} | Roles: {roles.join(', ')}
      </span>
      <Link to="/profile">Perfil</Link>
      <button onClick={logout} style={{ padding: '6px 10px' }}>Salir</button>
    </nav>
  )
}

export default Navbar
