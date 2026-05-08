import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-hot-toast';

export default function VerifyMfaPage() {
  const { api, login } = useAuth();
  const nav = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tempToken = sessionStorage.getItem('tempToken');
      const { data } = await api.post('/auth/verify-mfa', { tempToken, codigoTOTP: code });
      if (data.token) {
        login(data.token);
        sessionStorage.removeItem('tempToken');
        toast.success('MFA verificado. Bienvenido');
        nav('/productos');
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Error verificando MFA');
      toast.error(e?.response?.data?.message || 'Error verificando MFA');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="card bg-base-100/70 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Verificar MFA</h2>
          <form onSubmit={handleVerify} className="space-y-3">
            <input className="input input-bordered w-full" placeholder="Código 6 dígitos" value={code} onChange={(e) => setCode(e.target.value)} />
            {error && <div className="alert alert-error text-sm">{error}</div>}
            <button className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} disabled={loading}>Verificar</button>
          </form>
        </div>
      </div>
    </div>
  );
}
