import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { UserPlus, Shield } from 'lucide-react';

export default function UsersPage() {
  const { api, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '', nombreCompleto: '', tiendaId: '', roleIds: [] });

  async function load() {
    const { data } = await api.get('/usuarios');
    setUsers(data);
  }

  useEffect(() => {
    (async () => {
      await load();
      try {
        const [rRes, tRes] = await Promise.all([
          api.get('/roles'),
          api.get('/tiendas'),
        ]);
        setRoles(rRes.data);
        setTiendas(tRes.data);
        // Preselecciona Empleado si existe
        const empleado = rRes.data.find(r => r.nombre === 'Empleado');
        if (empleado) setForm(f => ({ ...f, roleIds: [empleado.id] }));
      } catch (e) {
        // silencioso
      }
    })();
  }, []);

  function openCreate() {
    setForm({ email: '', password: '', nombreCompleto: '', tiendaId: '', roleIds: form.roleIds?.length ? form.roleIds : [] });
    setShowCreate(true);
  }

  function toggleRole(id) {
    setForm((f) => {
      const exists = f.roleIds.includes(id);
      return { ...f, roleIds: exists ? f.roleIds.filter(x => x !== id) : [...f.roleIds, id] };
    });
  }

  async function submitCreate(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
        nombreCompleto: form.nombreCompleto.trim(),
        tiendaId: Number(form.tiendaId),
        roleIds: form.roleIds,
      };
      await api.post('/usuarios', payload);
      setShowCreate(false);
      await load();
      setToast({ type: 'success', message: 'Usuario creado' });
    } catch (e) {
      const msg = e?.response?.data?.message || 'No se pudo crear el usuario';
      setError(msg);
      setToast({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u) {
    try {
      await api.put(`/usuarios/${u.id}`, { activo: !u.activo });
      await load();
      setToast({ type: 'success', message: u.activo ? 'Usuario desactivado' : 'Usuario reactivado' });
    } catch (e) {
      setToast({ type: 'error', message: e?.response?.data?.message || 'No se pudo actualizar el usuario' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">Usuarios</div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm" onClick={openCreate}><UserPlus size={16} /> Nuevo</button>
          <a href="/enable-mfa" className="btn btn-primary btn-sm"><Shield size={16} /> Habilitar MFA</a>
        </div>
      </div>
      <div className="card bg-base-200/90 border border-primary/30 shadow-xl">
        <div className="card-body p-0">
          <div className="overflow-x-auto rounded-2xl">
            <table className="table table-zebra text-base-content">
              <thead className="bg-secondary/20 text-secondary-content/80">
                <tr>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Tienda</th>
                  <th>Roles</th>
                  <th>Activo</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="hover">
                    <td className="font-semibold">{u.email}</td>
                    <td>{u.nombreCompleto}</td>
                    <td>{u.tienda}</td>
                    <td>{u.roles.join(', ')}</td>
                    <td>{u.activo ? 'Sí' : 'No'}</td>
                    <td className="text-right">
                      <div className="tooltip" data-tip={u.id === user?.id ? 'No puedes desactivarte a ti mismo' : ''}>
                        <button
                          className={`btn btn-sm ${u.activo ? 'btn-outline' : 'btn-success'}`}
                          onClick={() => toggleActive(u)}
                          disabled={u.id === user?.id}
                        >
                          {u.activo ? 'Desactivar' : 'Reactivar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {showCreate && (
        <dialog className="modal" open>
          <div className="modal-box bg-base-200 text-base-content border border-primary/40 shadow-2xl">
            <h3 className="font-bold text-lg">Nuevo usuario</h3>
            <form className="space-y-2 mt-3" onSubmit={submitCreate}>
              <input className="input input-bordered w-full" placeholder="Email" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
              <input className="input input-bordered w-full" placeholder="Password" type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} required />
              <input className="input input-bordered w-full" placeholder="Nombre completo" value={form.nombreCompleto} onChange={(e)=>setForm({...form, nombreCompleto:e.target.value})} required />
              {tiendas.length > 0 ? (
                <select className="select select-bordered w-full" value={form.tiendaId} onChange={(e)=>setForm({...form, tiendaId:e.target.value})} required>
                  <option value="" disabled>Selecciona tienda</option>
                  {tiendas.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              ) : (
                <input className="input input-bordered w-full" placeholder="Tienda ID" type="number" value={form.tiendaId} onChange={(e)=>setForm({...form, tiendaId:e.target.value})} required />
              )}
              <div className="border border-primary/30 rounded-md p-3 bg-base-100">
                <div className="font-semibold mb-2">Roles</div>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map(r => (
                    <label key={r.id} className="label cursor-pointer justify-start gap-2">
                      <input type="checkbox" className="checkbox" checked={form.roleIds.includes(r.id)} onChange={()=>toggleRole(r.id)} />
                      <span className="label-text">{r.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="modal-action">
                <button type="button" className="btn" onClick={()=>setShowCreate(false)}>Cancelar</button>
                <button type="submit" className={`btn btn-primary ${saving ? 'loading' : ''}`} disabled={saving}>Crear</button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={()=>setShowCreate(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast toast-end z-50">
          <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            <span>{toast.message}</span>
            <button className="btn btn-xs ml-2" onClick={()=>setToast(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
