import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema({
  employeeId: { 
    type: String, 
    required: true,
    ref: 'Employee' 
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  designation: { 
    type: String, 
    required: true 
  },
  month: { 
    type: String, 
    required: true 
  },
  year: {
    type: Number,
    required: true,
    default: new Date()
  },
  payDate: { 
    type: Date, 
    default: Date.now 
  },
  basicSalary: { 
    type: Number, 
    required: true 
  },
  grossEarnings: { 
    type: Number, 
    required: true 
  },
  totalDeductions: { 
    type: Number, 
    required: true 
  },
  netPay: { 
    type: Number, 
    required: true 
  },
  paidDays: { 
    type: Number, 
    default: 0 
  },
  remainingLeaves: { 
    type: Number, 
    default: 0 
  },
  leaveTaken: { 
    type: Number, 
    default: 0 
  },
  lopDays: { 
    type: Number, 
    default: 0 
  },
  earnings: [
    { 
      type: { 
        type: String, 
        required: true 
      }, 
      amount: { 
        type: Number, 
        required: true 
      } 
    }
  ],
  deductions: [
    { 
      type: { 
        type: String, 
        required: true 
      }, 
      amount: { 
        type: Number, 
        required: true 
      } 
    }
  ],
  status: {
    type: String,
    enum: ['draft', 'paid'],
    default: 'draft'
  }
}, { 
  timestamps: true 
});

// Pre-validate hook calculates totals automatically
salarySchema.pre('validate', function(next) {
  // Calculate gross earnings = basicSalary + sum of earnings
  this.grossEarnings =this.earnings?.reduce((sum, e) => sum + e.amount, 0) || 0;

  // Calculate total deductions = sum of deductions
  this.totalDeductions = this.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0;

  // Calculate net pay = grossEarnings - totalDeductions
  this.netPay = this.grossEarnings - this.totalDeductions;

  next();
});

export default mongoose.model('Salary', salarySchema);