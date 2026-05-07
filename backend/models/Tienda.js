// Modelo Tienda: representa una sucursal/tienda física
// Campos: id, nombre y ubicacion
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tienda = sequelize.define('Tienda', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  ubicacion: { type: DataTypes.STRING(150), allowNull: false },
}, {
  tableName: 'tiendas',
  timestamps: false,
});

module.exports = Tienda;
