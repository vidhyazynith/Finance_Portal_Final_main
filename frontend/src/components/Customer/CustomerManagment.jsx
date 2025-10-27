import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customer';
import './CustomerManagment.css';

const CustomerManagment = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    customerType: 'individual'
  });

  // Fetch customers from MongoDB
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      alert('Error fetching customers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingCustomer) {
        // Update existing customer
        await customerService.updateCustomer(editingCustomer._id, form);
        alert('Customer updated successfully!');
      } else {
        // Add new customer
        await customerService.createCustomer(form);
        alert('Customer added successfully!');
      }
      
      // Refresh customers list
      await fetchCustomers();
      
      // Reset form
      setForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        company: '',
        customerType: 'individual'
      });
      setShowAddForm(false);
      setEditingCustomer(null);
    } catch (error) {
      alert('Error saving customer: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      company: customer.company || '',
      customerType: customer.customerType || 'individual'
    });
    setEditingCustomer(customer);
    setShowAddForm(true);
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerService.deleteCustomer(customerId);
        alert('Customer deleted successfully!');
        await fetchCustomers(); // Refresh the list
      } catch (error) {
        alert('Error deleting customer: ' + error.message);
      }
    }
  };

  const handleCancel = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      company: '',
      customerType: 'individual'
    });
    setShowAddForm(false);
    setEditingCustomer(null);
  };

  const toggleStatus = async (customerId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
     await customerService.updateCustomerStatus(customerId, newStatus);
      await fetchCustomers(); // Refresh the list
    } catch (error) {
      alert('Error updating customer status: ' + error.message);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const corporateCustomers = customers.filter(c => c.customerType === 'corporate').length;

  return (
    <div className="customer-management-container">
      {/* Single Header Section - Only one instance */}
      <div className="customer-header">
        {/* <p>Manage your customers and their information</p> */}
      </div>

      {/* Stats Cards */}
      <div className="customer-stats-grid">
        <div className="customer-stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Customers</h3>
            <span className="stat-number">{customers.length}</span>
          </div>
        </div>
        
        <div className="customer-stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Active Customers</h3>
            <span className="stat-number">{activeCustomers}</span>
          </div>
        </div>
        
        <div className="customer-stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>Corporate Clients</h3>
            <span className="stat-number">{corporateCustomers}</span>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="customer-actions-section">
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search customers by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            className="add-customer-btn"
            onClick={() => setShowAddForm(true)}
          >
            <span className="btn-icon">+</span>
            Add Customer
          </button>
        </div>
      </div>

      {/* Add/Edit Customer Form */}
      {showAddForm && (
        <div className="customer-form-modal">
          <div className="customer-form-card">
            <div className="form-header">
              <h3>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button className="close-btn" onClick={handleCancel}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="customer-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Customer Type</label>
                  <select
                    name="customerType"
                    value={form.customerType}
                    onChange={handleChange}
                  >
                    <option value="individual">Individual</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Enter company name"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter full address"
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Saving...' : (editingCustomer ? 'Update Customer' : 'Add Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="customers-table-section">
        <div className="table-header">
          <h2>Customer List ({filteredCustomers.length})</h2>
        </div>
        
        <div className="customers-table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Info</th>
                <th>Company</th>
                <th>Type</th>
                <th>Join Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer._id} className="customer-row">
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">{customer.name}</div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="customer-email">{customer.email}</div>
                        <div className="customer-phone">{customer.phone}</div>
                      </div>
                    </td>
                    <td>
                      <div className="company-info">
                        {customer.company || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <span className={`customer-type ${customer.customerType}`}>
                        {customer.customerType}
                      </span>
                    </td>
                    <td>
                 <div className="join-date">
                        {customer.joinDate 
                        ? new Date(customer.joinDate).toLocaleDateString() 
                      : customer.createdAt 
                       ? new Date(customer.createdAt).toLocaleDateString() 
                              : 'N/A'
                          }
                      </div>
                    </td>
                    <td>
                      <button 
                        className={`status-btn ${customer.status || 'active'}`}
                        onClick={() => toggleStatus(customer._id, customer.status || 'active')}
                      >
                        {customer.status || 'active'}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEdit(customer)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(customer._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagment;