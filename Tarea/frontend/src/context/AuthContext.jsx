import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [roles, setRoles] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) {
      setRoles([]);
      setUser(null);
      return;
    }
    try {
      const payload = jwtDecode(token);
      setRoles(payload.roles || []);
      setUser({
        id: payload.sub ?? payload.id,
        email: payload.email,
        tiendaId: payload.tiendaId ?? payload.tienda_id,
        roles: payload.roles || [],
      });
    } catch (e) {
      setRoles([]);
      setUser(null);
    }
  }, [token]);

  // Enrich user with profile info from API
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const baseURL = import.meta.env.VITE_API_BASE || '/api';
        const i = axios.create({ baseURL, headers: { Authorization: `Bearer ${token}` } });
        const { data } = await i.get('/auth/me');
        if (!cancelled) {
          setUser((u) => ({
            ...(u || {}),
            nombreCompleto: data.nombreCompleto,
            tiendaId: data.tienda?.id || (u?.tiendaId),
            tiendaNombre: data.tienda?.nombre,
            roles: Array.isArray(data.roles) && data.roles.length ? data.roles : (u?.roles || []),
          }));
          setRoles((r) => (Array.isArray(data.roles) && data.roles.length ? data.roles : r));
        }
      } catch (_) {
        // ignore profile fetch errors
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const api = useMemo(() => {
    const baseURL = import.meta.env.VITE_API_BASE || '/api';
    const i = axios.create({ baseURL });
    i.interceptors.request.use((config) => {
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return i;
  }, [token]);

  function login(newToken) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
  }

  const value = { token, login, logout, roles, user, api };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
