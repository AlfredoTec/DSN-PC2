# TechStore API (Tarea)

Documentación breve de la API basada en el código y JSDoc de los controladores. Todas las rutas devuelven JSON.

- Base URL local: http://localhost:5050
- Prefijo API: /api
- Autenticación: JWT vía header `Authorization: Bearer <token>`
- Estilos de autorización: RBAC (Roles) y ABAC (Productos)

## Autenticación y MFA (TOTP)

POST /api/auth/register
- Body: { email, password, nombreCompleto, tiendaId }
- 201: { message: 'Usuario registrado' }
- Errores: 400 (datos inválidos/duplicado), 500 (error en registro)

POST /api/auth/login
- Body: { email, password }
- 200:
  - Si MFA habilitada: { mfaRequired: true, tempToken }
  - Si no: { token, mfaRequired: false }
- Errores: 400, 401, 500

POST /api/auth/enable-mfa
- Auth: JWT (usuario autenticado)
- 200: { otpauth_url, secret }
- Errores: 500

POST /api/auth/enable-mfa/verify-code
- Auth: JWT (usuario autenticado)
- Body: { codigoTOTP }
- 200: { message: 'MFA verificado y activado' }
- Errores: 400, 500

POST /api/auth/verify-mfa
- Body: { tempToken, codigoTOTP }
- 200: { token, mfaRequired: false }
- Límite: 3 intentos por tempToken
- Errores: 400, 401

## Roles (RBAC)

GET /api/roles
- Auth: JWT (cualquier usuario autenticado)
- 200: Rol[]

POST /api/roles
- Auth: Administrador
- Body: { nombre, descripcion? }
- 201: Rol
- Errores: 400

PUT /api/roles/:id
- Auth: Administrador
- Body: { descripcion }
- 200: Rol
- Errores: 404

DELETE /api/roles/:id
- Auth: Administrador
- 200: { message }
- Errores: 400, 404, 500

## Usuarios (RBAC)

GET /api/usuarios
- Auth: JWT + Administrador
- 200: Usuario[] (incluye tienda y roles)

GET /api/usuarios/:id
- Auth: JWT + Administrador
- 200: Usuario
- Errores: 404

POST /api/usuarios
- Auth: JWT + Administrador
- Body: { email, password, nombreCompleto, tiendaId, roleIds? }
- 201: { id }
- Errores: 400, 500

PUT /api/usuarios/:id
- Auth: JWT + Administrador
- Body: { nombreCompleto?, email?, tiendaId?, activo? }
- 200: { id }
- Errores: 400, 404

DELETE /api/usuarios/:id
- Auth: JWT + Administrador
- Query opcional: `?hard=true`
- 200: { message }
- Errores: 400, 404

## Usuario-Roles (RBAC)

POST /api/usuario-roles
- Auth: JWT + Administrador
- Body: { usuarioId, rolId }
- 201: UsuarioRol
- Errores: 400

DELETE /api/usuario-roles/:id
- Auth: JWT + Administrador
- 200: { message }
- Errores: 404

## Productos (ABAC)

- Políticas por atributos (rol del usuario, `tiendaId`, `esPremium`, y campos editables):
  - SELECT: Administrador/Auditor -> todos; Gerente/Empleado -> solo su tienda
  - INSERT: Administrador -> cualquiera; Gerente -> solo en su tienda; Empleado -> solo NO premium en su tienda; Auditor -> sin acceso
  - UPDATE: Administrador -> cualquier campo; Gerente -> cualquier campo en su tienda excepto `categoria`; Empleado -> solo `stock` en su tienda; Auditor -> sin acceso
  - DELETE: Administrador -> cualquiera; Gerente -> solo NO premium en su tienda; Empleado/Auditor -> sin acceso

GET /api/productos
- Auth: JWT
- Query opcional: tiendaId, esPremium (true/false/1/0/yes/no), categoria
- 200: Producto[] (posible filtro por tienda según rol)

GET /api/productos/categorias
- Auth: JWT
- 200: string[] (categorías distintas)

GET /api/productos/:id
- Auth: JWT (autorizado por policy)
- 200: Producto

POST /api/productos
- Auth: JWT (autorizado por policy)
- Body: Producto
- 201: Producto

PUT /api/productos/:id
- Auth: JWT (autorizado por policy)
- Body: solo campos permitidos por `req.abac.allowedFields`
- 200: Producto actualizado

DELETE /api/productos/:id
- Auth: JWT (autorizado por policy)
- 200: { message }

## Tiendas

GET /api/tiendas
- Auth: JWT (cualquier usuario autenticado)
- 200: Array<{ id, nombre }>

## Autorización y headers

- Envíe `Authorization: Bearer <token>` en todas las rutas protegidas.
- `Content-Type: application/json` para requests con body.

## Códigos de error comunes

- 400: Datos inválidos o incompletos
- 401: No autenticado / token inválido o expirado
- 403: Acceso denegado por rol o política ABAC
- 404: Recurso no encontrado
- 500: Error interno del servidor

## Ejemplos rápidos

Login (sin MFA):
```bash
BASE=http://localhost:5050
curl -X POST $BASE/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@techstore.com","password":"Admin123!"}'
```

Login (con MFA):
1) Hacer login y recibir `{ mfaRequired, tempToken }`.
2) Verificar TOTP:
```bash
curl -X POST $BASE/api/auth/verify-mfa \
  -H 'Content-Type: application/json' \
  -d '{"tempToken":"<tempToken>","codigoTOTP":"123456"}'
```
