// import mongoose from 'mongoose';

// const salarySchema = new mongoose.Schema({
//   employeeId: { 
//     type: String, 
//     required: true,
//     ref: 'Employee' 
//   },
//   name: { 
//     type: String, 
//     required: true 
//   },
//   email: { 
//     type: String, 
//     required: true 
//   },
//   designation: { 
//     type: String, 
//     required: true 
//   },
//   month: { 
//     type: String, 
//     required: true 
//   },
//   year: {
//     type: Number,
//     required: true,
//     default: new Date()
//   },
//   payDate: { 
//     type: Date, 
//     default: Date.now 
//   },
//   basicSalary: { 
//     type: Number, 
//     required: true 
//   },
//   grossEarnings: { 
//     type: Number, 
//     required: true 
//   },
//   totalDeductions: { 
//     type: Number, 
//     required: true 
//   },
//   netPay: { 
//     type: Number, 
//     required: true 
//   },
//   paidDays: { 
//     type: Number, 
//     default: 0 
//   },
//   remainingLeaves: { 
//     type: Number, 
//     default: 0 
//   },
//   leaveTaken: { 
//     type: Number, 
//     default: 0 
//   },
//   lopDays: { 
//     type: Number, 
//     default: 0 
//   },
//   earnings: [
//     { 
//       type: { 
//         type: String, 
//         required: true 
//       }, 
//       amount: { 
//         type: Number, 
//         required: true 
//       } 
//     }
//   ],
//   deductions: [
//     { 
//       type: { 
//         type: String, 
//         required: true 
//       }, 
//       amount: { 
//         type: Number, 
//         required: true 
//       } 
//     }
//   ],
//   status: {
//     type: String,
//     enum: ['draft', 'paid'],
//     default: 'draft'
//   }
// }, { 
//   timestamps: true 
// });

// // Pre-validate hook calculates totals automatically
// salarySchema.pre('validate', function(next) {
//   // Calculate gross earnings = basicSalary + sum of earnings
//   this.grossEarnings =this.earnings?.reduce((sum, e) => sum + e.amount, 0) || 0;

//   // Calculate total deductions = sum of deductions
//   this.totalDeductions = this.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0;

//   // Calculate net pay = grossEarnings - totalDeductions
//   this.netPay = this.grossEarnings - this.totalDeductions;

//   next();
// });

// export default mongoose.model('Salary', salarySchema);

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
    default: new Date().getFullYear()
  },
  payDate: { 
    type: Date, 
    default: Date.now 
  },
  monthlyCtc: { 
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
  },
  // New fields
  activeStatus: {
    type: String,
    enum: ['enabled', 'disabled'],
    default: 'enabled'
  },
  hike: {
    startDate: {
      type: Date,
      required: false
    },
    hikePercent: {
      type: Number,
      required: false,
      min: 0,
      max: 100
    },
    previousMonthlyCtc: {
      type: Number,
      required: false
    },
    applied: {
      type: Boolean,
      default: false
    }
  }
}, { 
  timestamps: true 
});

// Pre-validate hook calculates totals automatically
salarySchema.pre('validate', function(next) {
  // Calculate gross earnings = basicSalary + sum of earnings
  this.grossEarnings = this.earnings?.reduce((sum, e) => sum + e.amount, 0) || 0;

  // Calculate total deductions = sum of deductions
  this.totalDeductions = this.deductions?.reduce((sum, d) => sum + d.amount, 0) || 0;

  // Calculate net pay = grossEarnings - totalDeductions
  this.netPay = this.grossEarnings - this.totalDeductions;

  next();
});

