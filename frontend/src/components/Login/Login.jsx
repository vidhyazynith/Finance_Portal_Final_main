import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebugInfo('');

    try {
      console.log('Form submitted with:', formData);
      await login(formData);
      console.log('Login successful, navigating to dashboard...');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login catch error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      
      // Add debug info
      setDebugInfo(`
        API URL: ${import.meta.env.VITE_API_URL}
        Status: ${error.response?.status}
        Data: ${JSON.stringify(error.response?.data)}
      `);
    } finally {
      setLoading(false);
    }
  };

  // Test function to check backend connection


  return (
    <div className="admin-login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Zynith IT Solutions</h2>
          <p>Admin Portal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Contact support if you forgot your password</p>
        </div>
      </div>
    </div>
  );
};

export default Login;