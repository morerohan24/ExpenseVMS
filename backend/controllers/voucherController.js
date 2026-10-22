const { Op } = require('sequelize');
const { Voucher, User, AuditLog } = require('../models/index');
const path = require('path');
const fs = require('fs');

// @desc    Create voucher
// @route   POST /api/vouchers
// @access  Private (Employee+)
const createVoucher = async (req, res) => {
  try {
    const { title, description, amount, category, expenseDate, currency, paymentMethod, action, status } = req.body;

    const isSubmitting = action === 'submit' || status === 'Pending';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    const voucherData = {
      voucherNumber: `VCH-${timestamp}-${random}`,
      title,
      description,
      amount: parseFloat(amount),
      category,
      expenseDate,
      currency: currency || 'INR',
      paymentMethod,
      submittedById: req.user.id,
      status: isSubmitting ? 'Pending' : 'Draft',
      submittedAt: isSubmitting ? new Date() : null,
    };

    if (req.file) {
      voucherData.receiptPath = req.file.filename;
    }

    const voucher = await Voucher.create(voucherData);

    await AuditLog.create({
      action: isSubmitting ? 'VOUCHER_SUBMITTED' : 'VOUCHER_CREATED',
      entityType: 'Voucher',
      entityId: voucher.id,
      newValues: { title, amount, category, status: voucherData.status },
      userId: req.user.id,
      ipAddress: req.ip,
    });

    const fullVoucher = await Voucher.findByPk(voucher.id, {
      include: [
        { model: User, as: 'submittedBy', attributes: ['id', 'name', 'email', 'department'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'name', 'email'] },
      ],
    });

    res.status(201).json({ success: true, message: 'Voucher created successfully.', voucher: fullVoucher });
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({ success: false, message: 'Server error creating voucher.' });
  }
};

