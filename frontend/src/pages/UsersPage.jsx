import React, { useEffect, useMemo, useState } from 'react'
import * as usersApi from '../services/users.js'
import { useAuth } from '../context/AuthContext.jsx'

function UsersPage() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [creating, setCreating] = useState({ nombre:'', email:'', password:'', tienda_id:'' })
  const [editing, setEditing] = useState(null)
  const [roleInput, setRoleInput] = useState('')
  const { user: current } = useAuth()
  const roles = current?.roles || []
  const isAdmin = roles.includes('Admin')
  const isGerente = roles.includes('Gerente')

  const load = async () => {
    try {
      const data = await usersApi.list()
      setUsers(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudieron cargar los usuarios')
    }
  }

  useEffect(()=>{ load() }, [])

  const visibleUsers = useMemo(() => {
    if (isAdmin) return users
    if (isGerente) return users.filter(u => u.tienda_id === current?.tienda_id)
    return users.filter(u => u.id === current?.id)
  }, [users, isAdmin, isGerente, current])

  const canEditUser = (u) => {
    if (isAdmin) return true
    if (isGerente && u.tienda_id === current?.tienda_id) return true
    return false
  }

  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await usersApi.create(creating)
      setCreating({ nombre:'', email:'', password:'', tienda_id:'' })
      load()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo crear usuario')
    }
  }

  const startEdit = (u) => {
    setEditing({
      id: u.id,
      nombre: u.nombre || '',
      activo: typeof u.activo === 'boolean' ? u.activo : true,
      tienda_id: u.tienda_id
    })
  }

  const onUpdate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await usersApi.update(editing.id, editing)
      setEditing(null)
      load()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo actualizar')
    }
  }

  const onDelete = async (u) => {
    if (!confirm(`Eliminar usuario ${u.email}?`)) return
    try {
      await usersApi.remove(u.id)
      load()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo eliminar')
    }
  }

  const onAssignRole = async (u) => {
    if (!roleInput) return
    try {
      await usersApi.assignRole(u.id, roleInput)
      setRoleInput('')
      load()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo asignar rol')
    }
  }

  const onRemoveRole = async (u, r) => {
    try {
      await usersApi.removeRole(u.id, r)
      load()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo remover rol')
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Usuarios</h2>
      {error && <p style={{ color:'crimson' }}>{error}</p>}

      {isAdmin && (
        <>
          <h3>Crear usuario</h3>
          <form onSubmit={onCreate} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, maxWidth: 600 }}>
            <input placeholder="Nombre" value={creating.nombre} onChange={e=>setCreating({...creating, nombre: e.target.value})} required />
            <input type="email" placeholder="Email" value={creating.email} onChange={e=>setCreating({...creating, email: e.target.value})} required />
            <input type="password" placeholder="Contraseña" value={creating.password} onChange={e=>setCreating({...creating, password: e.target.value})} required />
            <input placeholder="Tienda ID" value={creating.tienda_id} onChange={e=>setCreating({...creating, tienda_id: e.target.value})} required />
            <button type="submit" style={{ gridColumn:'1/-1' }}>Crear</button>
          </form>
        </>
      )}

      <h3 style={{ marginTop: 20 }}>Listado</h3>
      <table border="1" cellPadding="6" style={{ borderCollapse:'collapse', width:'100%', maxWidth: '100%' }}>
        <thead>
          <tr>
            <th>ID</th><th>Nombre</th><th>Email</th><th>Tienda</th><th>Activo</th><th>Roles</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {visibleUsers.map(u=>(
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>{u.tienda_id}</td>
              <td>{String(u.activo ?? true)}</td>
              <td>{(u.roles || []).join(', ')}</td>
              <td>
                <button onClick={()=>startEdit(u)} disabled={!canEditUser(u)}>Editar</button>{' '}
                <button onClick={()=>onDelete(u)} disabled={!isAdmin}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <div style={{ marginTop: 16 }}>
          <h3>Editar usuario</h3>
          <form onSubmit={onUpdate} style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, maxWidth: 800 }}>
            <input
              placeholder="Nombre"
              value={editing.nombre}
              onChange={e=>setEditing({...editing, nombre: e.target.value})}
              disabled={!canEditUser({ id: editing.id, tienda_id: editing.tienda_id })}
              required
            />
            <input
              placeholder="Tienda ID"
              value={editing.tienda_id}
              onChange={e=>setEditing({...editing, tienda_id: e.target.value})}
              disabled={!isAdmin}
              required
            />
            <select
              value={String(editing.activo)}
              onChange={e=>setEditing({...editing, activo: e.target.value === 'true'})}
              disabled={!isAdmin}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
            <div style={{ gridColumn:'1/-1' }}>
              <button type="submit" disabled={!canEditUser({ id: editing.id, tienda_id: editing.tienda_id })}>Guardar</button>{' '}
              <button type="button" onClick={()=>setEditing(null)}>Cancelar</button>
            </div>
          </form>

          {isAdmin && (
            <div style={{ marginTop: 12 }}>
              <h4>Roles de usuario</h4>
              <div>
                {(users.find(x=>x.id===editing.id)?.roles || []).map(r=>(
                  <span key={r} style={{ display:'inline-flex', alignItems:'center', border:'1px solid #ccc', padding:'2px 6px', marginRight:6 }}>
                    {r} <button onClick={()=>onRemoveRole(editing, r)} style={{ marginLeft: 6 }}>x</button>
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                <input placeholder="Nuevo rol (p.ej. Admin)" value={roleInput} onChange={e=>setRoleInput(e.target.value)} />
                <button onClick={()=>onAssignRole(editing)}>Asignar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UsersPage
