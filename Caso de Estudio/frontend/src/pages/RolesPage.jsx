import React, { useEffect, useState } from 'react'
import * as rolesApi from '../services/roles.js'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useToast } from '../components/ToastProvider.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function RolesPage() {
  const [roles, setRoles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState({ nombre: '', descripcion: '' })
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const isAdmin = (user?.roles || []).includes('Admin')

  const load = async () => {
    try {
      setLoading(true)
      const data = await rolesApi.list()
      setRoles(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudieron cargar los roles')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await rolesApi.create({ nombre: creating.nombre, descripcion: creating.descripcion })
      setCreating({ nombre: '', descripcion: '' })
      toast({ message: 'Rol creado', severity: 'success' })
      load()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo crear el rol')
      toast({ message: 'No se pudo crear el rol', severity: 'error' })
    }
  }

  const startEdit = (r) => {
    setEditing({ id: r.id, nombre: r.nombre || r.name || '', descripcion: r.descripcion || '' })
  }

  const onUpdate = async (e) => {
    e.preventDefault()
    if (!editing) return
    setError('')
    try {
      await rolesApi.update(editing.id, { nombre: editing.nombre, descripcion: editing.descripcion })
      setEditing(null)
      toast({ message: 'Rol actualizado', severity: 'success' })
      load()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo actualizar el rol')
      toast({ message: 'No se pudo actualizar el rol', severity: 'error' })
    }
  }

  const onDelete = (r) => setToDelete(r)
  const handleConfirmDelete = async (ok) => {
    const r = toDelete
    setToDelete(null)
    if (!ok || !r) return
    setError('')
    try {
      await rolesApi.remove(r.id)
      toast({ message: 'Rol eliminado', severity: 'success' })
      load()
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo eliminar el rol')
      toast({ message: 'No se pudo eliminar el rol', severity: 'error' })
    }
  }

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Roles</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {isAdmin && (
        <Box component="form" onSubmit={onCreate} sx={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap: 1, mb: 2, maxWidth: 900 }}>
          <TextField size="small" label="Nombre" value={creating.nombre} onChange={e=>setCreating(prev=>({ ...prev, nombre: e.target.value }))} required />
          <TextField size="small" label="Descripción" value={creating.descripcion} onChange={e=>setCreating(prev=>({ ...prev, descripcion: e.target.value }))} />
          <Button type="submit" variant="contained">Crear</Button>
        </Box>
      )}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && Array.from({length:5}).map((_,i)=> (
              <TableRow key={`s-${i}`}>
                <TableCell><Skeleton width={200} /></TableCell>
                <TableCell><Skeleton width={260} /></TableCell>
                <TableCell align="right"><Skeleton width={120} /></TableCell>
              </TableRow>
            ))}
            {!loading && roles.map(r=> (
              <TableRow key={r.id} hover>
                <TableCell>{r.nombre || r.name}</TableCell>
                <TableCell>{r.descripcion || ''}</TableCell>
                <TableCell align="right">
                  {isAdmin && (
                    <>
                      <Button size="small" sx={{ mr: 1 }} onClick={()=>startEdit(r)}>Editar</Button>
                      <Button size="small" color="error" onClick={()=>onDelete(r)}>Eliminar</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {isAdmin && editing && (
        <Box component="form" onSubmit={onUpdate} sx={{ mt: 2, display:'grid', gridTemplateColumns:'1fr 1fr auto auto', gap: 1, maxWidth: 900 }}>
          <Typography variant="h6" sx={{ gridColumn:'1/-1' }}>Editar rol</Typography>
          <TextField size="small" label="Nombre" value={editing.nombre} onChange={e=>setEditing(prev=>({ ...prev, nombre: e.target.value }))} required />
          <TextField size="small" label="Descripción" value={editing.descripcion} onChange={e=>setEditing(prev=>({ ...prev, descripcion: e.target.value }))} />
          <Button type="submit" variant="contained" size="small">Guardar</Button>
          <Button type="button" size="small" onClick={()=>setEditing(null)}>Cancelar</Button>
        </Box>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar rol"
        description={toDelete ? `¿Eliminar el rol "${toDelete.nombre || toDelete.name}"?` : ''}
        confirmText="Eliminar"
        onClose={handleConfirmDelete}
      />
    </Container>
  )
}

export default RolesPage
