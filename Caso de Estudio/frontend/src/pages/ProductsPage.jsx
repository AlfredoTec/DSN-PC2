import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as productsApi from '../services/products.js'
import { useAuth } from '../context/AuthContext.jsx'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import * as storesApi from '../services/stores.js'
import Skeleton from '@mui/material/Skeleton'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useToast } from '../components/ToastProvider.jsx'
import Tooltip from '@mui/material/Tooltip'

function ProductsPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const { user } = useAuth()
  const roles = user?.roles || []
  const isAdmin = roles.includes('Admin')
  const isGerente = roles.includes('Gerente')
  const isEmpleado = roles.includes('Empleado')
  const isAuditor = roles.includes('Auditor')
  const navigate = useNavigate()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [toDelete, setToDelete] = useState(null)
  const { toast } = useToast()

  const load = async () => {
    try {
      setLoading(true)
      const data = await productsApi.list()
      setItems(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudieron cargar los productos')
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])
  useEffect(()=>{
    let ignore = false
    async function fetchStores(){
      try { const ts = await storesApi.list(); if (!ignore) setStores(ts) } catch {}
    }
    fetchStores();
    return ()=>{ ignore = true }
  }, [])

  // ABAC UI: helpers para habilitar/ocultar acciones según rol y atributos
  const canCreate = useMemo(() => {
    if (isAdmin) return true
    if (isGerente) return true
    return false
  }, [isAdmin, isGerente])

  const canEdit = (p) => {
    if (isAdmin) return true
    if (isGerente) return p.tienda_id === user.tienda_id // puede editar varios campos (excepto categoria) en su tienda
    if (isEmpleado) return p.tienda_id === user.tienda_id // solo 'stock' en su tienda (se valida en form)
    return false
  }

  const canDelete = (p) => {
    if (isAdmin) return true
    if (isGerente) return p.tienda_id === user.tienda_id && !p.es_premium
    return false
  }

  const deleteDisabledReason = (p) => {
    if (isAdmin) return ''
    if (isGerente) {
      if (p.tienda_id !== user.tienda_id) return 'Solo puedes eliminar productos de tu tienda'
      if (p.es_premium) return 'No puedes eliminar productos premium'
      return ''
    }
    if (isEmpleado) return 'Empleado no puede eliminar productos'
    if (isAuditor) return 'Auditor no puede eliminar productos'
    return 'Sin permiso para eliminar'
  }

  const editDisabledReason = (p) => {
    if (isAdmin) return ''
    if (isGerente) {
      if (p.tienda_id !== user.tienda_id) return 'Solo puedes editar productos de tu tienda'
      return ''
    }
    if (isEmpleado) {
      if (p.tienda_id !== user.tienda_id) return 'Solo puedes editar productos de tu tienda'
      // Si es de su tienda, puede editar stock; el resto se restringe en el formulario
      return ''
    }
    if (isAuditor) return 'Auditor no puede editar productos'
    return 'Sin permiso para editar'
  }

  return (
    <Container sx={{ mt: 3 }}>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Productos</Typography>
        {/* ABAC UI: ocultar "Nuevo" si rol no lo permite */}
        {canCreate && <Button variant="contained" onClick={()=>navigate('/products/new')}>Nuevo producto</Button>}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Tienda</TableCell>
              <TableCell>Premium</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && Array.from({length:6}).map((_,i)=> (
              <TableRow key={`s-${i}`}>
                <TableCell><Skeleton width={140} /></TableCell>
                <TableCell><Skeleton width={120} /></TableCell>
                <TableCell><Skeleton width={80} /></TableCell>
                <TableCell><Skeleton width={60} /></TableCell>
                <TableCell><Skeleton width={150} /></TableCell>
                <TableCell><Skeleton width={60} /></TableCell>
                <TableCell align="right"><Skeleton width={120} /></TableCell>
              </TableRow>
            ))}
            {!loading && items.map((p)=> (
              <TableRow key={p.id} hover>
                <TableCell>{p.nombre}</TableCell>
                <TableCell>{p.categoria}</TableCell>
                <TableCell>{p.precio}</TableCell>
                <TableCell>{p.stock}</TableCell>
                <TableCell>{stores.find(s=>s.id===p.tienda_id)?.nombre || `Tienda ${p.tienda_id}`}</TableCell>
                <TableCell>{p.es_premium ? "sí" : "no"}</TableCell>
                <TableCell align="right">
                  <Tooltip
                    title={!canEdit(p) ? editDisabledReason(p) : ''}
                    disableHoverListener={canEdit(p)}
                    arrow
                  >
                    <span>
                      <Button
                        component={Link}
                        to={`/products/${p.id}`}
                        size="small"
                        disabled={!canEdit(p)}
                        sx={{ mr: 1 }}
                      >Editar</Button>
                    </span>
                  </Tooltip>
                  <Tooltip
                    title={!canDelete(p) ? deleteDisabledReason(p) : ''}
                    disableHoverListener={canDelete(p)}
                    arrow
                  >
                    <span>
                      <Button
                        size="small"
                        color="error"
                        disabled={!canDelete(p)}
                        onClick={()=> setToDelete(p)}
                      >Eliminar</Button>
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
        title="Eliminar producto"
        description={toDelete ? `¿Eliminar "${toDelete.nombre}"? Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        onClose={async(ok)=>{
          const p = toDelete
          setToDelete(null)
          if (!ok || !p) return
          try { await productsApi.remove(p.id); toast({ message: 'Producto eliminado', severity:'success' }); load() } catch (err) { setError(err?.response?.data?.message || 'No se pudo eliminar'); toast({ message:'No se pudo eliminar', severity:'error' }) }
        }}
      />
      {isAuditor && <Typography variant="body2" sx={{ mt: 1, color:'text.secondary' }}>Modo lectura (Auditor): acciones deshabilitadas.</Typography>}
    </Container>
  )
}

export default ProductsPage
