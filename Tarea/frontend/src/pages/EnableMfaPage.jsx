import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import QRCode from 'react-qr-code';
import { toast } from 'react-hot-toast';

export default function EnableMfaPage() {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  async function handleEnable() {
    setError('');
    try {
      const { data } = await api.post('/auth/enable-mfa');
      setData(data);
      setVerified(false);
      setCode('');
      toast.success('MFA habilitado. Escanea el código en tu app');
    } catch (e) {
      setError(e?.response?.data?.message || 'Error habilitando MFA');
      toast.error(e?.response?.data?.message || 'Error habilitando MFA');
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setVerifying(true);
    setError('');
    try {
      await api.post('/auth/enable-mfa/verify-code', { codigoTOTP: code.trim() });
      setVerified(true);
      toast.success('Código verificado. MFA activo.');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Código MFA inválido';
      setError(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="card bg-base-100/70 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Habilitar MFA</h2>
          <p className="opacity-70">Genera un secreto y escanéalo en Google Authenticator.</p>
          <button className="btn btn-primary w-full" onClick={handleEnable}>Generar secreto</button>
          {error && <div className="alert alert-error mt-2">{error}</div>}
          {data && (
            <div className="mt-4 grid gap-4">
              <div className="flex justify-center">
                <QRCode value={data.otpauth_url} fgColor="#06b6d4" bgColor="transparent" />
              </div>
              <div className="mockup-code text-sm">
                <pre data-prefix=">"><code>otpauth_url:</code></pre>
                <pre data-prefix="$"><code>{data.otpauth_url}</code></pre>
                <pre data-prefix=">"><code>secret (base32):</code></pre>
                <pre data-prefix="$"><code>{data.secret}</code></pre>
              </div>
              <form className="space-y-2" onSubmit={handleVerify}>
                <label className="font-semibold text-sm uppercase tracking-wide text-primary">Verifica tu código</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength="6"
                  className="input input-bordered w-full"
                  placeholder="Ingresa el código de 6 dígitos"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                />
                <button type="submit" className={`btn btn-success w-full ${verifying ? 'loading' : ''}`} disabled={verifying || code.length !== 6}>
                  Confirmar MFA
                </button>
                {verified && <div className="alert alert-success text-sm">Tu cuenta ya requiere MFA para iniciar sesión.</div>}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
