# TechStore – Tarea

Aplicación full‑stack para gestión de usuarios, roles y productos.
- Backend: Node.js + Express + Prisma (PostgreSQL), JWT, MFA (TOTP), RBAC y ABAC.
- Frontend: React + Vite + Tailwind/DaisyUI.

## Estructura
- backend/ — API REST (auth, roles, usuarios, usuario-roles, productos, tiendas). Ver `backend/API.md`.
- frontend/ — SPA en React. Ver `frontend/FRONTEND.md`.

## Requisitos
- Node.js 18+
- PostgreSQL 14+ (o compatible)

## Configuración rápida
1) Backend: variables de entorno
```
cp backend/.env.example backend/.env
# Edita backend/.env y define:
# - DATABASE_URL
# - JWT_SECRET
# - PORT (opcional, por defecto 5050)
```
2) Frontend: variables de entorno
```
cp frontend/.env.example frontend/.env
# Ajusta VITE_API_BASE (en dev suele ser /api por el proxy de Vite)
```
3) Instalar dependencias
```
(cd backend && npm install)
(cd frontend && npm install)
```
4) Base de datos (Prisma)
```
(cd backend && npm run prisma:generate && npm run prisma:migrate && npm run db:seed)
```
5) Ejecutar
```
# Backend (http://localhost:5050)
(cd backend && npm run dev)

# Frontend (http://localhost:5175)
(cd frontend && npm run dev)
```

## Credenciales de ejemplo (seed)
- Email: `admin@techstore.com`
- Password: `Admin123!`

## Documentación
- API: `backend/API.md`
- Frontend: `frontend/FRONTEND.md`
