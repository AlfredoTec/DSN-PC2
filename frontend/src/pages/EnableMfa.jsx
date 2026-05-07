import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { enableMfa, verifyMfaSetup } from '../services/auth.js'

function EnableMfa() {
  const [qr, setQr] = useState('')
  const [otpauth, setOtpauth] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

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
      if (data?.success) {
        setStatus('MFA activado correctamente.')
        setTimeout(() => navigate('/dashboard', { replace: true }), 1000)
      } else {
        setError('Respuesta inesperada al verificar MFA.')
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Código inválido')
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '40px auto' }}>
      <h2>Habilitar MFA</h2>
      <button onClick={handleGenerate}>Generar secreto</button>
      {qr && (
        <div style={{ marginTop: 16 }}>
          <img src={qr} alt="QR MFA" />
          {otpauth && <p><small>{otpauth}</small></p>}
          {/* Crítico: validamos el setup contra el backend antes de marcar MFA como activo */}
          <form onSubmit={handleVerify} style={{ display:'grid', gap:10, marginTop: 10 }}>
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
            <button type="submit">Confirmar</button>
          </form>
        </div>
      )}
      {status && <p style={{ color:'green' }}>{status}</p>}
      {error && <p style={{ color:'crimson' }}>{error}</p>}
    </div>
  )
}

export default EnableMfa
