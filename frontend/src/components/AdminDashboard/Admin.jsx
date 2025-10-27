import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employee';
import { transactionService } from '../../services/transactions';
import Sidebar from '../Sidebar/Sidebar';
import EmployeeManagement from '../Employee/Employee';
import SalaryManagement from '../Salary/SalaryManagement';
import InOutTransactions from '../InOutTransactions/InOutTransactions';
import CustomerManagment from '../Customer/CustomerManagment';
import ReportsBilling from '../Invoice/ReportsBilling';
import CompanySettings from '../Company/CompanySettings';
import './AdminDashboard.css';

const Admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [employeeUpdateTrigger, setEmployeeUpdateTrigger] = useState(0);
  const [TransactionUpdateTrigger, setTransactionUpdateTrigger] = useState(0);
  const [transactionStats, setTransactionStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    incomeCount: 0,
    expenseCount: 0,
    totalCount: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Load employees
  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getEmployees();
      setEmployees(data.employees);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load transaction statistics using transaction service
  const loadTransactionStats = async () => {
    setStatsLoading(true);
    try {
      const statsData = await transactionService.getTransactionStats();
      const transactionsData = await transactionService.getTransactions();
      
      const incomeCount = transactionsData.transactions ? 
        transactionsData.transactions.filter(t => t.type === 'Income').length : 0;
      const expenseCount = transactionsData.transactions ? 
        transactionsData.transactions.filter(t => t.type === 'Expense').length : 0;
      
      // Get recent transactions for dashboard
      const recent = transactionsData.transactions ? 
        transactionsData.transactions.slice(0, 5) : [];
      
      setTransactionStats({
        totalIncome: statsData.totalIncome || 0,
        totalExpenses: statsData.totalExpenses || 0,
        netIncome: statsData.netIncome || 0,
        incomeCount,
        expenseCount,
        totalCount: incomeCount + expenseCount
      });
      
      setRecentTransactions(recent);
    } catch (error) {
      console.error('Error loading transaction statistics:', error);
      setTransactionStats({
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        incomeCount: 0,
        expenseCount: 0,
        totalCount: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Load employees when component mounts
  useEffect(() => {
    if (user) {
      loadEmployees();
    }
  }, [user, employeeUpdateTrigger]);

  useEffect(() => {
    loadTransactionStats();
  }, [TransactionUpdateTrigger]);

  // Function to trigger employee data refresh
  const refreshTransactionData = () => {
    setTransactionUpdateTrigger(prev => prev + 1);
  };
  
  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-IN').format(number);
  };

  // Function to trigger employee data refresh
  const refreshEmployeeData = () => {
    setEmployeeUpdateTrigger(prev => prev + 1);
  };

  // Calculate monthly salary from employees
  const monthlySalary = employees.reduce((total, employee) => {
    return total + (employee.salary || 0);
  }, 0);
  
  // Use real data from transactions
  const totalExpenses = transactionStats.totalExpenses || 0;
  const totalIncome = transactionStats.totalIncome || 0;
  const profit = transactionStats.netIncome || 0;

  // Format currency in Indian Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status color for transactions
  const getStatusColor = (status) => {
    const statusMap = {
      'completed': '#10b981',
      'pending': '#f59e0b',
      'failed': '#ef4444'
    };
    return statusMap[status?.toLowerCase()] || '#6b7280';
  };

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="content-area">
            {/* Welcome Banner */}
            <div className="welcome-banner" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                  Welcome back, Admin! 👋
                </h2>
                <p style={{ margin: 0, opacity: 0.9 }}>
                  Here's what's happening with your business today.
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '1rem',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Today's Date</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                  {new Date().toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>Total Employees</h3>
                  <span className="stat-number">{formatNumber(employees.length)}</span>
                  <span className="stat-change positive">
                    Active workforce
                  </span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>Total Expenses</h3>
                  <span className="stat-number">
                    {statsLoading ? 'Loading...' : formatCurrency(totalExpenses)}
                  </span>
                  <span className="stat-change negative">
                    {formatNumber(transactionStats.expenseCount || 0)} transactions
                  </span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💵</div>
                <div className="stat-content">
                  <h3>Monthly Salary</h3>
                  <span className="stat-number">
                    {formatCurrency(monthlySalary)}
                  </span>
                  <span className="stat-change positive">
                    {formatNumber(employees.length)} employees
                  </span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>Total Income</h3>
                  <span className="stat-number">
                    {statsLoading ? 'Loading...' : formatCurrency(totalIncome)}
                  </span>
                  <span className="stat-change positive">
                    {formatNumber(transactionStats.incomeCount || 0)} transactions
                  </span>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
              <div className="chart-card">
                <h3>Recent Transactions</h3>
                <div className="recent-payments">
                  {recentTransactions.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '2rem', 
                      color: '#6b7280' 
                    }}>
                      No recent transactions
                    </div>
                  ) : (
                    recentTransactions.map((transaction, index) => (
                      <div key={index} className="payment-row">
                        <div>
                          <div style={{ 
                            fontWeight: '500', 
                            color: '#1e293b',
                            marginBottom: '0.25rem'
                          }}>
                            {transaction.description || 'Transaction'}
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#64748b' 
                          }}>
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          gap: '1rem', 
                          alignItems: 'center' 
                        }}>
                          <span className={`payment-value amount ${
                            transaction.type === 'Income' ? 'income' : 'expense'
                          }`}>
                            {formatCurrency(transaction.amount)}
                          </span>
                          <span 
                            className="payment-status"
                            style={{
                              backgroundColor: transaction.type === 'Income' ? '#d1fae5' : '#fee2e2',
                              color: transaction.type === 'Income' ? '#065f46' : '#dc2626'
                            }}
                          >
                            {transaction.type}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="chart-card">
                <h3>Financial Overview</h3>
                <div className="income-expenses">
                  <div className="metric">
                    <span className="metric-label">Total Income:</span>
                    <span className="metric-value income">
                      {statsLoading ? 'Loading...' : formatCurrency(totalIncome)}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Total Expenses:</span>
                    <span className="metric-value expense">
                      {statsLoading ? 'Loading...' : formatCurrency(totalExpenses)}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Salary Expenses:</span>
                    <span className="metric-value expense">
                      {formatCurrency(monthlySalary)}
                    </span>
                  </div>
                  <div className="metric" style={{
                    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                    borderColor: '#0ea5e9'
                  }}>
                    <span className="metric-label" style={{ color: '#0369a1' }}>
                      Net Profit:
                    </span>
                    <span className={`metric-value ${profit >= 0 ? 'profit' : 'loss'}`}>
                      {statsLoading ? 'Loading...' : formatCurrency(profit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="chart-card">
              <h3>Quick Actions</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginTop: '1rem'
              }}>
                <button 
                  onClick={() => setActiveSection('employees')}
                  style={{
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    padding: '1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👥</div>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>Manage Employees</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Add, edit, or view employees</div>
                </button>
                
                <button 
                  onClick={() => setActiveSection('salary')}
                  style={{
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    padding: '1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💰</div>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>Salary Management</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Process salaries and payslips</div>
                </button>
                
                <button 
                  onClick={() => setActiveSection('transactions')}
                  style={{
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    padding: '1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>View Transactions</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Income and expense tracking</div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'employees':
        return <EmployeeManagement onEmployeeUpdate={refreshEmployeeData} />;
      
      case 'salary':
        return <SalaryManagement />;

      case 'reports':
        return <ReportsBilling />;

      case 'customers':
        return <CustomerManagment />;

      case 'transactions':
        return <InOutTransactions onTransactionUpdate={refreshTransactionData} />;

      case 'settings':
        return <CompanySettings />;

      default:
        return (
          <div className="content-area">
            <h2>Welcome to Admin Dashboard</h2>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Fixed Sidebar */}
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
      />

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1>{getSectionTitle(activeSection)}</h1>
          </div>
          <div className="header-right">
            <div className="admin-user">
              <span className="user-avatar">A</span>
              <span className="user-name">Admin</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </header>

        {/* Render Content Based on Active Section */}
        {renderContent()}
      </div>
    </div>
  );
};

// Helper function to get section title
const getSectionTitle = (sectionId) => {
  const sections = {
    dashboard: 'Dashboard Overview',
    employees: 'Employee Management',
    customers: 'Customer Management',
    salary: 'Salary Management',
    transactions: 'In/Out Transactions',
    reports: 'Reports & Billing',
    settings: 'Company Settings'
  };
  return sections[sectionId] || 'Dashboard';
};

export default Admin;