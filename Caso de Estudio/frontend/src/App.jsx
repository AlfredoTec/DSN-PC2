import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RoleGuard from './components/RoleGuard.jsx'
import Login from './pages/Login.jsx'
import MfaVerify from './pages/MfaVerify.jsx'
import EnableMfa from './pages/EnableMfa.jsx'
import Dashboard from './pages/Dashboard.jsx'
import RolesPage from './pages/RolesPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import StoresPage from './pages/StoresPage.jsx'
import ProductForm from './pages/ProductForm.jsx'
import Profile from './pages/Profile.jsx'
import AccessDenied from './pages/AccessDenied.jsx'
import NotFound from './pages/NotFound.jsx'
import { useAuth } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'

function App() {
  const { token } = useAuth()
  return (
    <>
      {token && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/mfa" element={<MfaVerify />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/enable-mfa" element={<EnableMfa />} />
          <Route
            path="/roles"
            element={<RolesPage />}
          />
          <Route
            path="/stores"
            element={
              <RoleGuard roles={['Admin']}>
                <StoresPage />
              </RoleGuard>
            }
          />
          <Route
            path="/users"
            element={
              <RoleGuard roles={['Admin','Gerente']}>
                <UsersPage />
              </RoleGuard>
            }
          />
          <Route
            path="/products"
            element={
              <RoleGuard roles={['Admin','Gerente','Empleado','Auditor']}>
                <ProductsPage />
              </RoleGuard>
            }
          />
          <Route
            path="/products/new"
            element={
              <RoleGuard roles={['Admin','Gerente']}>
                <ProductForm />
              </RoleGuard>
            }
          />
          <Route
            path="/products/:id"
            element={
              <RoleGuard roles={['Admin','Gerente','Empleado']}>
                <ProductForm />
              </RoleGuard>
            }
          />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="/403" element={<AccessDenied />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
