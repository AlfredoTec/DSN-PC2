import React from 'react'
import { Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

function NotFound() {
  return (
    <Container sx={{ mt: 8, textAlign:'center' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>404 - No encontrado</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>La página solicitada no existe.</Typography>
      <Button component={Link} to="/dashboard" variant="contained">Volver al Dashboard</Button>
    </Container>
  )
}

export default NotFound
