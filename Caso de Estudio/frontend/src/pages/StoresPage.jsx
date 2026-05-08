import React, { useEffect, useState } from 'react'
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
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import { useToast } from '../components/ToastProvider.jsx'
import * as storesApi from '../services/stores.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Tooltip from '@mui/material/Tooltip'

function StoresPage() {
  const [stores, setStores] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState({ nombre: '', ubicacion: '' })
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const { toast } = useToast()

  const load = async () => {
    try {
      setLoading(true)
      const data = await storesApi.list()
      setStores(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudieron cargar las tiendas')
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await storesApi.create({ nombre: creating.nombre, ubicacion: creating.ubicacion })
      setCreating({ nombre: '', ubicacion: '' })
      load()
      toast({ message: 'Tienda creada', severity: 'success' })
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo crear la tienda')
      toast({ message: 'No se pudo crear la tienda', severity: 'error' })
    }
  }

  const startEdit = (s) => {
    setEditing({ id: s.id, nombre: s.nombre || '', ubicacion: s.ubicacion || '' })
  }

  const onUpdate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await storesApi.update(editing.id, { nombre: editing.nombre, ubicacion: editing.ubicacion })
      setEditing(null)
      load()
      toast({ message: 'Tienda actualizada', severity: 'success' })
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo actualizar la tienda')
      toast({ message: 'No se pudo actualizar la tienda', severity: 'error' })
    }
  }

  const onDelete = (s) => setToDelete(s)

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Tiendas</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography variant="h6">Crear tienda</Typography>
      <Box component="form" onSubmit={onCreate} sx={{ display:'flex', gap:1, mb: 2, maxWidth: 600 }}>
        <TextField size="small" label="Nombre" value={creating.nombre} onChange={e=>setCreating({ ...creating, nombre: e.target.value })} required />
        <TextField size="small" label="Ubicación" value={creating.ubicacion} onChange={e=>setCreating({ ...creating, ubicacion: e.target.value })} />
        <Button type="submit" variant="contained">Crear</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && Array.from({length:5}).map((_,i)=> (
              <TableRow key={`s-${i}`}>
                <TableCell><Skeleton width={160} /></TableCell>
                <TableCell><Skeleton width={200} /></TableCell>
                <TableCell align="right"><Skeleton width={120} /></TableCell>
              </TableRow>
            ))}
            {!loading && stores.map(s=> (
              <TableRow key={s.id} hover>
                <TableCell>{s.nombre}</TableCell>
                <TableCell>{s.ubicacion}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Editar tienda" arrow>
                    <span>
                      <Button size="small" onClick={()=>startEdit(s)} sx={{ mr: 1 }}>Editar</Button>
                    </span>
                  </Tooltip>
                  <Tooltip title="Eliminar tienda (puede fallar si tiene dependencias)" arrow>
                    <span>
                      <Button size="small" color="error" onClick={()=>onDelete(s)}>Eliminar</Button>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editing && (
        <Box component="form" onSubmit={onUpdate} sx={{ display:'flex', gap:1, mt: 2, maxWidth: 600 }}>
          <TextField size="small" label="Nombre" value={editing.nombre} onChange={e=>setEditing({ ...editing, nombre: e.target.value })} required />
          <TextField size="small" label="Ubicación" value={editing.ubicacion} onChange={e=>setEditing({ ...editing, ubicacion: e.target.value })} />
          <Button type="submit" variant="contained" size="small">Guardar</Button>
          <Button type="button" size="small" onClick={()=>setEditing(null)}>Cancelar</Button>
        </Box>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar tienda"
        description={toDelete ? `¿Eliminar "${toDelete.nombre}"? Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        onClose={async(ok)=>{
          const s = toDelete
          setToDelete(null)
          if (!ok || !s) return
          try { await storesApi.remove(s.id); toast({ message:'Tienda eliminada', severity:'success' }); load() } catch (err) { setError(err?.response?.data?.message || 'No se pudo eliminar la tienda'); toast({ message:'No se pudo eliminar la tienda', severity:'error' }) }
        }}
      />
    </Container>
  )
}

export default StoresPage
