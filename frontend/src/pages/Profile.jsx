import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const hasMfa = user?.mfa_enabled === true || user?.mfaEnabled === true

  return (
    <div style={{ padding: 20 }}>
      <h2>Perfil</h2>
      <ul>
        <li>ID: {user?.id}</li>
        <li>Email: {user?.email}</li>
        <li>Tienda: {user?.tienda_id ?? '-'}</li>
        <li>Roles: {(user?.roles || []).join(', ')}</li>
        <li>MFA: {hasMfa ? 'Activado' : 'No activado'}</li>
      </ul>
      {!hasMfa && <button onClick={()=>navigate('/enable-mfa')}>Habilitar MFA</button>}
    </div>
  )
}

export default Profile
