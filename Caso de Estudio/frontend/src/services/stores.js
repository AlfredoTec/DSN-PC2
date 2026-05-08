import api from './api.js'

export async function list() {
  const { data } = await api.get('/api/tiendas')
  return data // [{id, nombre, ubicacion}]
}

export async function create(payload) {
  const { data } = await api.post('/api/tiendas', payload)
  return data
}

export async function update(id, payload) {
  const { data } = await api.put(`/api/tiendas/${id}`, payload)
  return data
}

export async function remove(id) {
  const { data } = await api.delete(`/api/tiendas/${id}`)
  return data
}
