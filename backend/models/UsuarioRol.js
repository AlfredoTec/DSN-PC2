// Modelo UsuarioRol: relación N:M entre usuarios y roles, con metadatos
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Usuario = require('./Usuario');
const Rol = require('./Rol');

const UsuarioRol = sequelize.define('UsuarioRol', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuarios', key: 'id' } },
  rol_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'roles', key: 'id' } },
  asignado_por: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'usuarios', key: 'id' } },
  fecha_asignacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'usuario_roles',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['usuario_id', 'rol_id'] }
  ]
});

// Asociaciones
Usuario.belongsToMany(Rol, { through: UsuarioRol, foreignKey: 'usuario_id', otherKey: 'rol_id', as: 'roles' });
Rol.belongsToMany(Usuario, { through: UsuarioRol, foreignKey: 'rol_id', otherKey: 'usuario_id', as: 'usuarios' });

module.exports = UsuarioRol;
