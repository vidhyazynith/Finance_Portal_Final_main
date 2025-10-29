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

/**
 * @typedef {Object} HikeUpdateResult
 * @property {number} activated - Number of salary records activated
 * @property {number} disabled - Number of salary records disabled
 */

/**
 * @typedef {Object} SalaryModel
 * @property {function(string, {startDate: Date, hikePercent: number}): Promise<{currentSalary: Object, newSalary: Object}>} applyHike
 * @property {function(): Promise<HikeUpdateResult>} processHikeStatusUpdates
 * @property {function(string): Promise<Object|null>} getCurrentSalary
 * @property {function(string): Promise<Object[]>} getSalaryHistory
 * @property {function(string): Promise<Object|null>} hasPendingHike
 */


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

/**
 * Apply hike to salary record and create new record with increased CTC
 * @param {string} salaryId - The ID of the current active salary record
 * @param {Object} hikeData - Hike data
 * @param {Date} hikeData.startDate - When the hike should take effect
 * @param {number} hikeData.hikePercent - Hike percentage (1-100)
 * @returns {Promise<{currentSalary: Object, newSalary: Object}>}
 */

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

    // Calculate new gross earnings
    const basicEarning = currentSalary.earnings.find(e => e.type === 'Basic Salary') || 
                        currentSalary.earnings[0];
    
    const newEarnings = currentSalary.earnings.map(earning => {
      if (earning.type === basicEarning.type) {
        return {
          ...earning.toObject(),
          amount: earning.amount + hikeAmount
        };
      }
      return earning.toObject();
    });

    const newGrossEarnings = newEarnings.reduce((sum, e) => sum + e.amount, 0);
    const newNetPay = newGrossEarnings - currentSalary.totalDeductions;

    // Set month/year based on hike start date
    const hikeStartDate = new Date(hikeData.startDate);
    const month = hikeStartDate.toLocaleDateString("en-US", { month: "long" });
    const year = hikeStartDate.getFullYear();

    // Create new salary record with hike (initially disabled)
    const newSalary = new this({
      employeeId: currentSalary.employeeId,
      name: currentSalary.name,
      email: currentSalary.email,
      designation: currentSalary.designation,
      month: month,
      year: year,
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

/**
 * Process hike status updates - activate new salaries and disable old ones
 * @returns {Promise<{activated: number, disabled: number}>}
 */

// Static method to check and update salary status based on hike dates
salarySchema.statics.processHikeStatusUpdates = async function() {
  const currentDate = new Date();
  
  // Set both dates to start of day for accurate comparison
  currentDate.setHours(0, 0, 0, 0);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('🔍 Checking for hikes to activate...');
    console.log('📅 Current date (start of day):', currentDate);

    // Find ALL disabled salaries with applied hikes
    const allDisabledHikeSalaries = await this.find({
      'hike.applied': true,
      activeStatus: 'disabled'
    }).session(session);

    console.log(`📋 Found ${allDisabledHikeSalaries.length} disabled salaries with applied hikes`);

    // Group by employee and find the most recent hike for each employee
    const employeesWithHikes = {};
    
    allDisabledHikeSalaries.forEach(salary => {
      const employeeId = salary.employeeId;
      
      if (!employeesWithHikes[employeeId]) {
        employeesWithHikes[employeeId] = [];
      }
      
      employeesWithHikes[employeeId].push(salary);
    });

    console.log(`👥 Employees with pending hikes: ${Object.keys(employeesWithHikes).length}`);

    const updatePromises = [];
    let activatedCount = 0;
    let disabledCount = 0;

    // Process each employee
    for (const employeeId in employeesWithHikes) {
      const hikeSalaries = employeesWithHikes[employeeId];
      
      // Sort by hike start date (most recent first)
      hikeSalaries.sort((a, b) => new Date(b.hike.startDate) - new Date(a.hike.startDate));
      
      console.log(`\n👤 Processing employee ${employeeId}`);
      console.log(`   Found ${hikeSalaries.length} hike records`);
      
      // Find the CURRENT active salary for this employee
      const currentActiveSalary = await this.findOne({
        employeeId: employeeId,
        activeStatus: 'enabled'
      }).session(session);

      // Find the most recent hike that should be activated
      let salaryToActivate = null;
      
      for (const hikeSalary of hikeSalaries) {
        const hikeStartDate = new Date(hikeSalary.hike.startDate);
        hikeStartDate.setHours(0, 0, 0, 0);
        
        console.log(`   🔍 Checking hike record: ${hikeSalary._id}`);
        console.log(`       Hike start: ${hikeStartDate}`);
        console.log(`       Should activate: ${hikeStartDate <= currentDate}`);
        
        if (hikeStartDate == currentDate) {
          salaryToActivate = hikeSalary;
          console.log(`   ✅ Selected this hike for activation`);
          break; // Take the most recent one that qualifies
        } else {
          console.log(`   ⏳ Skipping - future hike`);
        }
      }

      // If we found a salary to activate
      if (salaryToActivate) {
        const hikeStartDate = new Date(salaryToActivate.hike.startDate);
        hikeStartDate.setHours(0, 0, 0, 0);
        
        console.log(`🎯 Activating salary record for ${employeeId}`);
        console.log(`   Selected hike ID: ${salaryToActivate._id}`);
        console.log(`   Hike start date: ${hikeStartDate}`);

        // Disable current active salary if it exists
        if (currentActiveSalary) {
          console.log(`🔄 Disabling old salary record: ${currentActiveSalary._id}`);
          console.log(`   Old salary month: ${currentActiveSalary.month} ${currentActiveSalary.year}`);
          
          updatePromises.push(
            this.updateOne(
              { _id: currentActiveSalary._id },
              { $set: { activeStatus: 'disabled' } }
            ).session(session)
          );
          disabledCount++;
        }

        // Enable the new salary record with updated month/year
        const month = hikeStartDate.toLocaleDateString("en-US", { month: "long" });
        const year = hikeStartDate.getFullYear();

        console.log(`🔄 Enabling new salary record: ${salaryToActivate._id}`);
        console.log(`   Setting month/year to: ${month} ${year}`);

        updatePromises.push(
          this.updateOne(
            { _id: salaryToActivate._id },
            { 
              $set: { 
                activeStatus: 'enabled',
                month: month,
                year: year
              } 
            }
          ).session(session)
        );
        activatedCount++;
        
        // Disable all other hike records for this employee that are older than the one we're activating
        const otherHikesToDisable = hikeSalaries.filter(hike => 
          hike._id.toString() !== salaryToActivate._id.toString() && 
          new Date(hike.hike.startDate) <= currentDate
        );
        
        if (otherHikesToDisable.length > 0) {
          console.log(`🚫 Disabling ${otherHikesToDisable.length} outdated hike records`);
          
          otherHikesToDisable.forEach(hike => {
            updatePromises.push(
              this.updateOne(
                { _id: hike._id },
                { $set: { activeStatus: 'disabled' } }
              ).session(session)
            );
          });
        }
      } else {
        console.log(`⏳ No activatable hikes found for ${employeeId}`);
      }
    }

    if (updatePromises.length > 0) {
      console.log(`\n📤 Executing ${updatePromises.length} update operations...`);
      await Promise.all(updatePromises);
      await session.commitTransaction();
      console.log('✅ Transaction committed successfully');
    } else {
      console.log('ℹ️ No updates needed, aborting transaction');
      await session.abortTransaction();
    }
    
    session.endSession();

    console.log(`\n📊 Final result: ${activatedCount} activated, ${disabledCount} disabled`);
    return {
      activated: activatedCount,
      disabled: disabledCount
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('❌ Error in processHikeStatusUpdates:', error);
    throw error;
  }
};

/**
 * Check if hike is pending for this salary record
 * @returns {boolean}
 */

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

/**
 * Get hike status for this salary record
 * @returns {'no-hike' | 'pending' | 'active'}
 */

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

/**
 * Get current active salary for an employee
 * @param {string} employeeId - Employee ID
 * @returns {Promise<Object|null>}
 */

// Static method to get employee's current active salary
salarySchema.statics.getCurrentSalary = function(employeeId) {
  return this.findOne({
    employeeId,
    activeStatus: 'enabled'
  });
};

/**
 * Get salary history for an employee
 * @param {string} employeeId - Employee ID
 * @returns {Promise<Object[]>}
 */

// Static method to get employee's salary history
salarySchema.statics.getSalaryHistory = function(employeeId) {
  return this.find({ employeeId })
    .sort({ createdAt: -1 });
};

/**
 * Check if employee has pending hike
 * @param {string} employeeId - Employee ID
 * @returns {Promise<Object|null>}
 */

// Static method to check if employee has pending hike
salarySchema.statics.hasPendingHike = function(employeeId) {
  return this.findOne({
    employeeId,
    activeStatus: 'disabled',
    'hike.applied': true,
    'hike.startDate': { $gt: new Date() }
  });
};

// Index for efficient queries
salarySchema.index({ employeeId: 1, activeStatus: 1 });
salarySchema.index({ 'hike.startDate': 1 });
salarySchema.index({ employeeId: 1, 'hike.applied': 1 });

// Create the model with proper JSDoc typing
/** @type {mongoose.Model & SalaryModel} */
const Salary = mongoose.model('Salary', salarySchema);

export default Salary;