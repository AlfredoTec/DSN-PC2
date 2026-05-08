# TechStore API (Caso de Estudio)

Documentación breve de la API basada en el código y JSDoc de los controladores. Todas las rutas devuelven JSON.

- Base URL local: http://localhost:4000
- Prefijo API: /api
- Autenticación: JWT vía header `Authorization: Bearer <token>`
- Estilos de autorización: RBAC (Roles) y ABAC (Productos)

## Autenticación y MFA (TOTP)

POST /api/auth/register
- Body: { email, password, nombre_completo, tienda_id? }
- 201: { id, email, nombre_completo, tienda_id, message }
- Errores: 400 (payload inválido), 409 (email en uso)

POST /api/auth/login
- Body: { email, password }
- 200:
  - Si MFA habilitada: { mfaRequired: true, mfaToken }
  - Si no: { token, user }
- Errores: 400, 401, 423 (bloqueo temporal)

POST /api/auth/enable-mfa
- Auth: mfaToken en body o JWT en Authorization
- Body opcional: { mfaToken? }
- 200: { otpauthUrl, otpauth, qrDataUrl } (para configurar en Google Authenticator)
- Errores: 401, 404

POST /api/auth/verify-mfa-setup
- Auth: mfaToken en body o JWT en Authorization
- Body: { code, mfaToken? }
- 200: { message: 'MFA habilitado correctamente' }
- Errores: 400, 401

POST /api/auth/verify-mfa
- Body: { mfaToken, code }
- 200: { token, user }
- Límite: 3 intentos por mfaToken (luego 401)
- Errores: 400, 401

POST /api/auth/disable-mfa
- Auth: JWT (Authorization)
- 200: { message: 'MFA deshabilitado correctamente' }
- Errores: 401, 404

## Roles (RBAC)

GET /api/roles
- Auth: JWT (cualquier usuario autenticado)
- 200: Rol[]

POST /api/roles
- Auth: Admin
- Body: { nombre, descripcion? }
- 201: Rol
- Errores: 400, 409

PUT /api/roles/:id
- Auth: Admin
- Body: { nombre?, descripcion? }
- 200: Rol
- Errores: 404

DELETE /api/roles/:id
- Auth: Admin
- 200: { message }
- Regla: no eliminar si tiene usuarios asignados
- Errores: 400, 404

## Usuarios (RBAC)

GET /api/usuarios
- Auth: JWT
- Alcance:
  - Admin: todos
  - Gerente: solo usuarios de su tienda
  - Empleado/Auditor: solo él mismo
- 200: Usuario[] con `roles` agregado

POST /api/usuarios
- Auth: Admin
- Body: { email, password, nombre_completo, tienda_id? }
- 201: { id, email, nombre_completo, tienda_id }
- Errores: 400, 409

PUT /api/usuarios/:id
- Auth: Admin total; Gerente limitado a su tienda
- Body: { nombre_completo?, activo?, tienda_id? (solo Admin) }
- 200: Usuario (simplificado)
- Errores: 403, 404

DELETE /api/usuarios/:id
- Auth: Admin
- 200: { message }
- Errores: 404

POST /api/usuarios/:id/roles
- Auth: Admin
- Body: { rolNombre }
- 200: { message: 'Rol asignado' }
- Errores: 400, 404

DELETE /api/usuarios/:id/roles
- Auth: Admin
- Body: { rolNombre }
- 200: { message: 'Rol removido' }
- Errores: 400, 404

## Productos (ABAC)

- Políticas por atributos (rol del usuario, `tienda_id`, `es_premium`, campos editables):
  - SELECT: Admin/Auditor -> todos; Gerente/Empleado -> solo su tienda
  - INSERT: Admin -> cualquiera; Gerente -> solo en su tienda; Empleado -> solo NO premium en su tienda; Auditor -> sin acceso
  - UPDATE: Admin -> cualquier campo; Gerente -> cualquier campo en su tienda excepto `categoria`; Empleado -> solo `stock` en su tienda; Auditor -> sin acceso
  - DELETE: Admin -> cualquiera; Gerente -> solo NO premium en su tienda; Empleado/Auditor -> sin acceso

GET /api/productos
- Auth: JWT
- 200: Producto[] (posible filtro por tienda según rol)

GET /api/productos/:id
- Auth: JWT
- 200: Producto (autorizado por policy)

POST /api/productos
- Auth: JWT
- Body: Producto (el backend forzará `creado_por = req.user.id` y normalizará tienda/flags según rol)
- 201: Producto

PUT /api/productos/:id
- Auth: JWT
- Body: Producto (restricciones por rol; p. ej. Empleado solo `stock`)
- 200: Producto actualizado

DELETE /api/productos/:id
- Auth: JWT
- 200: { message }

## Tiendas

GET /api/tiendas
- Auth: JWT (cualquier usuario autenticado)
- 200: Array<{ id, nombre, ubicacion }>

POST /api/tiendas
- Auth: Admin
- Body: { nombre, ubicacion? }
- 201: Tienda
- Errores: 400, 409

PUT /api/tiendas/:id
- Auth: Admin
- Body: { nombre?, ubicacion? }
- 200: Tienda
- Errores: 400, 404, 409 (nombre duplicado)

DELETE /api/tiendas/:id
- Auth: Admin
- 200: { message: 'Tienda eliminada' }
- Errores: 400, 403, 409 (P2003: dependencias/foreign key)

## Autorización y headers

- Envíe `Authorization: Bearer <token>` en todas las rutas protegidas.
- `Content-Type: application/json` para requests con body.

## Códigos de error comunes

- 400: Datos inválidos o incompletos
- 401: No autenticado / token inválido o expirado
- 403: Acceso denegado por rol o política ABAC
- 404: Recurso no encontrado
- 409: Conflicto (duplicados o restricciones de FK)
- 423: Cuenta bloqueada temporalmente (login)
- 500: Error interno del servidor

## Ejemplos rápidos

Login (sin MFA):
```bash
curl -X POST $BASE/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@techstore.com","password":"Admin123!"}'
```

Login (con MFA):
1) Hacer login y recibir `{ mfaRequired, mfaToken }`.
2) Verificar TOTP:
```bash
curl -X POST $BASE/api/auth/verify-mfa \
  -H 'Content-Type: application/json' \
  -d '{"mfaToken":"<mfaToken>","code":"123456"}'
```
