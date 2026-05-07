import React from 'react'
import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div style={{ padding: 40 }}>
      <h2>404 - No encontrado</h2>
      <p>La página solicitada no existe.</p>
      <Link to="/dashboard">Volver al Dashboard</Link>
    </div>
  )
}

export default NotFound
