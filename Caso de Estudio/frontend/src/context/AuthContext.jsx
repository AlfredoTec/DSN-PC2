import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authService from '../services/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem('authToken') || '')
  const [user, setUserState] = useState(() => {
    const raw = localStorage.getItem('authUser')
    return raw ? JSON.parse(raw) : null
  })
  const navigate = useNavigate()

  // Crítico: persistimos token/usuario en localStorage para continuidad de sesión.
  // Aviso: localStorage es accesible por JS; no guardar secretos sensibles. JWT está permitido por el alcance del proyecto.
  useEffect(() => {
    if (token) localStorage.setItem('authToken', token)
    else localStorage.removeItem('authToken')
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('authUser', JSON.stringify(user))
    else localStorage.removeItem('authUser')
  }, [user])

  const setToken = (t) => setTokenState(t)
  const setUser = (u) => setUserState(u)

  // Crítico: login devuelve el resultado; si el backend indica mfaRequired NO se debe persistir la sesión aquí.
  const login = async (email, password) => {
    const res = await authService.login(email, password)
    // Delegate navigation to callers to keep context side-effect free.
    return res
  }

  const logout = () => {
    setTokenState('')
    setUserState(null)
    // UX: forzamos navegación a /login al cerrar sesión.
    navigate('/login', { replace: true })
  }

  const value = { token, user, setToken, setUser, login, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
