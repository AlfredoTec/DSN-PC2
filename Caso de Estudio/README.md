# TechStore – Caso de Estudio

Aplicación full‑stack de ejemplo para gestión de usuarios, roles y productos.
- Backend: Node.js + Express + Prisma 7 (PostgreSQL), JWT, MFA (TOTP), RBAC y ABAC.
- Frontend: React + Vite + Tailwind + MUI.

## Estructura
- backend/ — API REST (auth, usuarios, roles, productos, tiendas). Ver `backend/API.md`.
- frontend/ — SPA en React. Ver `frontend/FRONTEND.md`.
- schema.sql — Script SQL de referencia.

## Requisitos
- Node.js 18+
- PostgreSQL 14+ (o compatible)

## Configuración rápida
1) Backend: variables de entorno
```
cp backend/.env.example backend/.env
# Edita backend/.env y define:
# - DATABASE_URL o DATABASE_PUBLIC_URL
# - JWT_SECRET
# - PORT (opcional, por defecto 4000)
```
2) Frontend: variables de entorno
```
cp frontend/.env.example frontend/.env
# Ajusta VITE_API_URL (ej. http://localhost:4000)
```
3) Instalar dependencias
```
(cd backend && npm install)
(cd frontend && npm install)
```
4) Base de datos (opciones)
- Opción A: ejecutar `schema.sql`/`backend/CREATE_DB.sql` en tu PostgreSQL.
- Opción B (Prisma):
```
(cd backend && npm run prisma:generate && npm run seed)
```
5) Ejecutar
```
# Backend (http://localhost:4000)
(cd backend && npm run dev)

# Frontend (http://localhost:5173 por defecto)
(cd frontend && npm run dev)
```

## Documentación
- API: `backend/API.md`
- Frontend: `frontend/FRONTEND.md`
