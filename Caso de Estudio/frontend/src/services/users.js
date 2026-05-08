import api from './api.js'

export async function list() {
  const { data } = await api.get('/api/usuarios')
  return data
}

export async function create(payload) {
  const { data } = await api.post('/api/usuarios', payload)
  return data
}

export async function update(id, payload) {
  const { data } = await api.put(`/api/usuarios/${id}`, payload)
  return data
}

export async function remove(id) {
  const { data } = await api.delete(`/api/usuarios/${id}`)
  return data
}

export async function assignRole(userId, role) {
  const { data } = await api.post(`/api/usuarios/${userId}/roles`, { rolNombre: role })
  return data
}

export async function removeRole(userId, role) {
  const { data } = await api.delete(`/api/usuarios/${userId}/roles`, { data: { rolNombre: role } })
  return data
}
