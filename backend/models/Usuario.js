// Modelo Usuario: representa a los usuarios del sistema
// Incluye campos para autenticación (email, password) y seguridad (MFA, bloqueos e intentos)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Tienda = require('./Tienda');

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(120), allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING(200), allowNull: false },
  nombre_completo: { type: DataTypes.STRING(150), allowNull: false },
  // tienda asignada (nullable para usuarios globales)
  tienda_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'tiendas', key: 'id' } },
  // MFA (TOTP): indica si está habilitado y su secreto (base32)
  mfa_habilitado: { type: DataTypes.BOOLEAN, defaultValue: false },
  mfa_secret: { type: DataTypes.STRING(200), allowNull: true },
  // estado del usuario
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  // control de intentos fallidos de login básico y bloqueo temporal
  intentos_fallidos: { type: DataTypes.INTEGER, defaultValue: 0 },
  bloqueado_hasta: { type: DataTypes.DATE, allowNull: true },
  // fecha de creación
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'usuarios',
  timestamps: false,
});

// Asociación: un usuario pertenece (opcionalmente) a una tienda
Usuario.belongsTo(Tienda, { foreignKey: 'tienda_id', as: 'tienda' });

module.exports = Usuario;
