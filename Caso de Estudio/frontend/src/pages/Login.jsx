import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'

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
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Box component="form" onSubmit={onSubmit} sx={{ display:'grid', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Iniciar sesión</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField type="email" label="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required fullWidth />
        <TextField type="password" label="Contraseña" value={password} onChange={(e)=>setPassword(e.target.value)} required fullWidth />
        <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar'}</Button>
      </Box>
    </Container>
  )
}

export default Login
