import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const { api, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@techstore.com');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.mfaRequired) {
        sessionStorage.setItem('tempToken', data.tempToken);
        toast('Ingresa tu código MFA para continuar', { icon: '🔐' });
        nav('/verify-mfa');
      } else if (data.token) {
        login(data.token);
        toast.success('Inicio de sesión exitoso');
        nav('/productos');
      }
    } catch (e) {
      const msg = e?.response?.data?.message || 'Error al iniciar sesión';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="card bg-base-100/70 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">Bienvenido a <span className="text-primary font-bold">TechStore</span></h2>
          <p className="opacity-70">Inicia sesión para continuar</p>
          <form onSubmit={handleLogin} className="mt-4 space-y-3">
            <input className="input input-bordered w-full" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input input-bordered w-full" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <div className="alert alert-error text-sm">{error}</div>}
            <button className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} disabled={loading}>
              <ShieldCheck className="mr-2" size={18} /> Entrar
            </button>
          </form>
          <div className="text-sm mt-3">
            <span className="opacity-70">¿No tienes cuenta?</span> <Link className="link link-primary" to="/register">Crear cuenta</Link>
          </div>
          <div className="divider">MFA</div>
          <p className="text-sm opacity-70">Si tienes MFA habilitado, te pediremos el código de 6 dígitos en el siguiente paso.</p>
        </div>
      </div>
    </div>
  );
}
