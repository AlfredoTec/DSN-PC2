# TechStore Frontend (Caso de Estudio)

Guía breve para ejecutar y conectar el frontend con el backend.

## Requisitos
- Node.js 18+
- npm 9+

## Configuración de entorno
1) Copiar `.env.example` a `.env` y ajustar la URL del backend:
```
VITE_API_URL=http://localhost:4000
```
2) Asegúrate de que el backend esté corriendo en el puerto indicado o cambia la URL.

## Scripts
- `npm install` — instala dependencias
- `npm run dev` — arranca el servidor de desarrollo (Vite)
- `npm run build` — build de producción
- `npm run preview` — sirve el build localmente

## Consumo de API
- Base URL (frontend): `import.meta.env.VITE_API_URL` (ej. http://localhost:4000)
- Autenticación: enviar `Authorization: Bearer <token>` en requests protegidos.
- Tipo de contenido: `application/json`.

### Flujo de Login y MFA (TOTP)
1) Enviar credenciales a `POST /api/auth/login`.
   - Si responde `{ token, user }`: guardar el token (p. ej., en memoria o almacenamiento según política) y continuar.
   - Si responde `{ mfaRequired: true, mfaToken }`: mostrar input del código TOTP (6 dígitos).
2) Verificar código TOTP con `POST /api/auth/verify-mfa` enviando `{ mfaToken, code }`.
   - Respuesta: `{ token, user }`.
3) Incluir el token en `Authorization` para el resto de peticiones.

### Habilitar MFA desde la UI
- Opción A: usuario logueado (sin MFA) usa `POST /api/auth/enable-mfa` con JWT en Authorization.
  - La API retorna `qrDataUrl` para mostrar el QR y `otpauthUrl`.
- Luego, confirmar con `POST /api/auth/verify-mfa-setup` enviando `{ code }`.

### Endpoints relevantes (resumen)
- Auth: `/api/auth/*` (login, register, enable/verify/disable MFA)
- Usuarios: `/api/usuarios/*` (RBAC: Admin/Gerente/Empleado/Auditor)
- Roles: `/api/roles/*` (solo Admin para modificar)
- Productos: `/api/productos/*` (ABAC según rol/tienda/atributos)
- Tiendas: `/api/tiendas/*` (Admin para crear/editar/eliminar)

## Recomendaciones de implementación
- Configurar un cliente Axios con `baseURL = import.meta.env.VITE_API_URL`.
- Interceptor de Axios para adjuntar `Authorization` cuando el token esté disponible.
- Manejo de errores por estatus (401, 403, 409) para mostrar mensajes claros.
- Evitar exponer datos sensibles en UI y logs.

## Build y despliegue
- El artefacto de build se genera con `npm run build` (Vite) en `dist/`.
- Servir estáticos desde cualquier hosting y apuntar `VITE_API_URL` al backend accesible públicamente.

## Notas
- Las políticas de acceso (RBAC/ABAC) viven en el backend. El frontend debe reaccionar a 403/401 y ocultar acciones no permitidas cuando sea posible.
- El ciclo de vida del token (expiración) debe considerarse para renovar sesión o redirigir al login.
