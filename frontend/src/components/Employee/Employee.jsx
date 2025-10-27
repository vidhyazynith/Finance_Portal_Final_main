import React, { useState, useEffect } from 'react';
import { employeeService } from '../../services/employee';
import { useAuth } from '../../context/AuthContext';
import './Employee.css';

const EmployeeManagement = ({onEmployeeUpdate}) => {
  const { user, logout } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  // const [nextEmployeeId, setNextEmployeeId] = useState('');
  const [formData, setFormData] = useState({
    // User fields
    personId: '',
    email: '',
    password: '',
    // Employee fields
    name: '',
    designation: '',
    department: '',
    phone: '',
    address: '',
    joiningDate: ''
  });
 
  // Load employees on component mount
  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getEmployees();
      setEmployees(data.employees);
      
      if (onEmployeeUpdate) {
        onEmployeeUpdate();
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);
 
  // Auto-dismiss messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000); // Auto dismiss after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeService.deleteEmployee(employeeId);
        loadEmployees();
        if (onEmployeeUpdate) {
          onEmployeeUpdate();
        }
        setSuccess('Employee deleted successfully!');
      } catch (error) {
        setError('Error deleting employee');
        console.error('Error deleting employee:', error);
      }
    }
  };
 
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editingEmployee) {
        // Update existing employee
        await employeeService.updateEmployee(editingEmployee.employeeId, formData);
        setSuccess('Employee updated successfully!');
      } else {
        // Add new employee
        const response = await employeeService.registerEmployee(formData);
        setSuccess('Employee registered successfully!');
      }
     
      // Reset form and close modal
      resetForm();
      setShowAddForm(false);
      setEditingEmployee(null);
      loadEmployees();
      if (onEmployeeUpdate) {
        onEmployeeUpdate();
      }
    } catch (error) {
      setError(error.response?.data?.message || (editingEmployee ? 'Update failed' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };
 
  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      personId: employee.employeeId,
      email: employee.email,
      password: '', // Don't pre-fill password for security
      name: employee.name,
      designation: employee.designation,
      department: employee.department,
      phone: employee.phone,
      address: employee.address,
      joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : ''
    });
    setShowAddForm(true);
  };
 
  const resetForm = () => {
    setFormData({
      personId: '', // Reset to next available ID
      email: '',
      password: '',
      name: '',
      designation: '',
      department: '',
      phone: '',
      address: '',
      joiningDate: ''
    });
    setEditingEmployee(null);
  };
 
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
 
  const handleCloseModal = () => {
    setShowAddForm(false);
    setEditingEmployee(null);
    resetForm();
  };

  // Reset form when opening add modal
  const handleAddButtonClick = () => {
    resetForm();
    setShowAddForm(true);
  };
 
  const departments = ['Engineering', 'Management', 'Design', 'HR', 'Finance', 'Marketing', 'Sales'];
  const designations = [
    'Senior Developer',
    'Junior Developer',
    'Project Manager',
    'UI/UX Designer',
    'HR Manager',
    'Finance Analyst',
    'Sales Executive'
  ];

  // Function to sort employees by Employee ID
  const sortEmployeesById = (employeesArray) => {
    return employeesArray.sort((a, b) => {
      // Extract numeric parts from employee IDs (e.g., ZIC001 -> 001, ZIC002 -> 002)
      const idA = a.employeeId?.replace(/\D/g, '') || '';
      const idB = b.employeeId?.replace(/\D/g, '') || '';
      
      // Convert to numbers for proper numeric sorting
      const numA = parseInt(idA, 10) || 0;
      const numB = parseInt(idB, 10) || 0;
      
      return numA - numB;
    });
  };
 
  const filteredEmployees = employees.filter(employee =>
    employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort the filtered employees by Employee ID
  const sortedEmployees = sortEmployeesById(filteredEmployees);
 
  return (
    <div className="employee-management">
      {/* Success and Error Messages */}
      {success && (
        <div className="alert success-alert">
          {success}
          <button className="close-alert" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {error && (
        <div className="alert error-alert">
          {error}
          <button className="close-alert" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters">
          <select className="filter-select">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <select className="filter-select">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Management</option>
            <option>Design</option>
            <option>Sales</option>
            <option>HR</option>
          </select>
        </div>
      </div>
 
      {/* Header with Add Button */}
      <div className="section-header">
        <h3>Employees ({sortedEmployees.length})</h3>
        <button
          className="add-employee-btn"
          onClick={handleAddButtonClick} // Updated to use new function
        >
          <span className="btn-icon">+</span>
          Add Employee
        </button>
      </div>
 
      {/* Employees Table */}
      <div className="employees-table-container">
        <table className="employees-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Phone</th>
              <th>Joining Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="loading-cell">
                  Loading employees...
                </td>
              </tr>
            ) : sortedEmployees.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">
                  No employees found
                </td>
              </tr>
            ) : (
              sortedEmployees.map(employee => (
                <tr key={employee._id || employee.employeeId} className="employee-row">
                  <td>
                    <div className="employee-info">
                      <div className="employee-id">{employee.employeeId}</div>
                    </div>
                  </td>
                  <td>
                    <div className="employee-info">
                      <div className="employee-name">{employee.name}</div>
                      <div className="employee-email">{employee.email}</div>
                    </div>
                  </td>
                  <td>{employee.designation}</td>
                  <td>
                    <span className="department-badge">{employee.department}</span>
                  </td>
                  <td>{employee.phone}</td>
                  <td>{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditEmployee(employee)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteEmployee(employee.employeeId)}
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
 
      {/* Add/Edit Employee Popup */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button
                className="close-btn"
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>
 
            <form onSubmit={handleAddEmployee} className="employee-form">
              <div className="form-group">
                <label htmlFor="employeeId">Employee ID</label>
                <input
                    type="text"
                    id="personId"
                    name="personId"
                    value={formData.personId}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingEmployee} // Disable when editing
                    // readOnly={!editingEmployee} // Read-only for new employees
                  />
              </div>
 
              {/* Rest of the form remains the same */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter employee name"
                    required
                  />
                </div>
 
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                    disabled={!!editingEmployee}
                  />
                  {editingEmployee && (
                    <small className="form-note">Email cannot be changed</small>
                  )}
                </div>
              </div>
 
              <div className='form-row'>
                <div className="form-group">
                  <label htmlFor="address">Address *</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter address"
                    required
                    rows="3"
                  />
                </div>
              </div>
 
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="designation">Designation *</label>
                  <select
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select designation</option>
                    {designations.map(desig => (
                      <option key={desig} value={desig}>{desig}</option>
                    ))}
                  </select>
                </div>
 
                <div className="form-group">
                  <label htmlFor="department">Department *</label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
 
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
 
                <div className="form-group">
                  <label htmlFor="joiningDate">Joining Date *</label>
                  <input
                    type="date"
                    id="joiningDate"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
 
              <div className='form-row'>
                <div className="form-group">
                  <label htmlFor="password">
                    Password {editingEmployee ? '(Leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="text"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    minLength="6"
                    required={!editingEmployee}
                  />
                </div>
              </div>
 
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading
                    ? (editingEmployee ? 'Updating Employee...' : 'Adding Employee...')
                    : (editingEmployee ? 'Update Employee' : 'Add Employee')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default EmployeeManagement;