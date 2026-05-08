import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const { api } = useAuth();
  const nav = useNavigate();
  const [tiendas, setTiendas] = useState([]);
  const [tiendasLoading, setTiendasLoading] = useState(true);
  const [tiendasError, setTiendasError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '', nombreCompleto: '', tiendaId: '' });

  useEffect(() => {
    (async () => {
      setTiendasLoading(true);
      setTiendasError('');
      try {
        const { data } = await api.get('/public/tiendas');
        setTiendas(data);
        if (!form.tiendaId && data.length > 0) {
          setForm((f) => ({ ...f, tiendaId: String(data[0].id) }));
        }
      } catch (e) {
        setTiendasError('No se pudieron cargar las tiendas');
      } finally {
        setTiendasLoading(false);
      }
    })();
  }, []);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
        nombreCompleto: form.nombreCompleto.trim(),
        tiendaId: Number(form.tiendaId),
      };
      await api.post('/auth/register', payload);
      toast.success('Registro exitoso. Ahora puedes iniciar sesión');
      nav('/login');
    } catch (e) {
      const msg = e?.response?.data?.message || (e?.response?.data?.errors?.map(x => x.msg).join(', ')) || 'No se pudo completar el registro';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="card bg-base-100/70 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">Crear cuenta</h2>
          <p className="opacity-70 text-sm">Tu cuenta se crea con rol por defecto <span className="font-semibold">Empleado</span>.</p>
          <form onSubmit={handleRegister} className="mt-4 space-y-3">
            <input className="input input-bordered w-full" placeholder="Email" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
            <input className="input input-bordered w-full" placeholder="Password (min 8, 1 mayúscula, 1 dígito, 1 símbolo)" type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} required />
            <input className="input input-bordered w-full" placeholder="Nombre completo" value={form.nombreCompleto} onChange={(e)=>setForm({...form, nombreCompleto:e.target.value})} required />
            <select
              className="select select-bordered w-full"
              value={form.tiendaId}
              onChange={(e)=>setForm({...form, tiendaId:e.target.value})}
              disabled={tiendasLoading || tiendas.length === 0}
              required
            >
              <option value="" disabled>Selecciona tienda</option>
              {tiendas.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
            {tiendasLoading && <div className="text-sm opacity-70">Cargando tiendas...</div>}
            {!tiendasLoading && tiendasError && <div className="alert alert-error text-sm">{tiendasError}</div>}
            {error && <div className="alert alert-error text-sm">{error}</div>}
            <button className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} disabled={loading || tiendasLoading || tiendas.length === 0}>
              <UserPlus className="mr-2" size={18} /> Registrarme
            </button>
          </form>
          <div className="text-sm mt-3">
            <span className="opacity-70">¿Ya tienes cuenta?</span> <Link className="link link-primary" to="/login">Inicia sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
