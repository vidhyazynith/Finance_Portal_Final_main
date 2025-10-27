import React, { useState, useEffect } from 'react';
import { salaryService } from '../../services/salary';
import './SalaryManagement.css';

const SalaryManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [showPayslipsModal, setShowPayslipsModal] = useState(false);
  const [selectedEmployeePayslips, setSelectedEmployeePayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [payslipStatus, setPayslipStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedSalaryDetail, setSelectedSalaryDetail] = useState(null);
  const [showSalaryDetail, setShowSalaryDetail] = useState(false);
  const [hikePercentage, setHikePercentage] = useState('');
  const [showHikeForm, setShowHikeForm] = useState(false);

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  const [formData, setFormData] = useState({
    employeeId: '',
    month: currentMonth,
    year: currentYear,
    basicSalary: '',
    paidDays: 0,
    lopDays: 0,
    remainingLeaves: 0,
    leaveTaken: 0,
    earnings: [{ type: '', amount: 0 }],
    deductions: [{ type: '', amount: 0 }],
    status: 'draft'
  });

  useEffect(() => {
    loadEmployees();
    loadSalaries();
  }, []);

  useEffect(() => {
    if (salaries.length > 0) {
      checkPayslipStatus();
    }
  }, [salaries]);

  const loadEmployees = async () => {
    try {
      const data = await salaryService.getEmployeesForSalary();
      setEmployees(data.employees);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadSalaries = async () => {
    setLoading(true);
    try {
      const data = await salaryService.getSalaries();
      setSalaries(data.salaries);
    } catch (error) {
      console.error('Error loading salaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPayslipStatus = async () => {
    const status = {};
    
    for (const salary of salaries) {
      try {
        const payslipsData = await salaryService.getEmployeePayslips(salary.employeeId);
        const hasPayslipForThisMonth = payslipsData.payslips.some(
          payslip => payslip.month === salary.month && payslip.year === salary.year
        );
        
        status[salary._id] = {
          hasPayslip: hasPayslipForThisMonth,
          canGenerate: !hasPayslipForThisMonth
        };
      } catch (error) {
        console.error(`Error checking payslip status for ${salary.employeeId}:`, error);
        status[salary._id] = {
          hasPayslip: false,
          canGenerate: true
        };
      }
    }
    
    setPayslipStatus(status);
  };

  const updatePayslipStatusAfterDelete = async (employeeId, month, year) => {
    try {
      const salaryRecord = salaries.find(
        salary => 
          salary.employeeId === employeeId && 
          salary.month === month && 
          salary.year === year
      );

      if (salaryRecord) {
        setPayslipStatus(prev => ({
          ...prev,
          [salaryRecord._id]: {
            hasPayslip: false,
            canGenerate: true
          }
        }));
      }
    } catch (error) {
      console.error('Error updating payslip status after delete:', error);
    }
  };

  const filterSalaries = salaries.filter(salary => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (salary.employeeId && salary.employeeId.toLowerCase().includes(searchLower)) ||
      (salary.name && salary.name.toLowerCase().includes(searchLower)) ||
      (salary.month && salary.month.toLowerCase().includes(searchLower)) ||
      (salary.year && salary.year.toString().includes(searchTerm))
    );
  });

  const handleEmployeeSelect = async (employeeId) => {
    setSelectedEmployee(employeeId);
    setFormData(prev => ({ ...prev, employeeId }));

    if (employeeId) {
      try {
        const data = await salaryService.getEmployeeDetails(employeeId);
        setEmployeeDetails(data.employee);
      } catch (error) {
        console.error('Error loading employee details:', error);
      }
    } else {
      setEmployeeDetails(null);
    }
  };

  const handleSalaryDetail = async (salary) => {
    try {
      const data = await salaryService.getSalaryById(salary._id);
      setSelectedSalaryDetail(data.salary);
      setShowSalaryDetail(true);
    } catch (error) {
      console.error('Error loading salary details:', error);
      alert('Error loading salary details');
    }
  };

  const handleGiveHike = (salary) => {
    setSelectedSalaryDetail(salary);
    setShowHikeForm(true);
    setHikePercentage('');
  };

  const applyHike = async () => {
    if (!hikePercentage || isNaN(hikePercentage) || hikePercentage <= 0) {
      alert('Please enter a valid hike percentage');
      return;
    }

    try {
      const hikeAmount = (selectedSalaryDetail.basicSalary * hikePercentage) / 100;
      const newBasicSalary = selectedSalaryDetail.basicSalary + hikeAmount;

      const updatedSalary = {
        ...selectedSalaryDetail,
        basicSalary: newBasicSalary,
        earnings: selectedSalaryDetail.earnings.map(earning => ({
          ...earning,
          amount: earning.type === 'Hike' ? hikeAmount : earning.amount
        }))
      };

      // Check if there's already a hike earning, if not add one
      const hasHikeEarning = updatedSalary.earnings.some(earning => earning.type === 'Hike');
      if (!hasHikeEarning) {
        updatedSalary.earnings.push({
          type: 'Hike',
          amount: hikeAmount
        });
      }

      await salaryService.updateSalary(selectedSalaryDetail._id, updatedSalary);
      alert(`Hike of ${hikePercentage}% applied successfully! New basic salary: Rs.${newBasicSalary.toFixed(2)}`);
      setShowHikeForm(false);
      setHikePercentage('');
      setShowSalaryDetail(false);
      loadSalaries();
    } catch (error) {
      alert('Error applying hike');
      console.error('Error applying hike:', error);
    }
  };

  const checkDuplicateSalary = (employeeId, month, year, excludeSalaryId = null) => {
    return salaries.some(salary =>
      salary.employeeId === employeeId &&
      salary.month === month &&
      salary.year === year &&
      salary._id !== excludeSalaryId
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEarningChange = (index, field, value) => {
    const updatedEarnings = [...formData.earnings];
    updatedEarnings[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, earnings: updatedEarnings }));
  };

  const handleDeductionChange = (index, field, value) => {
    const updatedDeductions = [...formData.deductions];
    updatedDeductions[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, deductions: updatedDeductions }));
  };

  const addEarning = () => {
    setFormData(prev => ({
      ...prev,
      earnings: [...prev.earnings, { type: 'Bonus', amount: 0 }]
    }));
  };

  const removeEarning = (index) => {
    setFormData(prev => ({
      ...prev,
      earnings: prev.earnings.filter((_, i) => i !== index)
    }));
  };

  const addDeduction = () => {
    setFormData(prev => ({
      ...prev,
      deductions: [...prev.deductions, { type: 'Insurance', amount: 0 }]
    }));
  };

  const removeDeduction = (index) => {
    setFormData(prev => ({
      ...prev,
      deductions: prev.deductions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isDuplicate = checkDuplicateSalary(
        formData.employeeId,
        formData.month,
        formData.year,
        editingSalary?._id
      );
      if (isDuplicate) {
        alert('A salary record for this employee for the selected month and year already exists.');
        setLoading(false);
        return;
      }
      if (editingSalary) {
        const isMonthChanged = formData.month !== editingSalary.month || formData.year !== editingSalary.year;
        const updateData = {
          ...formData,
          status: isMonthChanged ? 'draft' : formData.status
        };
        await salaryService.updateSalary(editingSalary._id, updateData);
        if (isMonthChanged) {
          alert('Salary record updated! Month/Year changed, status reset to draft.');
        } else {
          alert('Salary record updated successfully!');
        }
      } else {
        const submitData = { ...formData, status: 'draft' };
        await salaryService.createSalary(submitData);
        alert('Salary record created successfully!');
      }
      
      setShowSalaryForm(false);
      resetForm();
      loadSalaries();
    } catch (error) {
      alert(error.response?.data?.message || `Error ${editingSalary ? 'updating' : 'creating'} salary record`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      month: currentMonth,
      year: currentYear,
      basicSalary: '',
      paidDays: 0,
      lopDays: 0,
      remainingLeaves: 0,
      leaveTaken: 0,
      earnings: [{ type: '', amount: 0 }],
      deductions: [{ type: '', amount: 0 }],
      status: 'draft'
    });
    setSelectedEmployee('');
    setEmployeeDetails(null);
    setEditingSalary(null);
  };

  const handleEditSalary = async (salary) => {
    try {
      const data = await salaryService.getSalaryById(salary._id);
      const salaryDetails = data.salary;
      
      setFormData({
        employeeId: salaryDetails.employeeId,
        month: salaryDetails.month,
        year: salaryDetails.year,
        basicSalary: salaryDetails.basicSalary,
        paidDays: salaryDetails.paidDays,
        lopDays: salaryDetails.lopDays,
        remainingLeaves: salaryDetails.remainingLeaves,
        leaveTaken: salaryDetails.leaveTaken, 
        earnings: salaryDetails.earnings.length > 0 ? salaryDetails.earnings : [{ type: '', amount: 0 }],
        deductions: salaryDetails.deductions.length > 0 ? salaryDetails.deductions : [{ type: '', amount: 0 }],
        status: salaryDetails.status
      });
      
      setSelectedEmployee(salaryDetails.employeeId);
      setEditingSalary(salaryDetails);
      setShowSalaryForm(true);
      
      const employeeData = await salaryService.getEmployeeDetails(salaryDetails.employeeId);
      setEmployeeDetails(employeeData.employee);
    } catch (error) {
      console.error('Error loading salary details:', error);
      alert('Error loading salary details for editing');
    }
  };

  const handleDeleteSalary = async (salaryId) => {
    if (window.confirm('Are you sure you want to delete this salary record?')) {
      try {
        await salaryService.deleteSalary(salaryId);
        loadSalaries();
      } catch (error) {
        alert('Error deleting salary record');
      }
    }
  };

  const handleDeletePayslip = async (payslipId) => {
    if (window.confirm('Are you sure you want to delete this payslip?')) {
      try {
        const payslipToDelete = selectedEmployeePayslips.find(p => p._id === payslipId);
        
        if (payslipToDelete) {
          await salaryService.deletePayslip(payslipId);
          
          await updatePayslipStatusAfterDelete(
            selectedEmployeeId, 
            payslipToDelete.month, 
            payslipToDelete.year
          );
          
          const data = await salaryService.getEmployeePayslips(selectedEmployeeId);
          setSelectedEmployeePayslips(data.payslips);
          
          alert('Payslip deleted successfully!');
        }
      } catch (error) {
        alert('Error deleting payslip');
      }
    }
  };

  const handleGeneratePayslip = async (salaryId) => {
    try {
      await salaryService.generatePayslip(salaryId);
      alert('Payslip generated and sent to employee email!');

      setPayslipStatus(prev => ({
        ...prev,
        [salaryId]: {
          hasPayslip: true,
          canGenerate: false
        }
      }));

      loadSalaries();
    } catch (error) {
      alert(error.response?.data?.message || 'Error generating payslip');
    }
  };

  const handleViewPayslips = async (employeeId) => {
    try {
      setSelectedEmployeeId(employeeId);
      const data = await salaryService.getEmployeePayslips(employeeId);
      setSelectedEmployeePayslips(data.payslips);
      setShowPayslipsModal(true);
    } catch (error) {
      console.error('Error loading payslips:', error);
    }
  };

  const handleDownloadPayslip = async (payslipId) => {
    try {
      const blob = await salaryService.downloadPayslip(payslipId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `payslip-${payslipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error downloading payslip');
    }
  };

  const openAddForm = () => {
    resetForm();
    setShowSalaryForm(true);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fixed salary summary calculations
  const totalEarnings = formData.earnings.reduce((sum, earning) => sum + (parseFloat(earning.amount) || 0), 0);
  const totalDeductions = formData.deductions.reduce((sum, deduction) => sum + (parseFloat(deduction.amount) || 0), 0);
  const basicSalary = parseFloat(formData.basicSalary) || 0;
  const grossEarnings = basicSalary + totalEarnings;
  const netPay = grossEarnings - totalDeductions;

  // Calculate totals for selected salary detail
  const selectedTotalEarnings = selectedSalaryDetail ? selectedSalaryDetail.earnings.reduce((sum, earning) => sum + (parseFloat(earning.amount) || 0), 0) : 0;
  const selectedTotalDeductions = selectedSalaryDetail ? selectedSalaryDetail.deductions.reduce((sum, deduction) => sum + (parseFloat(deduction.amount) || 0), 0) : 0;
  const selectedGrossEarnings = selectedSalaryDetail ? (selectedSalaryDetail.basicSalary + selectedTotalEarnings) : 0;
  const selectedNetPay = selectedSalaryDetail ? (selectedGrossEarnings - selectedTotalDeductions) : 0;

  return (
    <div className="salary-management">
      {/* Header with Stats */}
      <div className="salary-header">
        <div className="header-title">
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-value">{salaries.length}</div>
              <div className="stat-label">Total Records</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {salaries.filter(s => s.status === 'paid').length}
              </div>
              <div className="stat-label">Paid Salaries</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {salaries.filter(s => s.status === 'draft').length}
              </div>
              <div className="stat-label">Draft Records</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by Employee ID, Name, Month, or Year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="add-salary-btn" onClick={openAddForm}>
          <span>+</span>
          Add Salary Record
        </button>
      </div>

      {/* Salary Table */}
      <div className="salary-table-container">
        {loading ? (
          <div className="table-loading">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="table-row loading-shimmer" style={{height: '60px'}}></div>
            ))}
          </div>
        ) : filterSalaries.length === 0 ? (
          <div className="no-records">
            <div style={{textAlign: 'center', padding: '40px', color: '#6b7280'}}>
              <h3>No salary records found</h3>
              <p>{searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first salary record'}</p>
            </div>
          </div>
        ) : (
          <div className="salary-list-container">
            <div className="table-container">
              <table className="salary-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Month</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filterSalaries.map((salary) => (
                    <tr key={salary._id} className="salary-table-row" onClick={() => handleSalaryDetail(salary)}>
                      <td>
                        <div className="employee-cell">
                          <div className="employee-details">
                            <div className="employee-name">{salary.name || 'Unknown Employee'}</div>
                            <div className="employee-designation">{salary.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="period-cell">
                          <span className="month">{salary.month}</span>
                          <span className="year">{salary.year}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${salary.status}`}>
                          {salary.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="action-btn primary"
                            onClick={() => handleViewPayslips(salary.employeeId)}
                            title="View Payslips"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
                          <button
                            className={`action-btn ${payslipStatus[salary._id]?.hasPayslip ? 'success' : 'warning'}`}
                            onClick={() => handleGeneratePayslip(salary._id)}
                            disabled={payslipStatus[salary._id]?.hasPayslip}
                            title={payslipStatus[salary._id]?.hasPayslip ? 'Paid' : 'Generate Payslip'}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => handleEditSalary(salary)}
                            title="Edit Salary"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            className="action-btn danger"
                            onClick={() => handleDeleteSalary(salary._id)}
                            title="Delete Record"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Salary Detail Modal */}
      {showSalaryDetail && selectedSalaryDetail && (
        <div className="modal-overlay" onClick={() => setShowSalaryDetail(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Salary Details - {selectedSalaryDetail.name}</h3>
              <button className="close-btn" onClick={() => setShowSalaryDetail(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="salary-detail-container">
                {/* Employee Information */}
                <div className="detail-section">
                  <h4 className="section-title">Employee Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Employee ID:</span>
                      <span className="detail-value">{selectedSalaryDetail.employeeId}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{selectedSalaryDetail.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Period:</span>
                      <span className="detail-value">{selectedSalaryDetail.month} {selectedSalaryDetail.year}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={`status-badge status-${selectedSalaryDetail.status}`}>
                        {selectedSalaryDetail.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Salary Breakdown */}
                <div className="detail-section">
                  <h4 className="section-title">Salary Breakdown</h4>
                  <div className="breakdown-grid">
                    <div className="breakdown-column">
                      <h5>Earnings</h5>
                      <div className="breakdown-item">
                        <span>Basic Salary:</span>
                        <span>Rs.{selectedSalaryDetail.basicSalary?.toFixed(2)}</span>
                      </div>
                      {selectedSalaryDetail.earnings?.map((earning, index) => (
                        <div key={index} className="breakdown-item">
                          <span>{earning.type}:</span>
                          <span>Rs.{earning.amount?.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="breakdown-total">
                        <span>Total Earnings:</span>
                        <span>Rs.{selectedGrossEarnings.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="breakdown-column">
                      <h5>Deductions</h5>
                      {selectedSalaryDetail.deductions?.map((deduction, index) => (
                        <div key={index} className="breakdown-item">
                          <span>{deduction.type}:</span>
                          <span>Rs.{deduction.amount?.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="breakdown-total">
                        <span>Total Deductions:</span>
                        <span>Rs.{selectedTotalDeductions.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Net Pay Summary */}
                  <div className="net-pay-summary">
                    <div className="net-pay-item">
                      <span>Net Pay:</span>
                      <span className="net-pay-amount">Rs.{selectedNetPay.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Leave Information */}
                <div className="detail-section">
                  <h4 className="section-title">Leave Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Paid Days:</span>
                      <span className="detail-value">{selectedSalaryDetail.paidDays}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">LOP Days:</span>
                      <span className="detail-value">{selectedSalaryDetail.lopDays}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Leave Taken:</span>
                      <span className="detail-value">{selectedSalaryDetail.leaveTaken}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Remaining Leaves:</span>
                      <span className="detail-value">{selectedSalaryDetail.remainingLeaves}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="detail-actions">
                  <button 
                    className="action-btn primary"
                    onClick={() => handleGiveHike(selectedSalaryDetail)}
                  >
                    Give Hike
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => handleEditSalary(selectedSalaryDetail)}
                  >
                    Edit Salary
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => setShowSalaryDetail(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hike Form Modal */}
      {showHikeForm && selectedSalaryDetail && (
        <div className="modal-overlay" onClick={() => setShowHikeForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Give Hike - {selectedSalaryDetail.name}</h3>
              <button className="close-btn" onClick={() => setShowHikeForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="hike-form">
                <div className="form-group">
                  <label className="form-label">Current Basic Salary</label>
                  <input
                    type="text"
                    className="form-input"
                    value={`Rs.${selectedSalaryDetail.basicSalary?.toFixed(2)}`}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hike Percentage (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={hikePercentage}
                    onChange={(e) => setHikePercentage(e.target.value)}
                    placeholder="Enter hike percentage"
                    min="1"
                    max="100"
                  />
                </div>
                {hikePercentage && (
                  <div className="hike-preview">
                    <div className="hike-calculation">
                      <span>Hike Amount:</span>
                      <span>Rs.{(selectedSalaryDetail.basicSalary * hikePercentage / 100).toFixed(2)}</span>
                    </div>
                    <div className="hike-calculation total">
                      <span>New Basic Salary:</span>
                      <span>Rs.{(selectedSalaryDetail.basicSalary * (1 + hikePercentage / 100)).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowHikeForm(false)} 
                    className="action-btn"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={applyHike}
                    className="action-btn primary"
                    disabled={!hikePercentage}
                  >
                    Apply Hike
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Salary Form Modal */}
      {showSalaryForm && (
        <div className="modal-overlay" onClick={() => setShowSalaryForm(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSalary ? 'Edit Salary Record' : 'Add Salary Record'}</h3>
              <button className="close-btn" onClick={() => setShowSalaryForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="salary-form">
                <div className="form-sections">
                  {/* Employee Information */}
                  <div className="form-section">
                    <h4 className="section-title">Employee Information</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Select Employee *</label>
                        <select
                          className="form-select"
                          value={selectedEmployee}
                          onChange={(e) => handleEmployeeSelect(e.target.value)}
                          required
                          disabled={!!editingSalary}
                        >
                          <option value="">Select Employee</option>
                          {employees.map(emp => (
                            <option key={emp.employeeId} value={emp.employeeId}>
                              {emp.employeeId} - {emp.name} ({emp.designation})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {employeeDetails && (
                      <div className="employee-auto-fill">
                        <div className="auto-fill-info">
                          <p><strong>Name:</strong> {employeeDetails.name}</p>
                          <p><strong>Email:</strong> {employeeDetails.email}</p>
                          <p><strong>Designation:</strong> {employeeDetails.designation}</p>
                          <p><strong>Department:</strong> {employeeDetails.department}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Salary Period */}
                  <div className="form-section">
                    <h4 className="section-title">Salary Period</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Month *</label>
                        <select
                          className="form-select"
                          name="month"
                          value={formData.month}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Month</option>
                          {months.map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Year *</label>
                        <input
                          type="number"
                          className="form-input"
                          name="year"
                          value={formData.year}
                          onChange={handleInputChange}
                          required
                          disabled={!!editingSalary}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Salary Details */}
                  <div className="form-section">
                    <h4 className="section-title">Salary Details</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Basic Salary *</label>
                        <input
                          type="number"
                          className="form-input"
                          name="basicSalary"
                          value={formData.basicSalary}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Paid Days</label>
                        <input
                          type="number"
                          className="form-input"
                          name="paidDays"
                          value={formData.paidDays}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">LOP Days</label>
                        <input
                          type="number"
                          className="form-input"
                          name="lopDays"
                          value={formData.lopDays}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Remaining Leaves</label>
                        <input
                          type="number"
                          className="form-input"
                          name="remainingLeaves"
                          value={formData.remainingLeaves}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Leave Taken</label>
                        <input
                          type="number"
                          className="form-input"
                          name="leaveTaken"
                          value={formData.leaveTaken}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Earnings */}
                  <div className="form-section">
                    <div className="section-header">
                      <h4 className="section-title">Additional Earnings</h4>
                      <button type="button" onClick={addEarning} className="add-item">
                        + Add Earning
                      </button>
                    </div>
                    <div className="dynamic-items">
                      {formData.earnings.map((earning, index) => (
                        <div key={index} className="item-row">
                          <div className="form-group">
                            <label className="form-label">Type</label>
                            <input
                              type="text"
                              className="form-input"
                              value={earning.type}
                              onChange={(e) => handleEarningChange(index, 'type', e.target.value)}
                              placeholder="Earning type"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Amount</label>
                            <input
                              type="number"
                              className="form-input"
                              value={earning.amount}
                              onChange={(e) => handleEarningChange(index, 'amount', e.target.value)}
                              placeholder="Amount"
                            />
                          </div>
                          {formData.earnings.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEarning(index)}
                              className="remove-item"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="form-section">
                    <div className="section-header">
                      <h4 className="section-title">Deductions</h4>
                      <button type="button" onClick={addDeduction} className="add-item">
                        + Add Deduction
                      </button>
                    </div>
                    <div className="dynamic-items">
                      {formData.deductions.map((deduction, index) => (
                        <div key={index} className="item-row">
                          <div className="form-group">
                            <label className="form-label">Type</label>
                            <input
                              type="text"
                              className="form-input"
                              value={deduction.type}
                              onChange={(e) => handleDeductionChange(index, 'type', e.target.value)}
                              placeholder="Deduction type"
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Amount</label>
                            <input
                              type="number"
                              className="form-input"
                              value={deduction.amount}
                              onChange={(e) => handleDeductionChange(index, 'amount', e.target.value)}
                              placeholder="Amount"
                            />
                          </div>
                          {formData.deductions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDeduction(index)}
                              className="remove-item"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Salary Summary */}
                  <div className="form-section">
                    <h4 className="section-title">Salary Summary</h4>
                    <div className="summary-table">
                      <div className="summary-table-row">
                        <span className="summary-table-label">Basic Salary:</span>
                        <span className="summary-table-value">Rs.{basicSalary.toFixed(2)}</span>
                      </div>
                      <div className="summary-table-row">
                        <span className="summary-table-label">Additional Earnings:</span>
                        <span className="summary-table-value">Rs.{totalEarnings.toFixed(2)}</span>
                      </div>
                      <div className="summary-table-row total">
                        <span className="summary-table-label">Gross Earnings:</span>
                        <span className="summary-table-value">Rs.{grossEarnings.toFixed(2)}</span>
                      </div>
                      <div className="summary-table-row">
                        <span className="summary-table-label">Total Deductions:</span>
                        <span className="summary-table-value">Rs.{totalDeductions.toFixed(2)}</span>
                      </div>
                      <div className="summary-table-row net">
                        <span className="summary-table-label">Net Pay:</span>
                        <span className="summary-table-value">Rs.{netPay.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="form-actions">
                    <button 
                      type="button" 
                      onClick={() => setShowSalaryForm(false)} 
                      className="action-btn"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="action-btn primary"
                    >
                      {loading ? (editingSalary ? 'Updating...' : 'Creating...') : (editingSalary ? 'Update Salary Record' : 'Create Salary Record')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payslips Modal */}
      {showPayslipsModal && (
        <div className="modal-overlay" onClick={() => setShowPayslipsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Employee Payslips</h3>
              <button className="close-btn" onClick={() => setShowPayslipsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="payslips-grid">
                {selectedEmployeePayslips.length === 0 ? (
                  <p className="text-muted" style={{textAlign: 'center', padding: '20px'}}>
                    No payslips found for this employee.
                  </p>
                ) : (
                  selectedEmployeePayslips.map(payslip => (
                    <div key={payslip._id} className="payslip-card">
                      <div className="payslip-info">
                        <div className="payslip-period">
                          {payslip.month} {payslip.year}
                        </div>
                        <div className="payslip-amount">
                          Rs.{payslip.netPay}
                        </div>
                        <div className="payslip-date">
                          Generated: {new Date(payslip.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="payslip-actions">
                        <button
                          onClick={() => handleDownloadPayslip(payslip._id)}
                          className="action-btn primary"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDeletePayslip(payslip._id)}
                          className="action-btn danger"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div> 
        </div>
      )}
    </div>
  );
};

export default SalaryManagement;