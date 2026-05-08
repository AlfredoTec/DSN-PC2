import api from './api.js'

export async function list() {
  const { data } = await api.get('/api/productos')
  return data
}

export async function getOne(id) {
  const { data } = await api.get(`/api/productos/${id}`)
  return data
}

export async function create(payload) {
  const { data } = await api.post('/api/productos', payload)
  return data
}

export async function update(id, payload) {
  const { data } = await api.put(`/api/productos/${id}`, payload)
  return data
}

export async function remove(id) {
  const { data } = await api.delete(`/api/productos/${id}`)
  return data
}
