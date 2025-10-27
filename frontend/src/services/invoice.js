import api from './api';

const BILLING_API_URL = '/billing';

export const billingService = {
  // Get all customers
  async getCustomers() {
    const response = await api.get(`/Customer/customers`);
    return response.data;
  },

  // Get all invoices
  async getInvoices() {
    const response = await api.get(`${BILLING_API_URL}/invoices`);
    return response.data;
  },

  // async getInvoiceById() {
  //   const response = await api.get(`${BILLING_API_URL}/invoices/${invoiceId}`);
  //   return response.data;
  // },

  // Generate new invoice
  async generateInvoice(invoiceData) {
    const response = await api.post(`${BILLING_API_URL}/generate-invoice`, invoiceData, {
      responseType: 'blob'
    });
    return response;
  },

  // Download invoice PDF
  async downloadInvoice(invoiceId) {
    const response = await api.get(`${BILLING_API_URL}/invoices/${invoiceId}/download`, {
      responseType: 'blob'
    });
    return response;
  },

  // Delete invoice
  async deleteInvoice(invoiceId) {
    const response = await api.delete(`${BILLING_API_URL}/invoices/${invoiceId}`);
    return response.data;
  },

  // Verify payment
  async verifyPayment(paymentData) {
    const formData = new FormData();
    formData.append('invoiceId', paymentData.invoiceId);
    formData.append('transactionNumber', paymentData.transactionNumber);
    formData.append('transactionProof', paymentData.transactionProof);

    const response = await api.post(`${BILLING_API_URL}/verify-payment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Download Profit & Loss Excel report
  async downloadProfitLossExcel(startDate, endDate) {
    const response = await api.get(`/transactions/export/excel?startDate=${startDate}&endDate=${endDate}`, {
      responseType: 'blob'
    });
    return response;
  }
};

// Export constants for use in components
export const currencySymbols = {
  USD: '$',
  EUR: '€',
  INR: '₹'
};

export const currencyOptions = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'INR', label: 'Indian Rupee (₹)' }
];

export const defaultInvoiceItem = {
  description: "",
  remarks: "",
  amount: ""
};

// Utility functions
export const formatCurrencyDisplay = (amount, currency = 'USD') => {
  if (currency === 'INR') {
    // Indian numbering system
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } else {
    // Western numbering system
    return amount.toFixed(2);
  }
};

export const checkInvoiceStatus = (invoice) => {
  const today = new Date();
  const due = new Date(invoice.dueDate);
  const invoiceDate = new Date(invoice.date);
 
  if (invoice.status === 'paid') return 'paid';
 
  if (invoice.dueDate && today > due) return 'overdue';
 
  return invoice.status === 'sent' ? 'unpaid' : invoice.status;
};

export const formatInvoiceAmount = (invoice) => {
  const amount = invoice.totalAmount || 0;
  return formatCurrencyDisplay(amount, invoice.currency);
};

export const calculateInvoiceTotals = (items, taxPercent = 0, currency = 'USD') => {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const taxAmount = subtotal * (taxPercent / 100);
  const total = subtotal + taxAmount;

  return {
    subtotal: subtotal,
    taxAmount: taxAmount,
    total: total,
    formattedSubtotal: formatCurrencyDisplay(subtotal, currency),
    formattedTaxAmount: formatCurrencyDisplay(taxAmount, currency),
    formattedTotal: formatCurrencyDisplay(total, currency)
  };
};

// File validation
export const validateFile = (file, maxSizeMB = 10) => {
  const allowedTypes = [
    'application/pdf', 
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  // Check file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`File size too large. Maximum size is ${maxSizeMB}MB.`);
  }
 
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Supported formats: PDF, JPG, PNG, DOC');
  }

  return true;
};

// Date utilities
export const getDefaultDates = () => {
  const today = new Date().toISOString().split("T")[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split("T")[0];
  
  return {
    today,
    firstDay
  };
};