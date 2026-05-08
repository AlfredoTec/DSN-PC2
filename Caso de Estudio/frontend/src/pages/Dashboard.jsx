import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

function Dashboard() {
  const { user } = useAuth()
  const roles = user?.roles || []
  const has = (r) => roles.includes(r)

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Dashboard</Typography>
      <Grid container spacing={2}>
        {(has('Admin') || has('Gerente') || has('Empleado') || has('Auditor')) && (
          <Grid item xs={12} sm={6} md={3}><NavCard title="Productos" to="/products" /></Grid>
        )}
        {has('Admin') && (<Grid item xs={12} sm={6} md={3}><NavCard title="Roles" to="/roles" /></Grid>)}
        {(has('Admin') || has('Gerente')) && (<Grid item xs={12} sm={6} md={3}><NavCard title="Usuarios" to="/users" /></Grid>)}
        <Grid item xs={12} sm={6} md={3}><NavCard title="Perfil" to="/profile" /></Grid>
        <Grid item xs={12} sm={6} md={3}><NavCard title="Habilitar MFA" to="/enable-mfa" /></Grid>
      </Grid>
    </Container>
  )
}

function NavCard({ title, to }) {
  return (
    <Card>
      <CardActionArea component={Link} to={to}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default Dashboard
