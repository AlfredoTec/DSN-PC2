# TechStore – Gestión de Inventario y Accesos (RBAC/ABAC + MFA)

## ¿Para qué sirve?
Sistema para gestionar inventario y usuarios de una cadena de tiendas de tecnología. Incluye:
- Autenticación con JWT y segundo factor (MFA TOTP).
- Autorización por roles (RBAC) y por atributos (ABAC) para proteger operaciones de productos y administración.
- Frontend en React para operar el sistema.

El repositorio contiene dos implementaciones:
- **Tarea/**: entrega principal (backend Express + Prisma + PostgreSQL y frontend React + Vite).
- **Caso de Estudio/**: versión de referencia/estudio con ajustes de stack y puerto.

## Tecnologías utilizadas
- **Backend (Tarea)**: Node.js 18+, Express, Prisma ORM (v5), PostgreSQL, JSON Web Tokens, bcryptjs, express-validator, helmet, cors, morgan, speakeasy (TOTP), dayjs, nodemon.
- **Frontend (Tarea)**: React 18, Vite 5, TailwindCSS 3, DaisyUI 4, Axios, React Router 6, react-hot-toast, lucide-react, react-qr-code.
- **Caso de Estudio**: También usa Node.js + Express + Prisma (v7), y un frontend React con Vite.

## Estructura del repositorio
- `Tarea/backend`: API REST (Express + Prisma + PostgreSQL). Puerto dev por defecto: `5050`.
- `Tarea/frontend`: SPA en React + Vite. Puerto dev por defecto: `5175`.
- `Caso de Estudio/backend`: API de referencia (puerto por defecto `4000`).
- `Caso de Estudio/frontend`: SPA de referencia (puerto por defecto `5173`).

## Requisitos previos
- Node.js 18+ y npm.
- PostgreSQL 13+ (local o remoto).

---

## Cómo ejecutar (Entrega principal: carpeta Tarea)

### 1) Backend (Tarea/backend)
1. Crear variables de entorno a partir del ejemplo:
   - Copiar `.env.example` a `.env` y ajustar:
     - `DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/techstore?schema=public"`
     - `JWT_SECRET` (cambiar por un valor seguro)
     - `PORT=5050` (opcional)
2. Instalar dependencias y preparar Prisma:
   ```bash
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   # opcional, datos de ejemplo (tiendas, roles, admin, usuarios demo, productos)
   npm run db:seed
   ```
3. Ejecutar en desarrollo:
   ```bash
   npm run dev
   ```
4. Verificación rápida:
   - Salud: `GET http://localhost:5050/health`
   - API base: prefijo `/api` (auth, roles, usuarios, productos, usuario-roles, tiendas, public)

### 2) Frontend (Tarea/frontend)
1. Crear variables de entorno:
   - Copiar `.env.example` a `.env` y mantener/ajustar:
     - `VITE_API_BASE=/api` (en dev, Vite hace proxy a `http://localhost:5050`)
2. Instalar y ejecutar:
   ```bash
   npm install
   npm run dev
   ```
3. Abrir: `http://localhost:5175`

### Usuarios y roles de ejemplo (seed opcional)
- Admin: `admin@techstore.com` / `Admin123!`
- También se crean usuarios por rol y tienda (Lima, Arequipa, Cusco):
  - Formato de email: `<rol>.<tienda>@techstore.com` (ej. `gerente.lima@techstore.com`)
  - Contraseña: `Demo123!`
- Roles creados: Administrador, Gerente, Empleado, Auditor.

---

## (Opcional) Ejecutar la carpeta Caso de Estudio

### Backend (Caso de Estudio/backend)
1. Copiar `.env.example` a `.env` y completar `DATABASE_URL`, `JWT_SECRET`, `PORT` (por defecto 4000).
2. Instalar y preparar base de datos (según scripts disponibles):
   ```bash
   npm install
   npm run prisma:dbpush    # o
   npm run prisma:migrate   # inicial
   ```
3. Ejecutar:
   ```bash
   npm run dev
   ```

### Frontend (Caso de Estudio/frontend)
1. Copiar `.env.example` a `.env` (contiene `VITE_API_URL=http://localhost:4000`).
2. Instalar y ejecutar:
   ```bash
   npm install
   npm run dev
   ```
3. Abrir: `http://localhost:5173`

---

## Notas
- El proxy de desarrollo del frontend (Tarea) mapea `"/api" → http://localhost:5050` (ver `Tarea/frontend/vite.config.js`).
- Recomendado crear la base de datos `techstore` en PostgreSQL antes de correr migraciones.
- Para más detalles del frontend de la Tarea, ver `Tarea/frontend/FRONTEND.md`.
