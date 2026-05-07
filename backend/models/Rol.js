// Modelo Rol: representa los roles RBAC (Admin, Gerente, Empleado, Auditor)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rol = sequelize.define('Rol', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  descripcion: { type: DataTypes.STRING(200), allowNull: true },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'roles',
  timestamps: false,
});

module.exports = Rol;
