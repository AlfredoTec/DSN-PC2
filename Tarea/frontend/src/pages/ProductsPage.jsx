import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Plus, RefreshCcw, Search } from 'lucide-react';

export default function ProductsPage() {
  const { api, user, roles } = useAuth();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', stock: '', categoria: '', tiendaId: '', esPremium: false });
  const [editId, setEditId] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [tiendas, setTiendas] = useState([]);
  const [toast, setToast] = useState(null); // {type:'success'|'error', message:string}
  const [categorias, setCategorias] = useState([]);
  const [tiendaFiltro, setTiendaFiltro] = useState('');
  const [currency, setCurrency] = useState(() => localStorage.getItem('products.currency') || 'PEN');
  const [exchangeRate, setExchangeRate] = useState(() => {
    const v = localStorage.getItem('products.exchangeRate');
    return v ? Number(v) : 3.46;
  });

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/productos');
      setItems(data);
      setError('');
    } catch (e) {
      setItems([]);
      setError(e?.response?.data?.message || 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    localStorage.setItem('products.currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('products.exchangeRate', String(exchangeRate));
  }, [exchangeRate]);
  

  function openDelete(p) {
    setDeleteTarget(p);
    setShowDelete(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await api.delete(`/productos/${deleteTarget.id}`);
      setShowDelete(false);
      setDeleteTarget(null);
      await load();
      setToast({ type: 'success', message: 'Producto eliminado' });
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo eliminar el producto');
      setToast({ type: 'error', message: e?.response?.data?.message || 'No se pudo eliminar el producto' });
    } finally {
      setDeleting(false);
    }
  }
  

  useEffect(() => {
    load();
    (async () => {
      try {
        const { data } = await api.get('/tiendas');
        setTiendas(data);
      } catch (e) {
        // silencioso; se mostrará input numérico si falla
      }
      try {
        const { data } = await api.get('/productos/categorias');
        setCategorias(data);
      } catch (e) {
        // silencioso; usaremos input libre
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((p) =>
      [p.nombre, p.descripcion, p.categoria].some((s) => String(s || '').toLowerCase().includes(t))
    );
  }, [q, items]);

  const tiendasFiltradas = useMemo(() => {
    const s = tiendaFiltro.trim().toLowerCase();
    if (!s) return tiendas;
    return tiendas.filter(t => t.nombre.toLowerCase().includes(s));
  }, [tiendas, tiendaFiltro]);

  const totalItems = useMemo(() => filtered.reduce((acc, p) => acc + Number(p.stock || 0), 0), [filtered]);
  const fmtPrice = (vPen) => {
    const rate = Number(exchangeRate) > 0 ? Number(exchangeRate) : 1;
    const value = currency === 'PEN' ? Number(vPen || 0) : Number(vPen || 0) / rate;
    const locale = currency === 'PEN' ? 'es-PE' : 'en-US';
    const code = currency === 'PEN' ? 'PEN' : 'USD';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(value);
  };
  const totalValue = useMemo(() => filtered.reduce((acc, p) => acc + (Number(p.precio || 0) * Number(p.stock || 0)), 0), [filtered]);

  const canEdit = roles.includes('Administrador') || roles.includes('Gerente') || roles.includes('Empleado');
  const canCreate = roles.includes('Administrador') || roles.includes('Gerente');

  function canDeleteProduct(p) {
    if (roles.includes('Administrador')) return true;
    if (roles.includes('Gerente')) return p.tiendaId === user?.tiendaId && !p.esPremium;
    return false; // Empleado y Auditor no pueden
  }

  function openCreate() {
    if (!canCreate) return;
    setForm({ nombre: '', descripcion: '', precio: '', stock: '', categoria: '', tiendaId: user?.tiendaId || '', esPremium: false });
    setShowCreate(true);
  }

  function openEdit(p) {
    setEditId(p.id);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio: p.precio,
      stock: p.stock,
      categoria: p.categoria,
      tiendaId: p.tiendaId,
      esPremium: p.esPremium,
    });
    setShowEdit(true);
  }

  async function submitCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // ABAC: Empleado solo puede crear no premium en su tienda
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio: Number(form.precio),
        stock: Number(form.stock),
        categoria: form.categoria.trim(),
        tiendaId: Number(form.tiendaId),
        esPremium: Boolean(form.esPremium),
      };
      await api.post('/productos', payload);
      setShowCreate(false);
      await load();
      setToast({ type: 'success', message: 'Producto creado' });
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo crear el producto');
      setToast({ type: 'error', message: e?.response?.data?.message || 'No se pudo crear el producto' });
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // ABAC: Gerente no puede cambiar categoria; Empleado solo stock.
      const update = {};
      if (roles.includes('Administrador')) {
        Object.assign(update, {
          nombre: form.nombre,
          descripcion: form.descripcion || null,
          precio: Number(form.precio),
          stock: Number(form.stock),
          categoria: form.categoria,
          tiendaId: Number(form.tiendaId),
          esPremium: Boolean(form.esPremium),
        });
      } else if (roles.includes('Gerente')) {
        Object.assign(update, {
          nombre: form.nombre,
          descripcion: form.descripcion || null,
          precio: Number(form.precio),
          stock: Number(form.stock),
          // categoria omitida por política
          tiendaId: Number(form.tiendaId),
          esPremium: Boolean(form.esPremium),
        });
      } else if (roles.includes('Empleado')) {
        Object.assign(update, {
          stock: Number(form.stock),
        });
      }
      await api.put(`/productos/${editId}`, update);
      setShowEdit(false);
      await load();
      setToast({ type: 'success', message: 'Producto actualizado' });
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo actualizar el producto');
      setToast({ type: 'error', message: e?.response?.data?.message || 'No se pudo actualizar el producto' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="font-bold text-2xl">Productos</div>
        <div className="flex gap-2">
          <button className={`btn btn-outline btn-sm ${loading ? 'loading' : ''}`} onClick={load}>
            <RefreshCcw size={16} />
            <span className="ml-2 hidden sm:inline">Refrescar</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate} disabled={!canCreate}>
            <Plus size={16} />
            <span className="ml-2 hidden sm:inline">Nuevo</span>
          </button>
        </div>
      </div>

      <div className="form-control">
        <label className="input input-bordered flex items-center gap-2">
          <Search size={16} />
          <input type="text" className="grow" placeholder="Buscar por nombre, descripción o categoría" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="label p-0"><span className="label-text">Moneda</span></label>
        <select className="select select-bordered select-sm" value={currency} onChange={(e)=>setCurrency(e.target.value)}>
          <option value="PEN">PEN</option>
          <option value="USD">USD</option>
        </select>
        <input
          type="number"
          step="0.0001"
          min="0.0001"
          className="input input-bordered input-sm w-40"
          placeholder="TC PEN/USD"
          value={exchangeRate}
          onChange={(e)=>setExchangeRate(Number(e.target.value))}
          disabled={currency === 'PEN'}
        />
        <span className="text-xs opacity-70">Tipo de cambio: PEN por 1 USD</span>
      </div>

      <div className="stats shadow-xl bg-base-200/90 border border-primary/40 text-base-content rounded-2xl">
        <div className="stat">
          <div className="stat-title uppercase tracking-wide text-primary font-semibold">Productos</div>
          <div className="stat-value text-4xl font-black text-primary">{filtered.length}</div>
          <div className="stat-desc text-primary/70">En catálogo</div>
        </div>
        <div className="stat">
          <div className="stat-title uppercase tracking-wide text-secondary font-semibold">Total items</div>
          <div className="stat-value text-4xl font-black text-secondary">{totalItems}</div>
          <div className="stat-desc text-secondary/70">Unidades disponibles</div>
        </div>
        <div className="stat">
          <div className="stat-title uppercase tracking-wide text-accent font-semibold">Valor inventario</div>
          <div className="stat-value text-4xl font-black text-accent">{fmtPrice(totalValue)}</div>
          <div className="stat-desc text-accent/70">Equivalente actual</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="card bg-base-200 text-base-content shadow-2xl border border-primary/40 hover:border-primary/70 hover:-translate-y-0.5 transition"
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <h3 className="card-title text-primary font-bold">{p.nombre}</h3>
                <div className="flex items-center gap-2">
                  <div className="text-primary font-black text-lg">{fmtPrice(p.precio)}</div>
                  {p.esPremium && <span className="badge badge-warning text-xs">Premium</span>}
                </div>
              </div>
              <p className="opacity-80 truncate">{p.descripcion || 'Sin descripción'}</p>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="badge badge-neutral badge-sm">Categoria: {p.categoria}</span>
                <span className="badge badge-neutral badge-sm">Tienda: {p.tiendaId}</span>
                <span className="badge badge-neutral badge-sm">Stock: {p.stock}</span>
              </div>
              <div className="card-actions justify-end mt-2">
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)} disabled={!canEdit}>Editar</button>
                <button className="btn btn-outline btn-error btn-sm" onClick={() => openDelete(p)} disabled={!canDeleteProduct(p)}>Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="alert alert-info">No hay productos para mostrar.</div>
      )}

      {/* Modal Crear */}
      {showCreate && (
        <dialog className="modal" open>
          <div className="modal-box bg-base-200 text-base-content border border-primary/40 shadow-2xl">
            <h3 className="font-bold text-xl text-primary">Nuevo producto</h3>
            <p className="text-sm opacity-70">Completa la información para agregarlo al catálogo.</p>
            <form className="space-y-3 mt-4" onSubmit={submitCreate}>
              <div className="grid md:grid-cols-2 gap-3">
                <input className="input input-bordered w-full" placeholder="Nombre" value={form.nombre} onChange={(e)=>setForm({...form, nombre:e.target.value})} required />
                <input className="input input-bordered w-full" placeholder="Categoría" list="cat-list" value={form.categoria} onChange={(e)=>setForm({...form, categoria:e.target.value})} required />
              </div>
              <datalist id="cat-list">
                {categorias.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <textarea className="textarea textarea-bordered w-full" placeholder="Descripción (opcional)" value={form.descripcion} onChange={(e)=>setForm({...form, descripcion:e.target.value})} rows={3} />
              <div className="grid md:grid-cols-2 gap-3">
                <input className="input input-bordered w-full" placeholder="Precio" type="number" step="0.01" value={form.precio} onChange={(e)=>setForm({...form, precio:e.target.value})} required />
                <input className="input input-bordered w-full" placeholder="Stock" type="number" value={form.stock} onChange={(e)=>setForm({...form, stock:e.target.value})} required />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {tiendas.length > 0 ? (
                  <div className="space-y-2">
                    <input className="input input-bordered w-full" placeholder="Filtrar tienda" value={tiendaFiltro} onChange={(e)=>setTiendaFiltro(e.target.value)} />
                    <select className="select select-bordered w-full" value={form.tiendaId} onChange={(e)=>setForm({...form, tiendaId:e.target.value})} required>
                      <option value="" disabled>Selecciona tienda</option>
                      {tiendasFiltradas.map(t => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <input className="input input-bordered w-full" placeholder="Tienda ID" type="number" value={form.tiendaId} onChange={(e)=>setForm({...form, tiendaId:e.target.value})} required />
                )}
                <label className="label cursor-pointer justify-between bg-base-100 p-3 rounded-xl border border-primary/20">
                  <div>
                    <span className="label-text font-semibold">Producto premium</span>
                    <p className="text-xs opacity-70">Solo Gerentes/Admin pueden gestionarlos</p>
                  </div>
                  <input type="checkbox" className="toggle toggle-warning" checked={form.esPremium} onChange={(e)=>setForm({...form, esPremium:e.target.checked})} />
                </label>
              </div>
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

      {/* Modal Editar */}
      {showEdit && (
        <dialog className="modal" open>
          <div className="modal-box">
            <h3 className="font-bold text-lg">Editar producto</h3>
            <form className="space-y-2 mt-3" onSubmit={submitEdit}>
              <input className="input input-bordered w-full" placeholder="Nombre" value={form.nombre} onChange={(e)=>setForm({...form, nombre:e.target.value})} required disabled={roles.includes('Empleado')} />
              <input className="input input-bordered w-full" placeholder="Descripción" value={form.descripcion} onChange={(e)=>setForm({...form, descripcion:e.target.value})} disabled={roles.includes('Empleado')} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input input-bordered w-full" placeholder="Precio" type="number" step="0.01" value={form.precio} onChange={(e)=>setForm({...form, precio:e.target.value})} disabled={roles.includes('Empleado')} />
                <input className="input input-bordered w-full" placeholder="Stock" type="number" value={form.stock} onChange={(e)=>setForm({...form, stock:e.target.value})} required />
              </div>
              <input className="input input-bordered w-full" placeholder="Categoría" list="cat-list" value={form.categoria} onChange={(e)=>setForm({...form, categoria:e.target.value})} disabled={roles.includes('Empleado') || roles.includes('Gerente')} />
              <div className="grid grid-cols-2 gap-2 items-center">
                {tiendas.length > 0 ? (
                  <div className="w-full space-y-2">
                    <input className="input input-bordered w-full" placeholder="Filtrar tienda" value={tiendaFiltro} onChange={(e)=>setTiendaFiltro(e.target.value)} disabled={roles.includes('Empleado') || roles.includes('Gerente')} />
                    <select className="select select-bordered w-full" value={form.tiendaId} onChange={(e)=>setForm({...form, tiendaId:e.target.value})} disabled={roles.includes('Empleado') || roles.includes('Gerente')}>
                      <option value="" disabled>Selecciona tienda</option>
                      {tiendasFiltradas.map(t => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <input className="input input-bordered w-full" placeholder="Tienda ID" type="number" value={form.tiendaId} onChange={(e)=>setForm({...form, tiendaId:e.target.value})} disabled={roles.includes('Empleado') || roles.includes('Gerente')} />
                )}
                <label className="label cursor-pointer justify-end gap-2">
                  <span className="label-text">Premium</span>
                  <input type="checkbox" className="toggle toggle-warning" checked={form.esPremium} onChange={(e)=>setForm({...form, esPremium:e.target.checked})} disabled={roles.includes('Empleado')} />
                </label>
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={()=>setShowEdit(false)}>Cancelar</button>
                <button type="submit" className={`btn btn-primary ${saving ? 'loading' : ''}`} disabled={saving}>Guardar</button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={()=>setShowEdit(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}

      {/* Toast Notifications */}
      {toast && (
        <div className={`toast toast-end z-50`}>
          <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            <span>{toast.message}</span>
            <button className="btn btn-xs ml-2" onClick={()=>setToast(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showDelete && (
        <dialog className="modal" open>
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirmar eliminación</h3>
            <p className="py-3">¿Seguro que deseas eliminar el producto <span className="font-semibold">{deleteTarget?.nombre}</span>?</p>
            <div className="modal-action">
              <button className="btn" onClick={()=>setShowDelete(false)}>Cancelar</button>
              <button className={`btn btn-error ${deleting ? 'loading' : ''}`} onClick={confirmDelete} disabled={deleting}>Eliminar</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={()=>setShowDelete(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}

