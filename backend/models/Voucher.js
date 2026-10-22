const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Voucher = sequelize.define('Voucher', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  voucherNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM(
      'Travel',
      'Meals & Entertainment',
      'Office Supplies',
      'Software & Subscriptions',
      'Training & Development',
      'Marketing',
      'Equipment',
      'Medical',
      'Accommodation',
      'Other'
    ),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Pending', 'Approved', 'Rejected', 'Paid'),
    defaultValue: 'Draft',
    allowNull: false,
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  approverComment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  receiptPath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  expenseDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR',
  },
  paymentMethod: {
    type: DataTypes.ENUM('Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Other'),
    allowNull: true,
  },
  submittedById: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  approvedById: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: true,
  hooks: {
    beforeValidate: (voucher) => {
      if (!voucher.voucherNumber) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        voucher.voucherNumber = `VCH-${timestamp}-${random}`;
      }
    },
  },
});

module.exports = Voucher;
