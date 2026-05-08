import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import * as storesApi from '../services/stores.js'
import { disableMfa } from '../services/auth.js'

function Profile() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const hasMfa = user?.mfa_habilitado === true || user?.mfa_enabled === true || user?.mfaEnabled === true
  const [storeLabel, setStoreLabel] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(()=>{
    let ignore = false
    async function load(){
      try {
        if (user?.tienda_id) {
          const tiendas = await storesApi.list()
          const t = tiendas.find(x=>x.id === user.tienda_id)
          if (!ignore) setStoreLabel(t ? `${t.nombre}, ${t.ubicacion}` : `Tienda ${user.tienda_id}`)
        } else {
          if (!ignore) setStoreLabel('-')
        }
      } catch {
        if (!ignore) setStoreLabel(`Tienda ${user?.tienda_id ?? '-'}`)
      }
    }
    load()
    return ()=>{ ignore = true }
  }, [user?.tienda_id])

  const initial = useMemo(()=> (user?.email ? user.email.charAt(0).toUpperCase() : 'U'), [user?.email])
  const roleDescriptions = useMemo(()=>({
    Admin: 'Acceso total',
    Gerente: 'Gestiona su tienda',
    Empleado: 'Opera stock en su tienda',
    Auditor: 'Solo lectura',
  }), [])

  const onDisableMfa = async () => {
    setError('')
    setStatus('')
    try {
      const res = await disableMfa()
      setStatus(res?.message || 'MFA deshabilitado')
      if (user) setUser({ ...user, mfa_habilitado: false, mfa_enabled: false, mfaEnabled: false })
    } catch (e) {
      setError(e?.response?.data?.message || 'No se pudo deshabilitar MFA')
    }
  }

  return (
    <Container sx={{ mt: 4, maxWidth: '800px' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Mi Perfil</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {status && <Alert severity="success" sx={{ mb: 2 }}>{status}</Alert>}
      <Card elevation={1}>
        <CardContent>
          <Stack direction={{ xs:'column', sm:'row' }} spacing={3} alignItems={{ xs:'flex-start', sm:'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>{initial}</Avatar>
            <Stack spacing={0.5} flex={1} minWidth={0}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{user?.email}</Typography>
              <Typography variant="body2" color="text.secondary">{storeLabel || '-'}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap:'wrap' }}>
                {(user?.roles || []).map(r => <Chip key={r} label={r} size="small" />)}
                <Chip label={`MFA: ${hasMfa ? 'Activado' : 'No activado'}`} size="small" color={hasMfa ? 'success' : 'default'} variant={hasMfa ? 'filled' : 'outlined'} />
              </Stack>
            </Stack>
            <Stack direction={{ xs:'column', sm:'row' }} spacing={1}>
              {!hasMfa && <Button variant="contained" onClick={()=>navigate('/enable-mfa')}>Habilitar MFA</Button>}
              {hasMfa && <Button variant="outlined" color="error" onClick={onDisableMfa}>Deshabilitar MFA</Button>}
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack direction={{ xs:'column', sm:'row' }} spacing={4}>
            <Stack spacing={0.5}>
              <Typography variant="overline">Usuario</Typography>
              <Typography variant="body2">Nombre: {user?.nombre_completo || '-'}</Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="overline">Tienda</Typography>
              <Typography variant="body2">{storeLabel || '-'}</Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="overline">Descripción de rol</Typography>
              {(user?.roles || []).map(r => (
                <Typography key={r} variant="body2">{r}: {roleDescriptions[r] || '-'}</Typography>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}

export default Profile
