import React from 'react';
import './Sidebar.css';

const Sidebar = ({ activeSection, setActiveSection, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'employees', label: 'Employee Management', icon: '👥' },
    { id: 'customers', label: 'Customer Management', icon: '👥' },
    { id: 'salary', label: 'Salary Management', icon: '💰' },
    { id: 'transactions', label: 'In/Out Transactions', icon: '🔄' },
    { id: 'reports', label: 'Reports & Billing', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="sidebar">
      <div className="company-brand">
        <h2>Zynith IT Solutions</h2>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => setActiveSection(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
