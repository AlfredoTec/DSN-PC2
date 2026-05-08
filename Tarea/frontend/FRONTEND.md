# TechStore Frontend (Tarea)

Guía breve para correr y conectar el frontend.

## Requisitos
- Node.js 18+

## Entorno
1) Copiar `.env.example` a `.env` y ajustar si fuese necesario:
```
VITE_API_BASE=/api
```
- En desarrollo, Vite proxy redirige `/api` a `http://localhost:5050` (ver `vite.config.js`).

## Scripts
- `npm install`
- `npm run dev` (http://localhost:5175)
- `npm run build`
- `npm run preview`

## Auth y MFA (flujo)
1) Login: POST `/api/auth/login`
   - Sin MFA: recibe `{ token }` y se guarda en `localStorage`.
   - Con MFA: recibe `{ tempToken }` y se muestra pantalla para `codigoTOTP`.
2) Verificación MFA: POST `/api/auth/verify-mfa` con `{ tempToken, codigoTOTP }` → `{ token }`.
3) Habilitar MFA: POST `/api/auth/enable-mfa` con JWT (muestra `otpauth_url` para escanear).

## Cliente HTTP
- Se usa Axios con `baseURL = import.meta.env.VITE_API_BASE`.
- Un interceptor agrega `Authorization: Bearer <token>` cuando existe.

## Rutas principales en la SPA
- `/login`
- `/enable-mfa` (protegida)
- `/verify-mfa`
- `/productos` (protegida)
- `/roles` (protegida, rol Administrador)
- `/usuarios` (protegida, rol Administrador)

## Manejo de errores
- 401: redirige a login y muestra aviso.
- 403: redirige a "Unauthorized" o muestra aviso según la ruta.

## Despliegue
- `npm run build` genera `dist/`.
- Servir estáticos y configurar backend accesible en la misma ruta base o ajustar `VITE_API_BASE` a endpoint público.
