-- PostgreSQL schema for TechStore
-- Este esquema corresponde a los modelos Sequelize creados y soporta MFA (mfa_habilitado, mfa_secret), RBAC y Productos para ABAC

CREATE TABLE IF NOT EXISTS tiendas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  ubicacion VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion VARCHAR(200),
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(120) UNIQUE NOT NULL,
  password VARCHAR(200) NOT NULL,
  nombre_completo VARCHAR(150) NOT NULL,
  tienda_id INTEGER REFERENCES tiendas(id) ON DELETE SET NULL,
  mfa_habilitado BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(200),
  activo BOOLEAN DEFAULT TRUE,
  intentos_fallidos INTEGER DEFAULT 0,
  bloqueado_hasta TIMESTAMP NULL,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuario_roles (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  asignado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_asignacion TIMESTAMP DEFAULT NOW(),
  UNIQUE (usuario_id, rol_id)
);

CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT,
  precio NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  categoria VARCHAR(80),
  tienda_id INTEGER NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  es_premium BOOLEAN DEFAULT FALSE,
  creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_usuarios_tienda ON usuarios(tienda_id);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_usuario ON usuario_roles(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_rol ON usuario_roles(rol_id);
CREATE INDEX IF NOT EXISTS idx_productos_tienda ON productos(tienda_id);

