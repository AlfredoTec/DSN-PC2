import React, { useEffect, useState } from 'react'
import * as rolesApi from '../services/roles.js'
import { useAuth } from '../context/AuthContext.jsx'

function RolesPage() {
  const [roles, setRoles] = useState([])
  const [nombre, setNombre] = useState('')
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const load = async () => {
    try {
      const data = await rolesApi.list()
      setRoles(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudieron cargar los roles')
    }
  }

  useEffect(() => { load() }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await rolesApi.update(editing.id, { nombre })
      } else {
        await rolesApi.create({ nombre })
      }
      setNombre('')
      setEditing(null)
      load()
    } catch (err) {
      setError(err?.response?.data?.message || 'Operación fallida')
    }
  }

  const startEdit = (role) => {
    setEditing(role)
    setNombre(role.nombre || role.name || '')
  }

  const onDelete = async (r) => {
    if (!confirm(`Eliminar rol ${r.nombre || r.name}?`)) return
    try {
      await rolesApi.remove(r.id)
      load()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo eliminar')
    }
  }

  const isAdmin = (user?.roles || []).includes('Admin')

  return (
    <div style={{ padding: 20 }}>
      <h2>Roles</h2>
      {error && <p style={{ color:'crimson' }}>{error}</p>}
      <table border="1" cellPadding="6" style={{ borderCollapse:'collapse', minWidth: 300 }}>
        <thead><tr><th>ID</th><th>Nombre</th><th>Acciones</th></tr></thead>
        <tbody>
          {roles.map(r=>(
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.nombre || r.name}</td>
              <td>
                <button onClick={()=>startEdit(r)} disabled={!isAdmin}>Editar</button>{' '}
                <button onClick={()=>onDelete(r)} disabled={!isAdmin}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 20 }}>{editing ? 'Editar rol' : 'Crear rol'}</h3>
      <form onSubmit={onSubmit} style={{ display:'flex', gap:8 }}>
        <input
          placeholder="Nombre"
          value={nombre}
          onChange={(e)=>setNombre(e.target.value)}
          required
          disabled={!isAdmin}
        />
        <button type="submit" disabled={!isAdmin}>{editing ? 'Actualizar' : 'Crear'}</button>
        {editing && <button type="button" onClick={()=>{setEditing(null); setNombre('')}}>Cancelar</button>}
      </form>
    </div>
  )
}

export default RolesPage
