// Modelo Producto: inventario con atributos para ABAC
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Tienda = require('./Tienda');
const Usuario = require('./Usuario');

const Producto = sequelize.define('Producto', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(120), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  precio: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  categoria: { type: DataTypes.STRING(80), allowNull: true },
  tienda_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'tiendas', key: 'id' } },
  es_premium: { type: DataTypes.BOOLEAN, defaultValue: false },
  creado_por: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'usuarios', key: 'id' } },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'productos',
  timestamps: false,
});

Producto.belongsTo(Tienda, { foreignKey: 'tienda_id', as: 'tienda' });
Producto.belongsTo(Usuario, { foreignKey: 'creado_por', as: 'creador' });

module.exports = Producto;
