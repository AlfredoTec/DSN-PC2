import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as productsApi from '../services/products.js'
import { useAuth } from '../context/AuthContext.jsx'

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

  useEffect(()=>{
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
    // Convertir numéricos
    if (p.precio !== '') p.precio = Number(p.precio)
    if (p.stock !== '') p.stock = Number(p.stock)
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

  return (
    <div style={{ maxWidth: 640, margin: '20px auto' }}>
      <h2>{isEdit ? 'Editar' : 'Crear'} producto</h2>
      {error && <p style={{ color:'crimson' }}>{error}</p>}

      <form onSubmit={onSubmit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <input
          placeholder="Nombre"
          value={product.nombre || ''}
          onChange={e=>canEditField('nombre') && setField('nombre', e.target.value)}
          disabled={!canEditField('nombre')}
          required
        />
        <input
          placeholder="Categoría"
          value={product.categoria || ''}
          onChange={e=>canEditField('categoria') && setField('categoria', e.target.value)}
          disabled={!canEditField('categoria')}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Precio"
          value={product.precio ?? ''}
          onChange={e=>canEditField('precio') && setField('precio', e.target.value)}
          disabled={!canEditField('precio')}
          required
        />
        <input
          type="number"
          placeholder="Stock"
          value={product.stock ?? ''}
          onChange={e=>canEditField('stock') && setField('stock', e.target.value)}
          disabled={!canEditField('stock')}
          required
        />
        <input
          placeholder="Tienda ID"
          value={product.tienda_id ?? ''}
          onChange={e=>canEditField('tienda_id') && setField('tienda_id', e.target.value)}
          disabled={tiendaIdInputDisabled}
          required
        />
        <label style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input
            type="checkbox"
            checked={!!product.es_premium}
            onChange={e=>canEditField('es_premium') && setField('es_premium', e.target.checked)}
            disabled={esPremiumDisabled}
          />
          Premium
        </label>

        <div style={{ gridColumn:'1/-1' }}>
          <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>{' '}
          <button type="button" onClick={()=>navigate('/products')}>Cancelar</button>
        </div>
      </form>

      {/* ABAC UI: restricciones aplicadas arriba deshabilitan/forzan campos según rol */}
    </div>
  )
}

export default ProductForm
