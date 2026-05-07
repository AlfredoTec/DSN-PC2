import React from 'react'
import { Link } from 'react-router-dom'

function AccessDenied() {
  return (
    <div style={{ padding: 40 }}>
      <h2>403 - Acceso denegado</h2>
      <p>No tienes permisos para acceder a este recurso.</p>
      <Link to="/dashboard">Volver al Dashboard</Link>
    </div>
  )
}

export default AccessDenied
