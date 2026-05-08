import React from 'react'
import { Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

function AccessDenied() {
  return (
    <Container sx={{ mt: 8, textAlign:'center' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>403 - Acceso denegado</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>No tienes permisos para acceder a este recurso.</Typography>
      <Button component={Link} to="/dashboard" variant="contained">Volver al Dashboard</Button>
    </Container>
  )
}

export default AccessDenied
