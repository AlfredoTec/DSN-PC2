import React, { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import * as storesApi from '../services/stores.js'

function AppLayout() {
  const { user, logout } = useAuth()
  const roles = user?.roles || []
  const has = (r) => roles.includes(r)
  const [storeLabel, setStoreLabel] = useState('')

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        if (user?.tienda_id) {
          const tiendas = await storesApi.list()
          const t = tiendas.find((x) => x.id === user.tienda_id)
          if (!ignore) setStoreLabel(t ? `${t.nombre}, ${t.ubicacion}` : `Tienda ${user.tienda_id}`)
        } else {
          if (!ignore) setStoreLabel('-')
        }
      } catch {
        if (!ignore) setStoreLabel(`Tienda ${user?.tienda_id ?? '-'}`)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [user?.tienda_id])

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="h-16 flex items-center px-4 border-b">
            <span className="text-lg font-semibold tracking-tight">TechStore</span>
          </div>
          <nav className="p-3 text-sm">
            <Section title="General">
              <Nav to="/dashboard" label="Dashboard" />
              {(has('Admin') || has('Gerente') || has('Empleado') || has('Auditor')) && <Nav to="/products" label="Productos" />}
            </Section>
            <Section title="Gestión" when={has('Admin') || has('Gerente')}>
              {has('Admin') && <Nav to="/roles" label="Roles" />}
              {(has('Admin') || has('Gerente')) && <Nav to="/users" label="Usuarios" />}
            </Section>
            {has('Auditor') && (
              <Section title="Auditoría">
                <Nav to="/audit-logs" label="Logs" />
              </Section>
            )}
            <Section title="Cuenta">
              <Nav to="/profile" label="Perfil" />
              <Nav to="/enable-mfa" label="Habilitar MFA" />
              <button onClick={logout} className="mt-2 w-full text-left px-3 py-2 rounded-md hover:bg-slate-100 transition-colors">Salir</button>
            </Section>
          </nav>
          <div className="mt-auto p-4 border-t text-xs text-slate-600">
            <div>{user?.email}</div>
            <div className="truncate">{storeLabel || '-'}</div>
            {roles?.length > 0 && <div className="mt-1">Roles: {roles.join(', ')}</div>}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <header className="h-16 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 flex items-center justify-between">
            <div className="font-semibold">{storeLabel || '-'}</div>
            <div className="text-sm text-slate-600">{user?.email}</div>
          </header>
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function Section({ title, children, when = true }) {
  if (!when) return null
  return (
    <div className="mb-3">
      <div className="px-3 py-2 text-xs uppercase tracking-wider text-slate-500/80">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Nav({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`
      }
    >
      {label}
    </NavLink>
  )
}

export default AppLayout
