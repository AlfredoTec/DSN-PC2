import React, { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import { useAuth } from '../context/AuthContext.jsx'
import * as storesApi from '../services/stores.js'

function Navbar() {
  const { user, logout } = useAuth()
  const roles = user?.roles || []
  const hasRole = (r) => roles.includes(r)
  const [storeLabel, setStoreLabel] = useState('')

  useEffect(()=>{
    let ignore = false
    async function load(){
      try {
        if (user?.tienda_id) {
          const tiendas = await storesApi.list()
          const t = tiendas.find(x=>Number(x.id) === Number(user.tienda_id))
          if (!ignore) setStoreLabel(t ? `${t.nombre}, ${t.ubicacion}` : 'Tienda no encontrada')
        } else {
          if (!ignore) setStoreLabel('-')
        }
      } catch {
        if (!ignore) setStoreLabel('Tienda no disponible')
      }
    }
    load()
    return ()=>{ ignore = true }
  }, [user?.tienda_id])

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ gap: 1 }}>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mr: 2 }} component={RouterLink} to="/dashboard" style={{ textDecoration:'none' }}>
          TechStore
        </Typography>

        {(hasRole('Admin') || hasRole('Gerente') || hasRole('Empleado') || hasRole('Auditor')) && (
          <Button component={RouterLink} to="/products" color="primary">Productos</Button>
        )}
        {(hasRole('Admin') || hasRole('Gerente') || hasRole('Empleado') || hasRole('Auditor')) && (
          <Button component={RouterLink} to="/roles">Roles</Button>
        )}
        {hasRole('Admin') && (
          <Button component={RouterLink} to="/stores">Tiendas</Button>
        )}
        {(hasRole('Admin') || hasRole('Gerente')) && (
          <Button component={RouterLink} to="/users">Usuarios</Button>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={user?.nombre_completo || ''} size="small" />
          <Divider orientation="vertical" flexItem />
          <Chip label={storeLabel || '-'} size="small" variant="outlined" />
          {roles.length > 0 && <Chip label={roles.join(', ')} size="small" variant="outlined" />}
          <Button component={RouterLink} to="/profile">Perfil</Button>
          <Button variant="contained" color="primary" onClick={logout}>Salir</Button>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
