import React, { useEffect, useMemo, useState } from 'react'
import * as usersApi from '../services/users.js'
import { useAuth } from '../context/AuthContext.jsx'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Chip from '@mui/material/Chip'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useToast } from '../components/ToastProvider.jsx'
import * as storesApi from '../services/stores.js'
import * as rolesApi from '../services/roles.js'
import Tooltip from '@mui/material/Tooltip'
import FormHelperText from '@mui/material/FormHelperText'

function UsersPage() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [creating, setCreating] = useState({ nombre_completo:'', email:'', password:'', tienda_id:'' })
  const [editing, setEditing] = useState(null)
  const [roleInput, setRoleInput] = useState('')
  const [stores, setStores] = useState([])
  const [rolesList, setRolesList] = useState([])
  const { user: current } = useAuth()
  const roles = current?.roles || []
  const isAdmin = roles.includes('Admin')
  const isGerente = roles.includes('Gerente')
  const [loading, setLoading] = useState(true)
  const [toDelete, setToDelete] = useState(null)
  const { toast } = useToast()

  const load = async () => {
    try {
      setLoading(true)
      const data = await usersApi.list()
      setUsers(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudieron cargar los usuarios')
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  useEffect(()=>{
    let ignore = false
    async function fetchAux(){
      try {
        const [ts, rs] = await Promise.all([
          storesApi.list(),
          rolesApi.list()
        ])
        if (!ignore) {
          setStores(ts)
          setRolesList(rs)
        }
      } catch {}
    }
    fetchAux()
    return ()=>{ ignore = true }
  }, [])

  useEffect(()=>{
    if (isGerente && current?.tienda_id) {
      setCreating(prev => ({ ...prev, tienda_id: String(current.tienda_id) }))
    }
  }, [isGerente, current?.tienda_id])

  const visibleUsers = useMemo(() => {
    if (isAdmin) return users
    if (isGerente) return users.filter(u => u.tienda_id === current?.tienda_id)
    return []
  }, [users, isAdmin, isGerente, current])

  const canEditUser = (u) => {
    if (isAdmin) return true
    if (isGerente && u.tienda_id === current?.tienda_id) return true
    return false
  }

  const editDisabledReason = (u) => {
    if (isAdmin) return ''
    if (isGerente) {
      if (u.tienda_id !== current?.tienda_id) return 'Solo puedes editar usuarios de tu tienda'
      return ''
    }
    return 'Sin permiso para editar usuarios'
  }

  const deleteDisabledReason = () => {
    if (!isAdmin) return 'Solo Admin puede eliminar usuarios'
    return ''
  }

  const tiendaSelectHelperText = (context) => {
    if (isAdmin) return ''
    if (isGerente) {
      if (context === 'create') return 'Los usuarios se crean automáticamente en tu tienda'
      if (context === 'edit') return 'Gerente no puede reasignar tienda'
    }
    return 'Sin permiso para cambiar la tienda'
  }

  const roleAssignHelperText = () => {
    if (isAdmin) return ''
    if (isGerente) return 'No puedes asignar roles Admin/Gerente ni modificar usuarios de otra tienda'
    return 'Sin permiso para asignar roles'
  }

  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        email: creating.email,
        password: creating.password,
        nombre_completo: creating.nombre_completo,
        tienda_id: creating.tienda_id !== '' ? Number(creating.tienda_id) : undefined,
      }
      if (isGerente && current?.tienda_id) {
        payload.tienda_id = Number(current.tienda_id)
      }
      await usersApi.create(payload)
      setCreating({ nombre_completo:'', email:'', password:'', tienda_id:'' })
      load()
      toast({ message: 'Usuario creado', severity: 'success' })
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo crear usuario')
      toast({ message: 'No se pudo crear usuario', severity: 'error' })
    }
  }

  const startEdit = (u) => {
    setEditing({
      id: u.id,
      nombre_completo: u.nombre_completo || '',
      activo: typeof u.activo === 'boolean' ? u.activo : true,
      tienda_id: u.tienda_id
    })
  }

  const onUpdate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        nombre_completo: editing.nombre_completo,
        activo: editing.activo,
        tienda_id: editing.tienda_id !== '' ? Number(editing.tienda_id) : undefined,
      }
      await usersApi.update(editing.id, payload)
      setEditing(null)
      load()
      toast({ message: 'Usuario actualizado', severity: 'success' })
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo actualizar')
      toast({ message: 'No se pudo actualizar', severity: 'error' })
    }
  }

  const onDelete = async (u) => { setToDelete(u) }
  const handleConfirmDelete = async (ok) => {
    const u = toDelete
    setToDelete(null)
    if (!ok || !u) return
    try { await usersApi.remove(u.id); toast({ message: 'Usuario eliminado', severity: 'success' }); load() } catch (err) { setError(err?.response?.data?.message || 'No se pudo eliminar'); toast({ message:'No se pudo eliminar', severity:'error' }) }
  }

  const onAssignRole = async (u) => {
    if (!roleInput) return
    if (isGerente && (roleInput === 'Admin' || roleInput === 'Gerente')) {
      toast({ message: 'No tienes permiso para asignar ese rol', severity: 'warning' })
      return
    }
    const targetRoles = (users.find(x=>x.id===u.id)?.roles) || []
    if (targetRoles.includes('Admin')) {
      toast({ message: 'Este usuario ya es Admin; roles adicionales serían redundantes', severity: 'info' })
      return
    }
    try {
      await usersApi.assignRole(u.id, roleInput)
      setRoleInput('')
      load()
      toast({ message: 'Rol asignado', severity: 'success' })
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo asignar rol')
      toast({ message: 'No se pudo asignar rol', severity: 'error' })
    }
  }

  const onRemoveRole = async (u, r) => {
    if (isGerente) {
      if (r === 'Admin' || r === 'Gerente') {
        toast({ message: 'No puedes remover ese rol', severity: 'warning' })
        return
      }
      if (!canEditUser(u)) {
        toast({ message: 'No puedes modificar usuarios de otra tienda', severity: 'warning' })
        return
      }
    }
    try {
      await usersApi.removeRole(u.id, r)
      load()
      toast({ message: 'Rol removido', severity: 'success' })
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo remover rol')
      toast({ message: 'No se pudo remover rol', severity: 'error' })
    }
  }

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Usuarios</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isAdmin && (
        <>
          <Typography variant="h6">Crear usuario</Typography>
          <form onSubmit={onCreate} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, maxWidth: 600 }}>
            <TextField size="small" placeholder="Nombre completo" label="Nombre completo" value={creating.nombre_completo} onChange={e=>setCreating({...creating, nombre_completo: e.target.value})} required />
            <TextField size="small" type="email" placeholder="Email" label="Email" value={creating.email} onChange={e=>setCreating({...creating, email: e.target.value})} required />
            <TextField size="small" type="password" placeholder="Contraseña" label="Contraseña" value={creating.password} onChange={e=>setCreating({...creating, password: e.target.value})} required />
            <FormControl size="small">
              <InputLabel id="tienda-select-label">Tienda</InputLabel>
              <Select
                labelId="tienda-select-label"
                label="Tienda"
                value={creating.tienda_id}
                onChange={e=>setCreating({ ...creating, tienda_id: e.target.value })}
                required
                disabled={!isAdmin}
              >
                {stores.map(s=> (
                  <MenuItem key={s.id} value={String(s.id)}>{s.nombre} — {s.ubicacion}</MenuItem>
                ))}
              </Select>
              {!isAdmin && (
                <FormHelperText>{tiendaSelectHelperText('create')}</FormHelperText>
              )}
            </FormControl>
            <div style={{ gridColumn:'1/-1' }}>
              <Button type="submit" variant="contained">Crear</Button>
            </div>
          </form>
        </>
      )}

      <Typography variant="h6" sx={{ mt: 2 }}>Listado</Typography>
      <TableContainer component={Paper} sx={{ mt: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Tienda</TableCell>
              <TableCell>Activo</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && Array.from({ length: 6 }).map((_,i)=> (
              <TableRow key={`s-${i}`}>
                <TableCell><Skeleton width={160} /></TableCell>
                <TableCell><Skeleton width={200} /></TableCell>
                <TableCell><Skeleton width={140} /></TableCell>
                <TableCell><Skeleton width={60} /></TableCell>
                <TableCell><Skeleton width={180} /></TableCell>
                <TableCell align="right"><Skeleton width={120} /></TableCell>
              </TableRow>
            ))}
            {!loading && visibleUsers.map(u=> (
              <TableRow key={u.id} hover>
                <TableCell>{u.nombre_completo}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{stores.find(s=>s.id===u.tienda_id)?.nombre || `Tienda ${u.tienda_id}`}</TableCell>
                <TableCell>{String(u.activo ?? true)}</TableCell>
                <TableCell>
                  {(u.roles || []).map(r => <Chip key={r} label={r} size="small" sx={{ mr: 0.5 }} />)}
                </TableCell>
                <TableCell align="right">
                  <Tooltip
                    title={!canEditUser(u) ? editDisabledReason(u) : ''}
                    disableHoverListener={canEditUser(u)}
                    arrow
                  >
                    <span>
                      <Button onClick={()=>startEdit(u)} disabled={!canEditUser(u)} size="small" sx={{ mr: 1 }}>Editar</Button>
                    </span>
                  </Tooltip>
                  <Tooltip
                    title={!isAdmin ? deleteDisabledReason() : ''}
                    disableHoverListener={isAdmin}
                    arrow
                  >
                    <span>
                      <Button onClick={()=>onDelete(u)} disabled={!isAdmin} size="small" color="error">Eliminar</Button>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar usuario"
        description={toDelete ? `¿Eliminar "${toDelete.email}"?` : ''}
        confirmText="Eliminar"
        onClose={handleConfirmDelete}
      />

      {editing && (
        <div style={{ marginTop: 16 }}>
          <h3>Editar usuario</h3>
          <form onSubmit={onUpdate} style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, maxWidth: 800 }}>
            <TextField
              size="small"
              placeholder="Nombre completo"
              label="Nombre completo"
              value={editing.nombre_completo}
              onChange={e=>setEditing({...editing, nombre_completo: e.target.value})}
              disabled={!canEditUser({ id: editing.id, tienda_id: editing.tienda_id })}
              required
            />
            <FormControl size="small">
              <InputLabel id="tienda-edit-select-label">Tienda</InputLabel>
              <Select
                labelId="tienda-edit-select-label"
                label="Tienda"
                value={String(editing.tienda_id ?? '')}
                onChange={e=>setEditing({...editing, tienda_id: e.target.value})}
                disabled={!isAdmin}
                required
              >
                {stores.map(s=> (
                  <MenuItem key={s.id} value={String(s.id)}>{s.nombre} — {s.ubicacion}</MenuItem>
                ))}
              </Select>
              {!isAdmin && (
                <FormHelperText>{tiendaSelectHelperText('edit')}</FormHelperText>
              )}
            </FormControl>
            <FormControl size="small">
              <InputLabel id="activo-select-label">Estado</InputLabel>
              <Select
                labelId="activo-select-label"
                label="Estado"
                value={String(editing.activo)}
                onChange={e=>setEditing({...editing, activo: e.target.value === 'true'})}
                disabled={!isAdmin}
              >
                <MenuItem value="true">Activo</MenuItem>
                <MenuItem value="false">Inactivo</MenuItem>
              </Select>
              {!isAdmin && <FormHelperText>Solo Admin puede activar o desactivar</FormHelperText>}
            </FormControl>
            <div style={{ gridColumn:'1/-1' }}>
              <Button type="submit" variant="contained" size="small" disabled={!canEditUser({ id: editing.id, tienda_id: editing.tienda_id })}>Guardar</Button>{' '}
              <Button type="button" size="small" onClick={()=>setEditing(null)}>Cancelar</Button>
            </div>
          </form>

          {(isAdmin || (isGerente && canEditUser({ id: editing.id, tienda_id: editing.tienda_id }))) && (
            <div style={{ marginTop: 12 }}>
              <h4>Roles de usuario</h4>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {(users.find(x=>x.id===editing.id)?.roles || []).map(r=> (
                  <Chip key={r} label={r} size="small" onDelete={()=>onRemoveRole(editing, r)} />
                ))}
              </div>
              <div style={{ marginTop: 8, display:'flex', gap:8, alignItems:'center' }}>
                <FormControl size="small" style={{ minWidth: 200 }}>
                  <InputLabel id="rol-select-label">Nuevo rol</InputLabel>
                  <Select labelId="rol-select-label" label="Nuevo rol" value={roleInput} onChange={e=>setRoleInput(e.target.value)}>
                    {rolesList
                      .filter(r => {
                        const name = r.nombre || r.name
                        const targetRoles = (users.find(x=>x.id===editing.id)?.roles) || []
                        if (targetRoles.includes('Admin')) return false
                        if (isGerente && ['Admin','Gerente'].includes(name)) return false
                        return true
                      })
                      .map(r=> (
                        <MenuItem key={r.id} value={r.nombre || r.name}>{r.nombre || r.name}</MenuItem>
                      ))}
                  </Select>
                  {!isAdmin && <FormHelperText>{roleAssignHelperText()}</FormHelperText>}
                </FormControl>
                <Button size="small" variant="contained" onClick={()=>onAssignRole(editing)}>Asignar</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Container>
  )
}

export default UsersPage
