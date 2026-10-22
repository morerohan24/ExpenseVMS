export const formatCurrency = (amount, currency = 'INR') => {
  const num = parseFloat(amount) || 0;
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusBadgeClass = (status) => {
  const classes = {
    Draft: 'badge-draft',
    Pending: 'badge-pending',
    Approved: 'badge-approved',
    Rejected: 'badge-rejected',
    Paid: 'badge-paid',
  };
  return classes[status] || 'badge-draft';
};

export const getRoleBadgeClass = (role) => {
  const classes = {
    Admin: 'badge-admin',
    Manager: 'badge-manager',
    Finance: 'badge-finance',
    Employee: 'badge-employee',
  };
  return classes[role] || 'badge-employee';
};

export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const CATEGORIES = [
  'Travel',
  'Meals & Entertainment',
  'Office Supplies',
  'Software & Subscriptions',
  'Training & Development',
  'Marketing',
  'Equipment',
  'Medical',
  'Accommodation',
  'Other',
];

export const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Other'];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

export const STATUS_OPTIONS = ['Draft', 'Pending', 'Approved', 'Rejected', 'Paid'];

export const ROLE_OPTIONS = ['Employee', 'Manager', 'Admin', 'Finance'];

export const getCategoryIcon = (category) => {
  const icons = {
    Travel: '✈️',
    'Meals & Entertainment': '🍽️',
    'Office Supplies': '📎',
    'Software & Subscriptions': '💻',
    'Training & Development': '📚',
    Marketing: '📣',
    Equipment: '🔧',
    Medical: '🏥',
    Accommodation: '🏨',
    Other: '📌',
  };
  return icons[category] || '📌';
};

export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
};
