import React, { useState, useEffect } from 'react';
import { 
  companyService, 
  defaultCompanyInfo, 
  currencyOptions, 
  fiscalYearOptions 
} from '../../services/company';
import './CompanySettings.css';

const CompanySettings = () => {
  const [companyInfo, setCompanyInfo] = useState(defaultCompanyInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load company info from backend
  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      setIsLoading(true);
      const result = await companyService.getCompanyInfo();
      
      if (result.success) {
        setCompanyInfo(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
      setSaveMessage('Error loading company information');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = companyService.validateCompanyData(companyInfo);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({
      ...prev,
      [name]: value
    }));
   
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
   
    try {
      setIsSaving(true);
      const result = await companyService.updateCompanyInfo(companyInfo);

      if (result.success) {
        setIsEditing(false);
        setSaveMessage('Company information saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
        
        // Update local state with the saved data from server
        setCompanyInfo(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error saving company info:', error);
      setSaveMessage('Error saving company information: ' + error.message);
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    fetchCompanyInfo(); // Reload original data from server
    setIsEditing(false);
    setErrors({});
    setSaveMessage('');
  };

  if (isLoading) {
    return (
      <div className="company-settings">
        <div className="settings-layout">
          <div className="form-section">
            <div className="loading-message">Loading company information...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="company-settings">
      {saveMessage && (
        <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
          {saveMessage}
        </div>
      )}

      <div className="settings-layout">
        {/* Left Side - Form */}
        <div className="form-section">
          <div className="company-info-card">
            <div className="card-header">
              <h3>Company Details</h3>
              {!isEditing && (
                <button
                  className="edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <span className="edit-icon">✏️</span>
                  Edit Information
                </button>
              )}
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="companyName">Company Name</label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={companyInfo.companyName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'disabled' : ''}
                  placeholder="Enter company name"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="address" className="required">
                  Company Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={companyInfo.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`${!isEditing ? 'disabled' : ''} ${errors.address ? 'error' : ''}`}
                  rows="3"
                  placeholder="Enter full company address"
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={companyInfo.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'disabled' : ''}
                  placeholder="+91 1234567890"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={companyInfo.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`${!isEditing ? 'disabled' : ''} ${errors.email ? 'error' : ''}`}
                  placeholder="contact@company.com"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="website">Website</label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={companyInfo.website}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`${!isEditing ? 'disabled' : ''}`}
                  placeholder="https://www.company.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="taxId">Tax ID / VAT Number</label>
                <input
                  type="text"
                  id="taxId"
                  name="taxId"
                  value={companyInfo.taxId}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'disabled' : ''}
                  placeholder="TAX-123456789"
                />
              </div>

              <div className="form-group">
                <label htmlFor="currency">Default Currency</label>
                <select
                  id="currency"
                  name="currency"
                  value={companyInfo.currency}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'disabled' : ''}
                >
                  {currencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="fiscalYear">Fiscal Year Start</label>
                <select
                  id="fiscalYear"
                  name="fiscalYear"
                  value={companyInfo.fiscalYear}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'disabled' : ''}
                >
                  {fiscalYearOptions.map(month => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isEditing && (
              <div className="action-buttons">
                <button 
                  className="save-btn" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <span className="save-icon">💾</span>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="cancel-btn" 
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="preview-section">
          <div className="preview-card">
            <div className="preview-header">
              <h3>Company Information Preview</h3>
              <div className="preview-badge">Live Preview</div>
            </div>
            <div className="preview-content">
              <div className="preview-item">
                <span className="preview-label">Company Name:</span>
                <span className="preview-value">{companyInfo.companyName || <span className="missing-info">Not provided</span>}</span>
              </div>
             
              <div className="preview-item">
                <span className="preview-label">Address:</span>
                <span className="preview-value">
                  {companyInfo.address || <span className="missing-info">Not provided</span>}
                </span>
              </div>
             
              <div className="preview-item">
                <span className="preview-label">Phone:</span>
                <span className="preview-value">
                  {companyInfo.phone || <span className="missing-info">Not provided</span>}
                </span>
              </div>
             
              <div className="preview-item">
                <span className="preview-label">Email:</span>
                <span className="preview-value">
                  {companyInfo.email || <span className="missing-info">Not provided</span>}
                </span>
              </div>
             
              <div className="preview-item">
                <span className="preview-label">Website:</span>
                <span className="preview-value">
                  {companyInfo.website || <span className="missing-info">Not provided</span>}
                </span>
              </div>
             
              <div className="preview-item">
                <span className="preview-label">Tax ID:</span>
                <span className="preview-value">
                  {companyInfo.taxId || <span className="missing-info">Not provided</span>}
                </span>
              </div>
             
              <div className="preview-item">
                <span className="preview-label">Currency:</span>
                <span className="preview-value">{companyInfo.currency}</span>
              </div>
             
              <div className="preview-item">
                <span className="preview-label">Fiscal Year:</span>
                <span className="preview-value">Starts in {companyInfo.fiscalYear}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;