// @desc    Get all vouchers (with role-based filtering)
// @route   GET /api/vouchers
// @access  Private
const getVouchers = async (req, res) => {
  try {
    const { status, category, search, startDate, endDate, page = 1, limit = 10 } = req.query;

    const where = {};

    // Role-based access
    if (req.user.role === 'Employee') {
      where.submittedById = req.user.id;
    }

    // Filters
    if (status) where.status = status;
    if (category) where.category = category;
    if (startDate && endDate) {
      where.expenseDate = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.expenseDate = { [Op.gte]: startDate };
    } else if (endDate) {
      where.expenseDate = { [Op.lte]: endDate };
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { voucherNumber: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: vouchers } = await Voucher.findAndCountAll({
      where,
      include: [
        { model: User, as: 'submittedBy', attributes: ['id', 'name', 'email', 'department'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      vouchers,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching vouchers.' });
  }
};

// @desc    Get single voucher
// @route   GET /api/vouchers/:id
// @access  Private
const getVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id, {
      include: [
        { model: User, as: 'submittedBy', attributes: ['id', 'name', 'email', 'department'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found.' });
    }

    // Employees can only view their own vouchers
    if (req.user.role === 'Employee' && voucher.submittedById !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, voucher });
  } catch (error) {
    console.error('Get voucher error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching voucher.' });
  }
};

// @desc    Update voucher (only Draft status)
// @route   PUT /api/vouchers/:id
// @access  Private (Owner only)
const updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found.' });
    }

    if (voucher.submittedById !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this voucher.' });
    }

    if (voucher.status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Only draft vouchers can be edited.' });
    }

    const oldValues = {
      title: voucher.title,
      amount: voucher.amount,
      category: voucher.category,
    };

    const { title, description, amount, category, expenseDate, currency, paymentMethod } = req.body;

    if (title) voucher.title = title;
    if (description !== undefined) voucher.description = description;
    if (amount) voucher.amount = parseFloat(amount);
    if (category) voucher.category = category;
    if (expenseDate) voucher.expenseDate = expenseDate;
    if (currency) voucher.currency = currency;
    if (paymentMethod) voucher.paymentMethod = paymentMethod;

    if (req.file) {
      // Delete old file if exists
      if (voucher.receiptPath) {
        const oldFilePath = path.join(__dirname, '..', 'uploads', voucher.receiptPath);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
      voucher.receiptPath = req.file.filename;
    }

    await voucher.save();

    await AuditLog.create({
      action: 'VOUCHER_UPDATED',
      entityType: 'Voucher',
      entityId: voucher.id,
      oldValues,
      newValues: { title: voucher.title, amount: voucher.amount, category: voucher.category },
      userId: req.user.id,
      ipAddress: req.ip,
    });

    const updatedVoucher = await Voucher.findByPk(voucher.id, {
      include: [
        { model: User, as: 'submittedBy', attributes: ['id', 'name', 'email', 'department'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'name', 'email'] },
      ],
    });

    res.json({ success: true, message: 'Voucher updated successfully.', voucher: updatedVoucher });
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(500).json({ success: false, message: 'Server error updating voucher.' });
  }
};

// @desc    Submit voucher for approval
// @route   PUT /api/vouchers/:id/submit
// @access  Private (Owner)
const submitVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found.' });
    }

    if (voucher.submittedById !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (voucher.status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Only draft vouchers can be submitted.' });
    }

    voucher.status = 'Pending';
    voucher.submittedAt = new Date();
    await voucher.save();

    await AuditLog.create({
      action: 'VOUCHER_SUBMITTED',
      entityType: 'Voucher',
      entityId: voucher.id,
      newValues: { status: 'Pending' },
      userId: req.user.id,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Voucher submitted for approval.', voucher });
  } catch (error) {
    console.error('Submit voucher error:', error);
    res.status(500).json({ success: false, message: 'Server error submitting voucher.' });
  }
};

// @desc    Approve voucher
// @route   PUT /api/vouchers/:id/approve
// @access  Private (Manager, Admin, Finance)
const approveVoucher = async (req, res) => {
  try {
    const { comment } = req.body;
    const voucher = await Voucher.findByPk(req.params.id);

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found.' });
    }

    if (voucher.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending vouchers can be approved.' });
    }

    voucher.status = 'Approved';
    voucher.approvedById = req.user.id;
    voucher.approvedAt = new Date();
    voucher.approverComment = comment || null;
    await voucher.save();

    await AuditLog.create({
      action: 'VOUCHER_APPROVED',
      entityType: 'Voucher',
      entityId: voucher.id,
      newValues: { status: 'Approved', approvedById: req.user.id },
      userId: req.user.id,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Voucher approved successfully.', voucher });
  } catch (error) {
    console.error('Approve voucher error:', error);
    res.status(500).json({ success: false, message: 'Server error approving voucher.' });
  }
};

// @desc    Reject voucher
// @route   PUT /api/vouchers/:id/reject
// @access  Private (Manager, Admin, Finance)
const rejectVoucher = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const voucher = await Voucher.findByPk(req.params.id);

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found.' });
    }

    if (voucher.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending vouchers can be rejected.' });
    }

    voucher.status = 'Rejected';
    voucher.approvedById = req.user.id;
    voucher.rejectedAt = new Date();
    voucher.rejectionReason = reason;
    await voucher.save();

    await AuditLog.create({
      action: 'VOUCHER_REJECTED',
      entityType: 'Voucher',
      entityId: voucher.id,
      newValues: { status: 'Rejected', reason },
      userId: req.user.id,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Voucher rejected.', voucher });
  } catch (error) {
    console.error('Reject voucher error:', error);
    res.status(500).json({ success: false, message: 'Server error rejecting voucher.' });
  }
};

// @desc    Mark voucher as paid
// @route   PUT /api/vouchers/:id/pay
// @access  Private (Finance, Admin)
const payVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found.' });
    }

    if (voucher.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'Only approved vouchers can be marked as paid.' });
    }

    voucher.status = 'Paid';
    voucher.paidAt = new Date();
    await voucher.save();

    await AuditLog.create({
      action: 'VOUCHER_PAID',
      entityType: 'Voucher',
      entityId: voucher.id,
      newValues: { status: 'Paid' },
      userId: req.user.id,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Voucher marked as paid.', voucher });
  } catch (error) {
    console.error('Pay voucher error:', error);
    res.status(500).json({ success: false, message: 'Server error marking voucher as paid.' });
  }
};

