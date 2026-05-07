import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as productsApi from '../services/products.js'
import { useAuth } from '../context/AuthContext.jsx'

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

  const load = async () => {
    try {
      const data = await productsApi.list()
      setItems(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudieron cargar los productos')
    }
  }

  useEffect(()=>{ load() }, [])

  // ABAC UI: helpers para habilitar/ocultar acciones según rol y atributos
  const canCreate = useMemo(() => {
    if (isAdmin) return true
    if (isGerente) return true
    if (isEmpleado) return true
    return false // Auditor solo lectura
  }, [isAdmin, isGerente, isEmpleado])

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

  return (
    <div style={{ padding: 20 }}>
      <h2>Productos</h2>
      {error && <p style={{ color:'crimson' }}>{error}</p>}

      {/* ABAC UI: ocultar "Nuevo" si rol no lo permite */}
      {canCreate && <button onClick={()=>navigate('/products/new')}>Nuevo producto</button>}

      <table border="1" cellPadding="6" style={{ borderCollapse:'collapse', width:'100%', marginTop: 10 }}>
        <thead>
          <tr>
            <th>ID</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Tienda</th><th>Premium</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(p=>(
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.nombre}</td>
              <td>{p.categoria}</td>
              <td>{p.precio}</td>
              <td>{p.stock}</td>
              <td>{p.tienda_id}</td>
              <td>{String(p.es_premium)}</td>
              <td>
                {/* ABAC UI: mostrar/ocultar Editar según rol y atributos */}
                <Link to={`/products/${p.id}`} style={{ pointerEvents: canEdit(p) ? 'auto' : 'none', opacity: canEdit(p) ? 1 : 0.5 }}>
                  Editar
                </Link>
                {' '}
                {/* ABAC UI: ocultar/inhabilitar Eliminar según reglas */}
                <button onClick={async ()=>{
                  if (!canDelete(p)) return
                  if (!confirm(`Eliminar ${p.nombre}?`)) return
                  try { await productsApi.remove(p.id); load() } catch (err) { setError(err?.response?.data?.message || 'No se pudo eliminar') }
                }} disabled={!canDelete(p)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isAuditor && <p style={{ marginTop: 8 }}><small>Modo lectura (Auditor): acciones deshabilitadas.</small></p>}
    </div>
  )
}

export default ProductsPage
