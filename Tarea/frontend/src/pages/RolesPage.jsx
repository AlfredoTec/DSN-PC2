import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Plus, Trash2 } from 'lucide-react';

export default function RolesPage() {
  const { api, roles } = useAuth();
  const isAdmin = roles?.includes('Administrador');
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { data } = await api.get('/roles');
      setItems(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Error al cargar roles');
    }
  }
  useEffect(() => { load(); }, []);

  async function createRole() {
    setError('');
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    const duplicate = items.some(r => r.nombre.toLowerCase() === nombre.trim().toLowerCase());
    if (duplicate) { setError('Ya existe un rol con ese nombre'); return; }
    try {
      setSaving(true);
      await api.post('/roles', { nombre: nombre.trim(), descripcion: descripcion.trim() || null });
      setNombre(''); setDescripcion('');
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo crear el rol');
    } finally {
      setSaving(false);
    }
  }

  async function deleteRole(id) {
    setError('');
    try {
      await api.delete(`/roles/${id}`);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo eliminar el rol');
    }
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex items-end gap-2">
          <div className="flex-1 grid sm:grid-cols-2 gap-2">
            <input className="input input-bordered w-full" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <input className="input input-bordered w-full" placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <button className={`btn btn-primary ${saving ? 'loading' : ''}`} onClick={createRole} disabled={!nombre || saving}>
            <Plus size={16} /> {saving ? 'Creando...' : 'Crear rol'}
          </button>
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card bg-base-200/90 border border-primary/30 shadow-xl">
        <div className="card-body p-0">
          <div className="overflow-x-auto rounded-2xl">
            <table className="table table-zebra text-base-content">
              <thead className="bg-secondary/20 text-secondary-content/80">
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  {isAdmin && <th className="text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="hover">
                    <td className="font-semibold">{r.nombre}</td>
                    <td>{r.descripcion || '-'}</td>
                    {isAdmin && (
                      <td className="text-right">
                        <button className="btn btn-ghost btn-sm text-error" onClick={() => deleteRole(r.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
