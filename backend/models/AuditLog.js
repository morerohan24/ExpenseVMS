const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  oldValues: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const val = this.getDataValue('oldValues');
      return val ? JSON.parse(val) : null;
    },
    set(val) {
      this.setDataValue('oldValues', val ? JSON.stringify(val) : null);
    },
  },
  newValues: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const val = this.getDataValue('newValues');
      return val ? JSON.parse(val) : null;
    },
    set(val) {
      this.setDataValue('newValues', val ? JSON.stringify(val) : null);
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = AuditLog;
