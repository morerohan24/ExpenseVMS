const sequelize = require('../config/database');
const User = require('./User');
const Voucher = require('./Voucher');
const AuditLog = require('./AuditLog');

// Associations
User.hasMany(Voucher, { foreignKey: 'submittedById', as: 'submittedVouchers' });
Voucher.belongsTo(User, { foreignKey: 'submittedById', as: 'submittedBy' });

User.hasMany(Voucher, { foreignKey: 'approvedById', as: 'approvedVouchers' });
Voucher.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    await sequelize.sync();
    console.log('✅ Database synchronized.');
    await seedData();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  const userCount = await User.count();
  if (userCount > 0) return;

  console.log('🌱 Seeding initial data...');

  // Create default users
  const users = await User.bulkCreate([
    {
      name: 'Admin User',
      email: 'admin@company.com',
      password: 'Admin@123',
      role: 'Admin',
      department: 'Administration',
    },
    {
      name: 'Finance Manager',
      email: 'finance@company.com',
      password: 'Finance@123',
      role: 'Finance',
      department: 'Finance',
    },
    {
      name: 'John Manager',
      email: 'manager@company.com',
      password: 'Manager@123',
      role: 'Manager',
      department: 'Engineering',
    },
    {
      name: 'Alice Employee',
      email: 'employee@company.com',
      password: 'Employee@123',
      role: 'Employee',
      department: 'Engineering',
    },
    {
      name: 'Bob Sales',
      email: 'bob@company.com',
      password: 'Bob@12345',
      role: 'Employee',
      department: 'Sales',
    },
  ], { individualHooks: true });

  // Create sample vouchers
  const sampleVouchers = [
    {
      title: 'Team Lunch - Q4 Planning',
      description: 'Team lunch for quarterly planning session with engineering team',
      amount: 2450.00,
      category: 'Meals & Entertainment',
      status: 'Approved',
      expenseDate: '2026-10-15',
      currency: 'INR',
      paymentMethod: 'Credit Card',
      submittedById: users[3].id,
      approvedById: users[2].id,
      submittedAt: new Date('2026-10-16'),
      approvedAt: new Date('2026-10-17'),
      approverComment: 'Approved. Good justification.',
    },
    {
      title: 'Mumbai to Pune Travel',
      description: 'Client visit - travel expenses including train and cab',
      amount: 1850.00,
      category: 'Travel',
      status: 'Pending',
      expenseDate: '2026-10-18',
      currency: 'INR',
      paymentMethod: 'Cash',
      submittedById: users[4].id,
      submittedAt: new Date('2026-10-19'),
    },
    {
      title: 'VS Code License',
      description: 'Annual VS Code Pro subscription for development team',
      amount: 8500.00,
      category: 'Software & Subscriptions',
      status: 'Paid',
      expenseDate: '2026-10-10',
      currency: 'INR',
      paymentMethod: 'Bank Transfer',
      submittedById: users[3].id,
      approvedById: users[2].id,
      submittedAt: new Date('2026-10-11'),
      approvedAt: new Date('2026-10-12'),
      paidAt: new Date('2026-10-14'),
      approverComment: 'Approved for team productivity.',
    },
    {
      title: 'Conference Registration - TechSummit 2026',
      description: 'Registration fee for annual technology summit conference',
      amount: 15000.00,
      category: 'Training & Development',
      status: 'Rejected',
      expenseDate: '2026-10-05',
      currency: 'INR',
      paymentMethod: 'Credit Card',
      submittedById: users[3].id,
      approvedById: users[2].id,
      submittedAt: new Date('2026-10-06'),
      rejectedAt: new Date('2026-10-07'),
      rejectionReason: 'Budget already allocated for this quarter. Please re-submit in next quarter.',
    },
    {
      title: 'Office Supplies - October',
      description: 'Monthly office supplies including stationery and printer ink',
      amount: 3200.00,
      category: 'Office Supplies',
      status: 'Draft',
      expenseDate: '2026-10-20',
      currency: 'INR',
      paymentMethod: 'Cash',
      submittedById: users[4].id,
    },
    {
      title: 'Client Dinner - Infosys Deal',
      description: 'Business dinner with Infosys team for partnership discussion',
      amount: 6800.00,
      category: 'Meals & Entertainment',
      status: 'Approved',
      expenseDate: '2026-10-12',
      currency: 'INR',
      paymentMethod: 'Credit Card',
      submittedById: users[4].id,
      approvedById: users[2].id,
      submittedAt: new Date('2026-10-13'),
      approvedAt: new Date('2026-10-14'),
      approverComment: 'Approved. Important client relationship.',
    },
  ];

  for (const v of sampleVouchers) {
    if (!v.voucherNumber) {
      const ts = Date.now();
      const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      v.voucherNumber = `VCH-${ts}-${rand}`;
    }
  }

  await Voucher.bulkCreate(sampleVouchers);

  console.log('✅ Seed data created successfully.');
  console.log('\n📋 Default Login Credentials:');
  console.log('  Admin:    admin@company.com / Admin@123');
  console.log('  Finance:  finance@company.com / Finance@123');
  console.log('  Manager:  manager@company.com / Manager@123');
  console.log('  Employee: employee@company.com / Employee@123');
};

module.exports = { syncDatabase, User, Voucher, AuditLog };
