import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { enableMfa, verifyMfaSetup } from '../services/auth.js'
import { useAuth } from '../context/AuthContext.jsx'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'

function EnableMfa() {
  const [qr, setQr] = useState('')
  const [otpauth, setOtpauth] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  const handleGenerate = async () => {
    setError('')
    setStatus('')
    try {
      const data = await enableMfa()
      setQr(data?.qrDataUrl || '')
      setOtpauth(data?.otpauth || '')
      setStatus('Escanea el QR en tu app TOTP y confirma con el código.')
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo generar el secreto MFA')
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setStatus('')
    try {
      const data = await verifyMfaSetup(code)
      // Backend responde 200 con { message: 'MFA habilitado correctamente' }
      if (data?.message) {
        setStatus(data.message || 'MFA habilitado correctamente')
        // Refresca el estado local del usuario para reflejar MFA activo
        if (user) setUser({ ...user, mfa_enabled: true, mfaEnabled: true, mfa_habilitado: true })
        setTimeout(() => navigate('/dashboard', { replace: true }), 1000)
      } else {
        setError('Respuesta inesperada al verificar MFA.')
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Código inválido')
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Habilitar MFA</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {status && <Alert severity="success" sx={{ mb: 2 }}>{status}</Alert>}
      <Button variant="contained" onClick={handleGenerate}>Generar secreto</Button>
      {qr && (
        <Box sx={{ mt: 2 }}>
          <img src={qr} alt="QR MFA" />
          {otpauth && <Typography variant="body2" sx={{ mt: 1 }}>{otpauth}</Typography>}
          <Box component="form" onSubmit={handleVerify} sx={{ display:'grid', gap: 2, mt: 2 }}>
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
            <Button type="submit" variant="contained">Confirmar</Button>
          </Box>
        </Box>
      )}
    </Container>
  )
}

export default EnableMfa
