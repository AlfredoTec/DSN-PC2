import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, setToken, setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      if (data?.mfaRequired && data?.mfaToken) {
        // MFA required: do not persist session, forward to MFA step with one-time mfaToken.
        navigate('/mfa', { state: { mfaToken: data.mfaToken, email } })
      } else if (data?.token && data?.user) {
        setToken(data.token)
        setUser(data.user)
        navigate(from, { replace: true })
      } else {
        setError('Respuesta de autenticación inesperada.')
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error de inicio de sesión'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
      </form>
      {error && <p style={{ color:'crimson' }}>{error}</p>}
    </div>
  )
}

export default Login
