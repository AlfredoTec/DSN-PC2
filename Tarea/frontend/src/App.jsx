import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LogIn, ShieldCheck, Boxes, UsersRound, BadgeCheck, User as UserIcon } from 'lucide-react';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import EnableMfaPage from './pages/EnableMfaPage.jsx';
import VerifyMfaPage from './pages/VerifyMfaPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import RolesPage from './pages/RolesPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import UnauthorizedPage from './pages/UnauthorizedPage.jsx';
import { Toaster, toast } from 'react-hot-toast';

function Layout({ children }) {
  const { token, logout, roles, user } = useAuth();
  const loc = useLocation();
  const isActive = (p) => loc.pathname.startsWith(p);
  const handleLogout = () => { logout(); toast.success('Sesión cerrada'); };

  useEffect(() => {
    const msg = sessionStorage.getItem('flash_warning');
    if (msg) {
      toast(msg, { icon: '⚠️' });
      sessionStorage.removeItem('flash_warning');
    }
  }, [loc.pathname]);

  return (
    <div className="min-h-screen text-white">
      <div className="navbar bg-base-100/60 backdrop-blur border-b border-base-200 sticky top-0 z-30">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost normal-case text-xl">
            <span className="text-primary font-extrabold">Tech</span>Store
          </Link>
        </div>
        <div className="flex-none gap-2">
          {token ? (
            <>
              <Link to="/productos" className={`btn btn-sm btn-ghost ${isActive('/productos') && 'btn-active'}`}>
                <Boxes size={18} />
                <span className="ml-2 hidden sm:inline">Productos</span>
              </Link>
              <Link to="/roles" className={`btn btn-sm btn-ghost ${isActive('/roles') && 'btn-active'}`}>
                <BadgeCheck size={18} />
                <span className="ml-2 hidden sm:inline">Roles</span>
              </Link>
              {roles?.includes('Administrador') && (
                <Link to="/usuarios" className={`btn btn-sm btn-ghost ${isActive('/usuarios') && 'btn-active'}`}>
                  <UsersRound size={18} />
                  <span className="ml-2 hidden sm:inline">Usuarios</span>
                </Link>
              )}
              <Link to="/perfil" className={`btn btn-sm btn-ghost ${isActive('/perfil') && 'btn-active'}`}>
                <UserIcon size={18} />
                <span className="ml-2 hidden sm:inline">Perfil</span>
              </Link>
              <div className="hidden md:flex items-center gap-2 mx-2">
                <div className="badge badge-outline max-w-[160px] truncate" title={user?.nombreCompleto || user?.email}>
                  {user?.nombreCompleto || user?.email}
                </div>
                <div className="badge badge-outline" title={user?.tiendaNombre || (user?.tiendaId ? `ID ${user.tiendaId}` : '')}>
                  {user?.tiendaNombre || (user?.tiendaId ? `ID ${user.tiendaId}` : 'Sin tienda')}
                </div>
                <div className="badge badge-outline" title={roles?.[0] || ''}>
                  {roles?.[0] || '-'}
                </div>
              </div>
              <button className="btn btn-sm btn-error" onClick={handleLogout}>Cerrar sesión</button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn btn-sm btn-primary">
                <LogIn size={18} />
                <span className="ml-2">Ingresar</span>
              </Link>
              <Link to="/register" className="btn btn-sm btn-ghost">
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </div>

      <Toaster position="top-center" />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="py-10 text-center opacity-60">
        <p>© {new Date().getFullYear()} TechStore • Seguridad con MFA, RBAC y ABAC</p>
      </footer>
    </div>
  );
}

function PrivateRoute({ children, roles: needRoles }) {
  const { token, roles } = useAuth();
  const location = useLocation();
  if (!token) {
    sessionStorage.setItem('flash_warning', 'Debes iniciar sesión para acceder a esta página');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (needRoles && !needRoles.some((r) => roles.includes(r))) {
    sessionStorage.setItem('flash_warning', 'No tienes permisos suficientes para acceder a esta página');
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/productos" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/enable-mfa" element={<PrivateRoute><EnableMfaPage /></PrivateRoute>} />
          <Route path="/verify-mfa" element={<VerifyMfaPage />} />
          <Route path="/productos" element={<PrivateRoute><ProductsPage /></PrivateRoute>} />
          <Route path="/roles" element={<PrivateRoute><RolesPage /></PrivateRoute>} />
          <Route path="/usuarios" element={<PrivateRoute roles={['Administrador']}><UsersPage /></PrivateRoute>} />
          <Route path="/perfil" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<div className="text-center">Página no encontrada</div>} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;
