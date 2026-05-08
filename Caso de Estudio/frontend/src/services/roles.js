import api from './api.js'

export async function list() {
  const { data } = await api.get('/api/roles')
  return data
}

export async function create(payload) {
  const { data } = await api.post('/api/roles', payload)
  return data
}

export async function update(id, payload) {
  const { data } = await api.put(`/api/roles/${id}`, payload)
  return data
}

export async function remove(id) {
  const { data } = await api.delete(`/api/roles/${id}`)
  return data
}
