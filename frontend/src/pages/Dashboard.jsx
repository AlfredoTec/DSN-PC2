import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Dashboard() {
  const { user } = useAuth()
  const roles = user?.roles || []
  const has = (r) => roles.includes(r)

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>
      <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
        {(has('Admin') || has('Gerente') || has('Empleado') || has('Auditor')) && (
          <Card title="Productos" to="/products" />
        )}
        {has('Admin') && <Card title="Roles" to="/roles" />}
        {(has('Admin') || has('Gerente')) && <Card title="Usuarios" to="/users" />}
        <Card title="Perfil" to="/profile" />
        <Card title="Habilitar MFA" to="/enable-mfa" />
      </div>
    </div>
  )
}

function Card({ title, to }) {
  return (
    <Link to={to} style={{ border:'1px solid #ddd', padding:16, width:180, textAlign:'center', textDecoration:'none' }}>
      {title}
    </Link>
  )
}

export default Dashboard
