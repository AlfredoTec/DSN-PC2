import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as productsApi from '../services/products.js'
import { useAuth } from '../context/AuthContext.jsx'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import * as storesApi from '../services/stores.js'
import Tooltip from '@mui/material/Tooltip'
import FormHelperText from '@mui/material/FormHelperText'

const empty = { nombre:'', categoria:'', precio:'', stock:'', tienda_id:'', es_premium:false }

function ProductForm() {
  const { id } = useParams()
  const isEdit = !!id
  const [product, setProduct] = useState(empty)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  const roles = user?.roles || []
  const isAdmin = roles.includes('Admin')
  const isGerente = roles.includes('Gerente')
  const isEmpleado = roles.includes('Empleado')
  const [stores, setStores] = useState([])

  useEffect(()=>{
    storesApi.list().then(setStores).catch(()=>{})
    if (isEdit) {
      productsApi.getOne(id).then(setProduct).catch(err=>{
        setError(err?.response?.data?.message || 'No se pudo cargar el producto')
      })
    } else {
      if (isAdmin) setProduct(empty)
      if (isGerente) setProduct({ ...empty, tienda_id: user.tienda_id })
      if (isEmpleado) setProduct({ ...empty, tienda_id: user.tienda_id, es_premium: false })
    }
  }, [id, isEdit, isAdmin, isGerente, isEmpleado, user])

  // ABAC UI: campos editables según rol y atributos
  const canEditField = (field) => {
    if (isAdmin) return true
    if (isGerente) {
      if (field === 'categoria' && isEdit) return false
      if (field === 'tienda_id') return true // pero restringimos valor más abajo
      return true
    }
    if (isEmpleado) {
      // Crear: puede definir los campos principales, Editar: solo stock
      if (!isEdit) return ['nombre','categoria','precio','stock'].includes(field)
      return field === 'stock'
    }
    return false
  }

  // ABAC UI: forzamos valores permitidos antes de enviar al backend
  const normalizeBeforeSave = (payload) => {
    const p = { ...payload }
    // ABAC UI: forzar restricciones antes de enviar
    if (isGerente) {
      p.tienda_id = user.tienda_id
    }
    if (isEmpleado) {
      p.tienda_id = user.tienda_id
      p.es_premium = false
    }
    if (isGerente && isEdit && 'categoria' in p) {
      delete p.categoria
    }
    // Convertir numéricos
    if (p.precio !== '') p.precio = Number(p.precio)
    if (p.stock !== '') p.stock = Number(p.stock)
    if (p.tienda_id !== '' && p.tienda_id != null) p.tienda_id = Number(p.tienda_id)
    return p
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = normalizeBeforeSave(product)
      if (isEdit) await productsApi.update(id, payload)
      else await productsApi.create(payload)
      navigate('/products', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo guardar')
    } finally {
      setLoading(false)
    }
  }

  const setField = (k, v) => setProduct(prev => ({ ...prev, [k]: v }))

  const tiendaIdInputDisabled = useMemo(() => {
    if (isAdmin) return false
    if (isGerente) return true // ABAC UI: gerente solo su tienda
    if (isEmpleado) return true // ABAC UI: empleado solo su tienda
    return true
  }, [isAdmin, isGerente, isEmpleado])

  const esPremiumDisabled = useMemo(() => {
    if (isAdmin) return false
    if (isGerente) return false
    if (isEmpleado) return true // ABAC UI: empleado no puede marcar premium
    return true
  }, [isAdmin, isGerente, isEmpleado])

  const fieldDisabledReason = (field) => {
    if (isAdmin) return ''
    if (isGerente) {
      if (field === 'categoria' && isEdit) return 'Gerente no puede modificar la categoría'
      if (field === 'tienda_id') return 'Solo puedes usar tu tienda'
      return ''
    }
    if (isEmpleado) {
      if (field === 'tienda_id') return 'Solo puedes usar tu tienda'
      if (field === 'es_premium') return 'Empleado no puede marcar premium'
      if (isEdit && field !== 'stock') return 'Empleado solo puede editar el stock'
      return ''
    }
    return 'Sin permiso'
  }

  return (
    <Container maxWidth="md" sx={{ mt: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{isEdit ? 'Editar' : 'Crear'} producto</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={onSubmit} sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 2 }}>
        <TextField
          label="Nombre"
          value={product.nombre || ''}
          onChange={e=>canEditField('nombre') && setField('nombre', e.target.value)}
          disabled={!canEditField('nombre')}
          helperText={!canEditField('nombre') ? fieldDisabledReason('nombre') : undefined}
          required
        />
        <TextField
          label="Categoría"
          value={product.categoria || ''}
          onChange={e=>canEditField('categoria') && setField('categoria', e.target.value)}
          disabled={!canEditField('categoria')}
          helperText={!canEditField('categoria') ? fieldDisabledReason('categoria') : undefined}
          required
        />
        <TextField
          type="number"
          inputProps={{ step: '0.01' }}
          label="Precio"
          value={product.precio ?? ''}
          onChange={e=>canEditField('precio') && setField('precio', e.target.value)}
          disabled={!canEditField('precio')}
          helperText={!canEditField('precio') ? fieldDisabledReason('precio') : undefined}
          required
        />
        <TextField
          type="number"
          label="Stock"
          value={product.stock ?? ''}
          onChange={e=>canEditField('stock') && setField('stock', e.target.value)}
          disabled={!canEditField('stock')}
          helperText={!canEditField('stock') ? fieldDisabledReason('stock') : undefined}
          required
        />
        <FormControl size="small">
          <InputLabel id="tienda-select-label">Tienda</InputLabel>
          <Select
            labelId="tienda-select-label"
            label="Tienda"
            value={String(product.tienda_id ?? '')}
            onChange={e=>canEditField('tienda_id') && setField('tienda_id', e.target.value)}
            disabled={tiendaIdInputDisabled}
            required
          >
            {stores.map(s=> (
              <MenuItem key={s.id} value={String(s.id)}>{s.nombre} — {s.ubicacion}</MenuItem>
            ))}
          </Select>
          {tiendaIdInputDisabled && (
            <FormHelperText>{fieldDisabledReason('tienda_id')}</FormHelperText>
          )}
        </FormControl>
        <Tooltip
          title={esPremiumDisabled ? fieldDisabledReason('es_premium') : ''}
          disableHoverListener={!esPremiumDisabled}
          arrow
        >
          <span>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!product.es_premium}
                  onChange={e=>canEditField('es_premium') && setField('es_premium', e.target.checked)}
                  disabled={esPremiumDisabled}
                />
              }
              label="Premium"
            />
          </span>
        </Tooltip>

        <Box sx={{ gridColumn:'1/-1' }}>
          <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Guardando…' : 'Guardar'}</Button>{' '}
          <Button type="button" onClick={()=>navigate('/products')}>Cancelar</Button>
        </Box>
      </Box>

      {/* ABAC UI: restricciones aplicadas arriba deshabilitan/forzan campos según rol */}
    </Container>
  )
}

export default ProductForm
