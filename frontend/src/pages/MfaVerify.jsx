import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { verifyMfa } from '../services/auth.js'

function MfaVerify() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [email, setEmail] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { setToken, setUser } = useAuth()

  const mfaToken = location.state?.mfaToken

  useEffect(() => {
    setEmail(location.state?.email || '')
  }, [location.state])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    try {
      const data = await verifyMfa(mfaToken, code)
      if (data?.token && data?.user) {
        setToken(data.token)
        setUser(data.user)
        navigate('/dashboard', { replace: true })
      } else {
        setError('Respuesta de verificación inesperada.')
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error de verificación MFA'
      setError(msg)
      if (/intento/i.test(msg)) {
        setInfo('Revisa el código. Si agotas los intentos, deberás iniciar sesión nuevamente.')
      }
    }
  }

  if (!mfaToken) {
    return (
      <div style={{ maxWidth: 420, margin: '40px auto' }}>
        <h2>Verificación MFA</h2>
        <p>Falta el token temporal de MFA. Inicia sesión nuevamente.</p>
        <button onClick={() => navigate('/login')}>Volver a Login</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Verificación MFA</h2>
      {email && <p>Cuenta: {email}</p>}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          placeholder="Código de 6 dígitos"
          value={code}
          onChange={(e)=>setCode(e.target.value)}
          required
        />
        <button type="submit">Verificar</button>
      </form>
      {error && <p style={{ color:'crimson' }}>{error}</p>}
      {info && <p style={{ color:'#555' }}>{info}</p>}
    </div>
  )
}

export default MfaVerify
