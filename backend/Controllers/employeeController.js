import Employee from "../models/Employee.js";
import User from '../models/User.js';
import { sendEmployeeCredentials } from '../services/emailService.js';

//register employee
export const registerEmployee = async (req, res) => {
  try {
    const { 
      personId, 
      email, 
      password,
      name,
      designation,
      department,
      phone,
      address,
      joiningDate
    } = req.body;

    // Validation
    if (!personId || !email || !password || !name || !designation || !department || !phone || !address || !joiningDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { personId }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or Person ID' });
    }

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({
      $or: [{ email }, { employeeId: personId }]
    });

    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee already exists with this email or Employee ID' });
    }

    // Create user
    const user = new User({
      personId,
      email,
      password,
      role: 'employee',
      createdBy: req.user._id
    });

    await user.save();

    // Create employee record
    const employee = new Employee({
      employeeId: personId, // Link through personId
      name,
      email,
      designation,
      department,
      phone,
      address,
      joiningDate: new Date(joiningDate)
    });

    await employee.save();

    // Send email with credentials (don't await to avoid blocking response)
    sendEmployeeCredentials(
      { personId, email }, 
      password
    ).then(result => {
      if (result.success) {
        console.log(`Credentials email sent to ${email}`);
      } else {
        console.error(`Failed to send email to ${email}:`, result.error);
      }
    });

    res.status(201).json({
      message: 'Employee registered successfully. Credentials email sent.',
      employee: {
        id: employee._id,
        personId: employee.personId,
        email: employee.email,
        role: employee.role,
        createdAt: employee.createdAt
      }
    });
  } catch (error) {
    console.error('Error registering employee:', error);
    res.status(500).json({ message: 'Server error during employee registration' });
  }
};

//get all employee
export const getAllEmployee = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json({ employees });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching employees' });
  }
};

// Get employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching employee' });
  }
};

// Update employee
export const updateEmployee =  async (req, res) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { employeeId: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee updated successfully', employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating employee' });
  }
};

//delete employee
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndDelete({ employeeId: req.params.id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting employee' });
  }
};
