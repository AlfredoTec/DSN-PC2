import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import QRCode from 'react-qr-code';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { api, user, roles } = useAuth();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [mfaInfo, setMfaInfo] = useState(null); // { otpauth_url, secret }
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadMe() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/auth/me');
      setMe(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMe(); }, []);

  async function handleEnableMfa() {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/enable-mfa');
      setMfaInfo(data);
      toast('Escanea el QR y confirma tu código', { icon: '🔐' });
    } catch (e) {
      const msg = e?.response?.data?.message || 'No se pudo habilitar MFA';
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyMfa(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/enable-mfa/verify-code', { codigoTOTP: code.trim() });
      setMfaInfo(null);
      setCode('');
      toast.success('MFA activado');
      await loadMe();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Código MFA inválido';
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleDisableMfa() {
    if (!confirm('¿Seguro que deseas desactivar MFA?')) return;
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/disable-mfa');
      toast.success('MFA deshabilitado');
      await loadMe();
    } catch (e) {
      const msg = e?.response?.data?.message || 'No se pudo deshabilitar MFA';
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="alert">Cargando...</div>}

      {me && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card bg-base-200/90 border border-primary/30 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Datos de usuario</h2>
              <div className="grid grid-cols-1 gap-2">
                <div><span className="opacity-70 text-sm">Nombre</span><div className="font-semibold">{me.nombreCompleto}</div></div>
                <div><span className="opacity-70 text-sm">Email</span><div className="font-semibold">{me.email}</div></div>
                <div><span className="opacity-70 text-sm">Tienda</span><div className="font-semibold">{me.tienda?.nombre}</div></div>
                <div><span className="opacity-70 text-sm">Roles</span><div className="font-semibold">{me.roles.join(', ')}</div></div>
                <div><span className="opacity-70 text-sm">Creado</span><div className="font-semibold">{new Date(me.fechaCreacion).toLocaleString()}</div></div>
              </div>
            </div>
          </div>

          <div className="card bg-base-200/90 border border-primary/30 shadow-xl">
            <div className="card-body">
              <h2 className="card-title flex items-center"><ShieldCheck className="mr-2" size={18} /> MFA</h2>
              <div className="flex items-center justify-between">
                <div className="font-semibold">Estado: {me.mfaHabilitado ? 'Activado' : 'Desactivado'}</div>
                {me.mfaHabilitado ? (
                  <button className={`btn btn-warning btn-sm ${busy ? 'loading' : ''}`} onClick={handleDisableMfa} disabled={busy}>Desactivar MFA</button>
                ) : (
                  <button className={`btn btn-success btn-sm ${busy ? 'loading' : ''}`} onClick={handleEnableMfa} disabled={busy}>Activar MFA</button>
                )}
              </div>

              {mfaInfo && (
                <div className="mt-4 grid gap-3">
                  <div className="p-3 rounded-xl bg-base-100 border border-primary/20 inline-block self-center">
                    <QRCode value={mfaInfo.otpauth_url} size={160} />
                  </div>
                  <div className="text-sm opacity-80">Clave secreta: <span className="font-mono">{mfaInfo.secret}</span></div>
                  <form className="space-y-2" onSubmit={handleVerifyMfa}>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength="6"
                      className="input input-bordered w-full"
                      placeholder="Ingresa el código de 6 dígitos"
                      value={code}
                      onChange={(e)=>setCode(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                    />
                    <button type="submit" className={`btn btn-primary ${busy ? 'loading' : ''}`} disabled={busy || code.length !== 6}>Confirmar MFA</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