// Static method to apply hike and create new salary record
salarySchema.statics.applyHike = async function(salaryId, hikeData) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the current active salary record
    const currentSalary = await this.findOne({
      _id: salaryId,
      activeStatus: 'enabled'
    }).session(session);
    
    if (!currentSalary) {
      throw new Error('Active salary record not found');
    }

    // Calculate new monthly CTC with hike
    const hikeAmount = (currentSalary.monthlyCtc * hikeData.hikePercent) / 100;
    const newMonthlyCtc = currentSalary.monthlyCtc + hikeAmount;

    // Calculate new gross earnings (add hike to basic salary or distribute as needed)
    const basicEarning = currentSalary.earnings.find(e => e.type === 'Basic Salary') || 
                        currentSalary.earnings[0]; // Fallback to first earning
    
    const newEarnings = currentSalary.earnings.map(earning => {
      if (earning.type === basicEarning.type) {
        return {
          ...earning,
          amount: earning.amount + hikeAmount
        };
      }
      return earning;
    });

    const newGrossEarnings = newEarnings.reduce((sum, e) => sum + e.amount, 0);
    const newNetPay = newGrossEarnings - currentSalary.totalDeductions;

    // Create new salary record with hike (initially disabled)
    const newSalary = new this({
      employeeId: currentSalary.employeeId,
      name: currentSalary.name,
      email: currentSalary.email,
      designation: currentSalary.designation,
      month: currentSalary.month, // Will be updated when activated
      year: currentSalary.year,   // Will be updated when activated
      monthlyCtc: newMonthlyCtc,
      grossEarnings: newGrossEarnings,
      totalDeductions: currentSalary.totalDeductions,
      netPay: newNetPay,
      paidDays: currentSalary.paidDays,
      remainingLeaves: currentSalary.remainingLeaves,
      leaveTaken: currentSalary.leaveTaken,
      lopDays: currentSalary.lopDays,
      earnings: newEarnings,
      deductions: currentSalary.deductions,
      status: 'draft',
      activeStatus: 'disabled', // New record starts as disabled
      hike: {
        startDate: hikeData.startDate,
        hikePercent: hikeData.hikePercent,
        previousMonthlyCtc: currentSalary.monthlyCtc,
        applied: true
      }
    });

    await newSalary.save({ session });
    await session.commitTransaction();
    session.endSession();

    return {
      currentSalary,
      newSalary
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Static method to check and update salary status based on hike dates
salarySchema.statics.processHikeStatusUpdates = async function() {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find salary records with hike start date that has arrived
    const salariesToActivate = await this.find({
      'hike.startDate': { 
        $lte: currentDate 
      },
      'hike.applied': true,
      activeStatus: 'disabled'
    }).session(session);

    // Find old salary records that need to be disabled
    const employeeIds = salariesToActivate.map(salary => salary.employeeId);
    const salariesToDisable = await this.find({
      employeeId: { $in: employeeIds },
      activeStatus: 'enabled',
      'hike.applied': { $ne: true } // Old records without hike applied
    }).session(session);

    // Update operations
    const updatePromises = [];

    // Enable new salary records with hike
    if (salariesToActivate.length > 0) {
      updatePromises.push(
        this.updateMany(
          {
            _id: { $in: salariesToActivate.map(s => s._id) }
          },
          {
            $set: { activeStatus: 'enabled' }
          }
        ).session(session)
      );
    }

    // Disable old salary records
    if (salariesToDisable.length > 0) {
      updatePromises.push(
        this.updateMany(
          {
            _id: { $in: salariesToDisable.map(s => s._id) }
          },
          {
            $set: { activeStatus: 'disabled' }
          }
        ).session(session)
      );
    }

    await Promise.all(updatePromises);
    await session.commitTransaction();
    session.endSession();

    return {
      activated: salariesToActivate.length,
      disabled: salariesToDisable.length
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Instance method to check if hike is pending
salarySchema.methods.isHikePending = function() {
  if (!this.hike || !this.hike.startDate || !this.hike.applied) {
    return false;
  }
  
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  const hikeStartDate = new Date(this.hike.startDate);
  hikeStartDate.setHours(0, 0, 0, 0);
  
  return currentDate < hikeStartDate;
};

// Instance method to get hike status
salarySchema.methods.getHikeStatus = function() {
  if (!this.hike || !this.hike.applied) {
    return 'no-hike';
  }
  
  if (this.isHikePending()) {
    return 'pending';
  }
  
  return 'active';
};

// Index for efficient queries
salarySchema.index({ employeeId: 1, activeStatus: 1 });
salarySchema.index({ 'hike.startDate': 1 });
salarySchema.index({ employeeId: 1, 'hike.applied': 1 });

// Static method to get employee's current active salary
salarySchema.statics.getCurrentSalary = function(employeeId) {
  return this.findOne({
    employeeId,
    activeStatus: 'enabled'
  });
};

// Static method to get employee's salary history
salarySchema.statics.getSalaryHistory = function(employeeId) {
  return this.find({ employeeId })
    .sort({ createdAt: -1 });
};

// Static method to check if employee has pending hike
salarySchema.statics.hasPendingHike = function(employeeId) {
  return this.findOne({
    employeeId,
    activeStatus: 'disabled',
    'hike.applied': true,
    'hike.startDate': { $gt: new Date() }
  });
};

export default mongoose.model('Salary', salarySchema);