import api from './api.js'

export async function login(email, password) {
  const { data } = await api.post('/api/auth/login', { email, password })
  return data
}

export async function enableMfa() {
  const { data } = await api.post('/api/auth/enable-mfa')
  return data
}

export async function verifyMfaSetup(code) {
  const { data } = await api.post('/api/auth/verify-mfa-setup', { code })
  return data
}

export async function verifyMfa(mfaToken, code) {
  const { data } = await api.post('/api/auth/verify-mfa', { mfaToken, code })
  return data
}

export async function disableMfa() {
  const { data } = await api.post('/api/auth/disable-mfa')
  return data
}
