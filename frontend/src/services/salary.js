import api from './api';

export const salaryService = {
    async getEmployeesForSalary() {
    const response = await api.get('/salaries/employees');
    return response.data;
  },
 
  // Get employee details by ID
  async getEmployeeDetails(employeeId) {
    const response = await api.get(`/salaries/employee/${employeeId}`);
    return response.data;
  },
 
  // Create salary record
  async createSalary(salaryData) {
    const response = await api.post('/salaries', salaryData);
    return response.data;
  },
 
  // Get all salary records
  async getSalaries() {
    const response = await api.get('/salaries');
    return response.data;
  },
 
  // Get salary by ID
  async getSalaryById(salaryId) {
    const response = await api.get(`/salaries/${salaryId}`);
    return response.data;
  },
 
  // Update salary record
  async updateSalary(salaryId, salaryData) {
    const response = await api.put(`/salaries/${salaryId}`, salaryData);
    return response.data;
  },
 
  // Delete salary record
  async deleteSalary(salaryId) {
    const response = await api.delete(`/salaries/${salaryId}`);
    return response.data;
  },

  async deletePayslip(payslipId) {
    const response = await api.delete(`/salaries/payslip/${payslipId}`);
    return response.data;
  },
 
  // Generate payslip
  async generatePayslip(salaryId) {
    const response = await api.post(`/salaries/${salaryId}/generate-payslip`);
    return response.data;
  },
 
  // Get payslips for employee
  async getEmployeePayslips(employeeId) {
    const response = await api.get(`/salaries/payslips/${employeeId}`);
    return response.data;
  },
 
  // Download payslip PDF
  async downloadPayslip(payslipId) {
    const response = await api.get(`/salaries/payslip/${payslipId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

};