// @desc    Delete voucher (Draft only)
// @route   DELETE /api/vouchers/:id
// @access  Private (Owner or Admin)
const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByPk(req.params.id);

    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found.' });
    }

    if (voucher.submittedById !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this voucher.' });
    }

    if (voucher.status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Only draft vouchers can be deleted.' });
    }

    // Delete receipt file if exists
    if (voucher.receiptPath) {
      const filePath = path.join(__dirname, '..', 'uploads', voucher.receiptPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await AuditLog.create({
      action: 'VOUCHER_DELETED',
      entityType: 'Voucher',
      entityId: voucher.id,
      oldValues: { title: voucher.title, amount: voucher.amount },
      userId: req.user.id,
      ipAddress: req.ip,
    });

    await voucher.destroy();

    res.json({ success: true, message: 'Voucher deleted successfully.' });
  } catch (error) {
    console.error('Delete voucher error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting voucher.' });
  }
};

// @desc    Get dashboard analytics
// @route   GET /api/vouchers/analytics
// @access  Private
const getAnalytics = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'Employee') {
      where.submittedById = req.user.id;
    }

    const [total, pending, approved, rejected, paid, draft] = await Promise.all([
      Voucher.count({ where }),
      Voucher.count({ where: { ...where, status: 'Pending' } }),
      Voucher.count({ where: { ...where, status: 'Approved' } }),
      Voucher.count({ where: { ...where, status: 'Rejected' } }),
      Voucher.count({ where: { ...where, status: 'Paid' } }),
      Voucher.count({ where: { ...where, status: 'Draft' } }),
    ]);

    // Total amounts
    const approvedVouchers = await Voucher.findAll({
      where: { ...where, status: 'Approved' },
      attributes: ['amount'],
    });
    const paidVouchers = await Voucher.findAll({
      where: { ...where, status: 'Paid' },
      attributes: ['amount'],
    });
    const pendingVouchers = await Voucher.findAll({
      where: { ...where, status: 'Pending' },
      attributes: ['amount'],
    });

    const totalApprovedAmount = approvedVouchers.reduce((sum, v) => sum + parseFloat(v.amount), 0);
    const totalPaidAmount = paidVouchers.reduce((sum, v) => sum + parseFloat(v.amount), 0);
    const totalPendingAmount = pendingVouchers.reduce((sum, v) => sum + parseFloat(v.amount), 0);

    // Category breakdown
    const categoryData = await Voucher.findAll({
      where,
      attributes: ['category'],
      raw: true,
    });

    const categoryBreakdown = {};
    categoryData.forEach((v) => {
      categoryBreakdown[v.category] = (categoryBreakdown[v.category] || 0) + 1;
    });

    // Monthly data (last 6 months)
    const allVouchers = await Voucher.findAll({
      where,
      attributes: ['amount', 'status', 'createdAt'],
      raw: true,
    });

    const monthlyData = {};
    allVouchers.forEach((v) => {
      const month = new Date(v.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthlyData[month]) monthlyData[month] = { month, total: 0, approved: 0, pending: 0 };
      monthlyData[month].total += parseFloat(v.amount);
      if (v.status === 'Approved' || v.status === 'Paid') monthlyData[month].approved += parseFloat(v.amount);
      if (v.status === 'Pending') monthlyData[month].pending += parseFloat(v.amount);
    });

    res.json({
      success: true,
      analytics: {
        counts: { total, pending, approved, rejected, paid, draft },
        amounts: {
          totalApproved: totalApprovedAmount,
          totalPaid: totalPaidAmount,
          totalPending: totalPendingAmount,
        },
        categoryBreakdown: Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value })),
        monthlyData: Object.values(monthlyData).slice(-6),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching analytics.' });
  }
};

module.exports = {
  createVoucher,
  getVouchers,
  getVoucher,
  updateVoucher,
  submitVoucher,
  approveVoucher,
  rejectVoucher,
  payVoucher,
  deleteVoucher,
  getAnalytics,
};
