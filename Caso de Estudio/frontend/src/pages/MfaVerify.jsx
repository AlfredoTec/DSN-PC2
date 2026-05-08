import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { verifyMfa } from '../services/auth.js'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'

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
        setUser({ ...data.user, mfa_enabled: true, mfaEnabled: true, mfa_habilitado: true })
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
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Verificación MFA</Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>Falta el token temporal de MFA. Inicia sesión nuevamente.</Alert>
        <Button variant="contained" onClick={() => navigate('/login')}>Volver a Login</Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Verificación MFA</Typography>
      {email && <Typography variant="body2" sx={{ mb: 2 }}>Cuenta: {email}</Typography>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {info && <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert>}
      <Box component="form" onSubmit={onSubmit} sx={{ display:'grid', gap: 2 }}>
        <TextField
          type="text"
          inputMode="numeric"
          pattern="\\d{6}"
          inputProps={{ maxLength: 6 }}
          label="Código de 6 dígitos"
          value={code}
          onChange={(e)=>setCode(e.target.value)}
          required
          fullWidth
        />
        <Button type="submit" variant="contained">Verificar</Button>
      </Box>
    </Container>
  )
}

export default MfaVerify
