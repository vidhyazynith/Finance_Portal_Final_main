// import express from 'express';
// import Salary from '../models/Salary.js';
// import Payslip from '../models/Payslip.js';
// import Employee from '../models/Employee.js';
// import { authenticateToken, requireRole } from '../middleware/auth.js';
// import { sendPayslipEmail } from '../services/emailService.js';
// import PDFDocument from 'pdfkit';
// import numberToWords from 'number-to-words';
// import fs from 'fs';
// import path from 'path';

// const router = express.Router();

// // Get all employees for dropdown
// router.get('/employees', authenticateToken, requireRole('admin'), async (req, res) => {
//   try {
//     const employees = await Employee.find().select('employeeId name email designation department');
//     res.json({ employees });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error while fetching employees' });
//   }
// });

// // Get employee details by ID
// router.get('/employee/:employeeId', authenticateToken, requireRole('admin'), async (req, res) => {
//   try {
//     const employee = await Employee.findOne({ employeeId: req.params.employeeId });
//     if (!employee) {
//       return res.status(404).json({ message: 'Employee not found' });
//     }
//     res.json({ employee });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error while fetching employee' });
//   }
// });

// // Create salary record
// router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
//   try {
//     const { employeeId, month, year, monthlyCtc, paidDays, lopDays, remainingLeaves, leaveTaken, earnings, deductions } = req.body;

//     // Check if salary already exists for this employee
//     const existingSalary = await Salary.findOne({ employeeId });
//     if (existingSalary) {
//       return res.status(400).json({ message: 'Salary record already exists for this employee' });
//     }

//     // Get employee details
//     const employee = await Employee.findOne({ employeeId });
//     if (!employee) {
//       return res.status(404).json({ message: 'Employee not found' });
//     }

//     const salaryData = {
//       employeeId,
//       name: employee.name,
//       email: employee.email,
//       designation: employee.designation,
//       month : new Date().toLocaleDateString("en-US", { month: "long"}),
//       year: year || new Date().getFullYear(),
//       monthlyCtc,
//       paidDays,
//       lopDays,
//       remainingLeaves,
//       leaveTaken,
//       earnings,
//       deductions
//     };

//     const salary = new Salary(salaryData);
//     await salary.save();

//     res.status(201).json({
//       message: 'Salary record created successfully',
//       salary
//     });
//   } catch (error) {
//     console.error('Error creating salary:', error);
//     res.status(500).json({ message: 'Server error while creating salary record' });
//   }
// });

// // Get all salary records
// router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
//   try {
//     const salaries = await Salary.find().sort({ createdAt: -1 });
    
//     // Get payslip counts for each employee
//     const salaryData = await Promise.all(
//       salaries.map(async (salary) => {
//         const payslipCount = await Payslip.countDocuments({ employeeId: salary.employeeId });
//         return {
//           ...salary.toObject(),
//           payslipCount
//         };
//       })
//     );

//     res.json({ salaries: salaryData });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error while fetching salaries' });
//   }
// });

// // Get salary by ID
// router.get('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
//   try {
//     const salary = await Salary.findById(req.params.id);
//     if (!salary) {
//       return res.status(404).json({ message: 'Salary record not found' });
//     }
//     res.json({ salary });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error while fetching salary' });
//   }
// });

// // Update salary record
// router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
//   try {
//     const salary = await Salary.findByIdAndUpdate(
//       req.params.id,
//       { $set: req.body },
//       { new: true, runValidators: true }
//     );
//     if (!salary) {
//       return res.status(404).json({ message: 'Salary record not found' });
//     }
//     res.json({ message: 'Salary record updated successfully', salary });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error while updating salary' });
//   }
// });

// // Delete salary record
// router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
//   try {
//     const salary = await Salary.findByIdAndDelete(req.params.id);
//     if (!salary) {
//       return res.status(404).json({ message: 'Salary record not found' });
//     }
    
//     // Also delete associated payslips
//     await Payslip.deleteMany({ salaryId: req.params.id });
    
//     res.json({ message: 'Salary record deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error while deleting salary' });
//   }
// });
// // Delete payslip by ID
// router.delete('/payslip/:id', authenticateToken, requireRole('admin'), async (req, res) => {
//   try {
//     const payslip = await Payslip.findByIdAndDelete(req.params.id);
//     if (!payslip) {
//       return res.status(404).json({ message: 'Payslip not found' });
//     }
//     res.json({ message: 'Payslip deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error while deleting payslip' });
//   }
// });

// // Generate payslip and send email
// router.post('/:id/generate-payslip', authenticateToken, requireRole('admin'), async (req, res) => {
//   try {
//     const salary = await Salary.findById(req.params.id);
//     if (!salary) {
//       return res.status(404).json({ message: 'Salary record not found' });
//     }

//     // Check if payslip already exists
//       const existingPayslip = await Payslip.findOne({ 
//       employeeId: salary.employeeId, 
//       month: salary.month,
//       year: salary.year
//     });

//        if (existingPayslip) {
//       return res.status(400).json({ 
//         message: `Payslip already generated for ${salary.month} ${salary.year}` 
//       });
//     }

//     // Create payslip record
//     const payslipData = {
//       salaryId: salary._id,
//       employeeId: salary.employeeId,
//       name: salary.name,
//       email: salary.email,
//       designation: salary.designation,
//       month: salary.month,
//       year: salary.year,
//       payDate: salary.payDate,
//       monthlyCtc: salary.monthlyCtc,
//       grossEarnings: salary.grossEarnings,
//       totalDeductions: salary.totalDeductions,
//       netPay: salary.netPay,
//       paidDays: salary.paidDays,
//       lopDays: salary.lopDays,
//       remainingLeaves: salary.remainingLeaves,
//       leaveTaken: salary.leaveTaken,
//       earnings: salary.earnings,
//       deductions: salary.deductions
//     };

//     const payslip = new Payslip(payslipData);
//     await payslip.save();

//     // Update salary status to paid
//     salary.status = 'paid';
//     await salary.save();

//     // Send email with payslip
//     const emailResult = await sendPayslipEmail(payslip);

//     res.json({
//       message: 'Payslip generated and sent successfully',
//       payslip,
//       emailSent: emailResult.success
//     });
//   } catch (error) {
//     console.error('Error generating payslip:', error);
//     res.status(500).json({ message: 'Server error while generating payslip' });
//   }
// });

// // Get payslips for an employee
// router.get('/payslips/:employeeId', authenticateToken, async (req, res) => {
//   try {
//     const payslips = await Payslip.find({ employeeId: req.params.employeeId })
//       .sort({ createdAt: -1 });
//     res.json({ payslips });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error while fetching payslips' });
//   }
// });

// // Download payslip PDF
// router.get('/payslip/:id/download', authenticateToken, async (req, res) => {
//   try {
//     const payslip = await Payslip.findById(req.params.id);
//     if (!payslip) {
//       return res.status(404).json({ message: 'Payslip not found' });
//     }

//     // Create PDF
//     const doc = new PDFDocument();
//     const filename = `payslip-${payslip.employeeId}-${payslip.month}-${payslip.year}.pdf`;
    
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
//     doc.pipe(res);
    
//     // PDF content
//     //doc.image(path.join(__dirname, "logo.png"), 50, 40, { width:40 }); // company logo
//         doc.fontSize(18).fillColor("#000").text("Zynith IT Solutions", 100, 45);
//         doc.fontSize(10).fillColor("gray").text("Chennai, India", 100, 65);
//         doc.fontSize(15).fillColor("gray").text("Payslip For the Month", 380, 47);
//         doc.fontSize(12).text(`${payslip.month}`, 475, 75);

//         doc.moveTo(50, 100).lineTo(550, 100).strokeColor("#ccc").stroke();

//         doc.fontSize(12).fillColor("black").text("EMPLOYEE SUMMARY", 50, 120);
//         doc.fontSize(11).fillColor("gray").text("Employee Name", 50, 140);
//         doc.text(":", 138, 140);
//         doc.fontSize(11).fillColor("black").text(payslip.name, 150, 140);

//         doc.fontSize(11).fillColor("gray").text("Employee ID", 50, 160);
//         doc.text(":", 138, 160);
//         doc.fontSize(11).fillColor("black").text(payslip.employeeId, 150, 160);

//         doc.fontSize(11).fillColor("gray").text("Designation", 50, 180);
//         doc.text(":", 138, 180);
//         doc.fontSize(11).fillColor("black").text(payslip.designation, 150, 180);

//         doc.fontSize(11).fillColor("gray").text("Pay Period", 50, 200);
//         doc.text(":", 138, 200);
//         doc.fontSize(11).fillColor("black").text(payslip.month, 150, 200);

//         doc.fontSize(11).fillColor("gray").text("Pay Date", 50, 220);
//         doc.text(":", 138, 220);
//         doc.fontSize(11).fillColor("black").text(`${(payslip.payDate).toLocaleDateString("en-GB")}`,150, 220);


//         const boxX = 350;
//         const boxY = 120;
//         const boxWidth = 200;
//         const boxHeight = 120;
//         const radius = 10;

//         doc.save();
//         doc.roundedRect(boxX, boxY, boxWidth, boxHeight-65, radius)
//         .fillOpacity(1)   // solid
//         .fillAndStroke("#f2fef6", "#cccccc"); // very light green + grey border
//         doc.restore();

//          doc.save();
//         doc.roundedRect(boxX, boxY+68, boxWidth, boxHeight-65, radius)
//         .fillOpacity(1)   // solid
//         .fillAndStroke("#e6f3ff", "#cccccc"); // very light green + grey border
//         doc.restore();
        
//          // ✅ Bold Green Net Pay
//         doc.fontSize(18).fillColor("#0a9f49").font("Helvetica-Bold")
//         .text("Rs.", boxX+15, boxY+15);
//         doc.text(payslip.monthlyCtc.toFixed(2), boxX + 46, boxY + 15);

//         doc.fontSize(11).fillColor("gray").font("Helvetica")
//         .text("Total Gross pay", boxX+15, boxY + 32);

//          // Paid Days / LOP Days
//         doc.fontSize(11).fillColor("black").text("Paid Days :", boxX +20, boxY + 80);
//         doc.text(payslip.paidDays, boxX + 120, boxY + 80);

//         doc.text("LOP Days :", boxX + 20, boxY + 100);
//         doc.text(payslip.lopDays, boxX + 120, boxY + 100);

//         doc.moveTo(50, 263).lineTo(550, 263).strokeColor("#ccc").stroke();

//         doc.moveDown(2);

//         doc.fontSize(11).fillColor("gray").text("Remaining Leave", 50, 273);
//         doc.text(":", 138, 273);
//         //doc.fontSize(11).fillColor("black").text(payslip.remainingLeave, 150, 273);

//         doc.fontSize(11).fillColor("gray").text("Leaves Taken", 290, 273);
//         doc.text(":", 378, 273);
//         //doc.fontSize(11).fillColor("black").text(emp.leavesTaken, 390, 273);

//         const tableX = 50;
//         const tableY = 300;
//         const tableWidth = 500;
//         const tableHeight = 120;



//         doc.save();
//         doc.roundedRect(tableX, tableY, tableWidth, tableHeight+20, radius)
//         .fillAndStroke("#ffffff","#cccccc"); // very light green + grey border
//         doc.restore();

//         // Table Headers
//         doc.fontSize(11).font("Helvetica-Bold").fillColor("black");

//         doc.text("EARNINGS", tableX + 20, tableY + 10);
//         doc.text("AMOUNT", tableX + 170, tableY + 10);

//         doc.text("DEDUCTIONS", tableX + 270, tableY + 10);
//         doc.text("AMOUNT", tableX + 430, tableY + 10);

//         doc.moveTo(tableX + 20, tableY + 28)
//         .lineTo(270, tableY + 28)
//         .dash(2, { space: 2 })
//         .strokeColor("#999999")
//         .stroke()
//         .undash();

//          doc.moveTo(320, tableY + 28)
//         .lineTo(530, tableY + 28)
//         .dash(2, { space: 2 })
//         .strokeColor("#999999")
//         .stroke()
//         .undash();

//     // Reset font
//         doc.fontSize(11).font("Helvetica").fillColor("black");

//         let y = tableY + 50;
//         payslip.earnings.forEach(e => {
//             doc.text(`${e.type}`, tableX + 20, y);
//             doc.text(`Rs . ${e.amount.toFixed(2)}`, tableX + 140, y, { align:"right", width: 80 });
//             doc.font("Helvetica");
//             y += 20;
//         });

//         doc.font("Helvetica");

// // Deductions Loop (separate y2, same alignment as before)
//         let y2 = tableY + 50;
//         payslip.deductions.forEach(d => {
//             doc.text(`${d.type}`, tableX + 270, y2);
//             doc.text(`Rs . ${d.amount.toFixed(2)}`, tableX + 400, y2, { align:"right", width: 80 });
//             doc.font("Helvetica");
//             y2 += 20;
//         });

//         doc.moveTo(tableX + 20, 415)
//         .lineTo(270, 415)
//         .dash(2, { space: 2 })
//         .strokeColor("#999999")
//         .stroke()
//         .undash();

//         doc.moveTo(320, 415)
//         .lineTo(530, 415)
//         .dash(2, { space: 2 })
//         .strokeColor("#999999")
//         .stroke()
//         .undash();

//         //let bottomY = tableY + tableHeight - 30;
//         doc.font("Helvetica-Bold").text("Gross Earnings", tableX + 20, 423);
//         doc.text(`Rs . ${payslip.grossEarnings.toFixed(2)}`, tableX + 140, 423, {align: "right", width: 80 });

//         doc.font("Helvetica-Bold").text("Total Deductions", tableX + 270, 423);
//         doc.text(`Rs . ${payslip.totalDeductions.toFixed(2)}`, tableX + 400, 423, {align: "right", width: 80 });

//         doc.save();
//         doc.roundedRect(50, 470, 500, 45, radius)
//         .strokeColor("#cccccc")
//         .lineWidth(1)
//         .stroke();

//         const greenWidth = 150; // adjust width of green area
//         doc.save();
//         doc.roundedRect(50 + (500 - greenWidth), 470, greenWidth, 45, radius)
//             .clip(); // clip only right section
//         doc.rect(50 + (500 - greenWidth), 470, greenWidth, 45)
//             .fill("#e6f9ef"); // light green fill
//         doc.restore();

//   // Left text
//   doc.font("Helvetica-Bold").fontSize(10).fillColor("black")
//     .text("TOTAL NET PAYABLE", 50 + 10, 470 + 13);

//   doc.font("Helvetica").fontSize(10).fillColor("gray")
//     .text("Gross Earnings - Total Deductions", 50 + 10, 470 + 27);

//   // Right text (Net Pay in bold)
//   doc.font("Helvetica-Bold").fontSize(14).fillColor("black")
//     .text(`Rs. ${payslip.netPay.toFixed(2)}`, 310, 470 + 18, {
//       align: "right",
//       width: boxWidth - 10
//     });

//     const amountWords =numberToWords.toWords(payslip.netPay).replace(/\b\w/g, c =>c.toUpperCase());
//     doc.font("Helvetica-Bold").fontSize(10).fillColor("black").text(`${amountWords}Rupees Only`, 50, 530, { width: 380, align: "center" });
//     doc.moveTo(50, 550).lineTo(550, 550).strokeColor("#ccc").stroke();
    
//     doc.end();
//   } catch (error) {
//     console.error('Error generating PDF:', error);
//     res.status(500).json({ message: 'Server error while generating PDF' });
//   }
// });

// export default router;

import express from 'express';
import Salary from '../models/Salary.js';
import Payslip from '../models/Payslip.js';
import Employee from '../models/Employee.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendPayslipEmail } from '../services/emailService.js';
import PDFDocument from 'pdfkit';
import numberToWords from 'number-to-words';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Get all employees for dropdown
router.get('/employees', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const employees = await Employee.find().select('employeeId name email designation department');
    res.json({ employees });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching employees' });
  }
});

// Get employee details by ID
router.get('/employee/:employeeId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching employee' });
  }
});

// Create salary record
router.post('/', async (req, res) => {
  try {
    const { employeeId, month, year, monthlyCtc, paidDays, lopDays, remainingLeaves, leaveTaken, earnings, deductions } = req.body;

    // Check if salary already exists for this employee for the same month and year
    const existingSalary = await Salary.findOne({ 
      employeeId, 
      month, 
      year,
      activeStatus: 'enabled' // Only check enabled records
    });
    if (existingSalary) {
      return res.status(400).json({ message: 'Salary record already exists for this employee for the selected period' });
    }

    // Get employee details
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const salaryData = {
      employeeId,
      name: employee.name,
      email: employee.email,
      designation: employee.designation,
      month: month || new Date().toLocaleDateString("en-US", { month: "long"}),
      year: year || new Date().getFullYear(),
      monthlyCtc,
      paidDays: paidDays || 0,
      lopDays: lopDays || 0,
      remainingLeaves: remainingLeaves || 0,
      leaveTaken: leaveTaken || 0,
      earnings: earnings || [],
      deductions: deductions || [],
      activeStatus: 'enabled', // New record starts as enabled
      status: 'draft'
    };

    const salary = new Salary(salaryData);
    await salary.save();

    res.status(201).json({
      message: 'Salary record created successfully',
      salary
    });
  } catch (error) {
    console.error('Error creating salary:', error);
    res.status(500).json({ message: 'Server error while creating salary record' });
  }
});

// Get all salary records
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const salaries = await Salary.find().sort({ createdAt: -1 });
    
    // Get payslip counts for each employee
    const salaryData = await Promise.all(
      salaries.map(async (salary) => {
        const payslipCount = await Payslip.countDocuments({ employeeId: salary.employeeId });
        return {
          ...salary.toObject(),
          payslipCount
        };
      })
    );

    res.json({ salaries: salaryData });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching salaries' });
  }
});

// Get active salary records for an employee
router.get('/employee/:employeeId/active', authenticateToken, async (req, res) => {
  try {
    const salary = await Salary.findOne({ 
      employeeId: req.params.employeeId,
      activeStatus: 'enabled'
    });
    
    if (!salary) {
      return res.status(404).json({ message: 'No active salary record found for this employee' });
    }
    
    res.json({ salary });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching active salary' });
  }
});

router.get('/disabled', authenticateToken, async (req, res) => {
  try {
    
    const disabledSalaries = await Salary.find({activeStatus : 'disabled'});

    res.json({ salaries: disabledSalaries });
  } catch (error) {
    console.error('Error fetching all disabled salaries:', error);
    res.status(500).json({ message: 'Server error while fetching disabled salaries' });
  }
});

// Get salary by ID
router.get('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    res.json({ salary });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching salary' });
  }
});

// Update salary record
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    res.json({ message: 'Salary record updated successfully', salary });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating salary' });
  }
});

// Delete salary record
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    // Also delete associated payslips
    await Payslip.deleteMany({ salaryId: req.params.id });
    
    res.json({ message: 'Salary record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting salary' });
  }
});

// Apply hike to salary record
router.post('/:id/apply-hike', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { startDate, hikePercent } = req.body;

    if (!startDate || !hikePercent) {
      return res.status(400).json({ message: 'Start date and hike percentage are required' });
    }

    if (hikePercent <= 0 || hikePercent > 100) {
      return res.status(400).json({ message: 'Hike percentage must be between 1 and 100' });
    }

    const result = await Salary.applyHike(req.params.id, {
      startDate: new Date(startDate),
      hikePercent: parseFloat(hikePercent)
    });

    res.json({
      message: `Hike of ${hikePercent}% applied successfully. New salary record will be activated on ${startDate}`,
      currentSalary: result.currentSalary,
      newSalary: result.newSalary
    });
  } catch (error) {
    console.error('Error applying hike:', error);
    res.status(500).json({ message: error.message || 'Server error while applying hike' });
  }
});

// Process hike status updates (for cron job or manual trigger)
router.post('/process-hike-updates', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await Salary.processHikeStatusUpdates();
    
    res.json({
      message: 'Hike status updates processed successfully',
      activated: result.activated,
      disabled: result.disabled
    });
  } catch (error) {
    console.error('Error processing hike updates:', error);
    res.status(500).json({ message: 'Server error while processing hike updates' });
  }
});

// Get salary history for an employee
router.get('/employee/:employeeId/history', authenticateToken, async (req, res) => {
  try {
    const salaries = await Salary.find({ employeeId: req.params.employeeId })
      .sort({ createdAt: -1 });
    
    res.json({ salaries });
  } catch (error) {
    console.log("vanthurur");
    res.status(500).json({ message: 'Server error while fetching salary history' });
  }
});

// Delete payslip by ID
router.delete('/payslip/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const payslip = await Payslip.findByIdAndDelete(req.params.id);
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }
    res.json({ message: 'Payslip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting payslip' });
  }
});

// Generate payslip and send email
router.post('/:id/generate-payslip', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    // 🔒 Check if salary is active
    if (salary.activeStatus !== 'enabled') {
      return res.status(400).json({
        message: 'Payslip cannot be generated for disabled salary records.'
      });
    }

    // Check if payslip already exists
      const existingPayslip = await Payslip.findOne({ 
      employeeId: salary.employeeId, 
      month: salary.month,
      year: salary.year
    });

       if (existingPayslip) {
      return res.status(400).json({ 
        message: `Payslip already generated for ${salary.month} ${salary.year}` 
      });
    }

    // Create payslip record
    const payslipData = {
      salaryId: salary._id,
      employeeId: salary.employeeId,
      name: salary.name,
      email: salary.email,
      designation: salary.designation,
      month: salary.month,
      year: salary.year,
      payDate: salary.payDate,
      monthlyCtc: salary.monthlyCtc,
      grossEarnings: salary.grossEarnings,
      totalDeductions: salary.totalDeductions,
      netPay: salary.netPay,
      paidDays: salary.paidDays,
      lopDays: salary.lopDays,
      remainingLeaves: salary.remainingLeaves,
      leaveTaken: salary.leaveTaken,
      earnings: salary.earnings,
      deductions: salary.deductions
    };

    const payslip = new Payslip(payslipData);
    await payslip.save();

    // Update salary status to paid
    salary.status = 'paid';
    await salary.save();

    // Send email with payslip
    const emailResult = await sendPayslipEmail(payslip);

    res.json({
      message: 'Payslip generated and sent successfully',
      payslip,
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Error generating payslip:', error);
    res.status(500).json({ message: 'Server error while generating payslip' });
  }
});


// Get payslips for an employee (only for active salary records)
router.get('/payslips/:employeeId', authenticateToken, async (req, res) => {
  try {
    // Step 1: Find all enabled salary records for this employee
    const activeSalaries = await Salary.find({
      employeeId: req.params.employeeId,
      activeStatus: 'enabled'
    }).select('_id');

    if (activeSalaries.length === 0) {
      return res.json({ payslips: [] });
    }

    // Step 2: Extract all active salary IDs
    const activeSalaryIds = activeSalaries.map(s => s._id);

    // Step 3: Find payslips linked to those salary IDs
    const payslips = await Payslip.find({
      employeeId: req.params.employeeId,
      salaryId: { $in: activeSalaryIds }
    }).sort({ createdAt: -1 });

    res.json({ payslips });
  } catch (error) {
    console.error('Error fetching payslips:', error);
    res.status(500).json({ message: 'Server error while fetching payslips' });
  }
});

// Download payslip PDF
router.get('/payslip/:id/download', authenticateToken, async (req, res) => {
    try {
    const payslip = await Payslip.findById(req.params.id).lean();
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }

    // Check if the related salary record is active (enabled)
    const salary = await Salary.findById(payslip.salaryId).lean();
    if (!salary || salary.activeStatus !== 'enabled') {
      return res.status(403).json({
        message: 'Payslip cannot be downloaded because the salary record is not active',
      });
    }


    // Create PDF
    const doc = new PDFDocument();
    const filename = `payslip-${payslip.employeeId}-${payslip.month}-${payslip.year}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    doc.pipe(res);
    
    // PDF content
    //doc.image(path.join(__dirname, "logo.png"), 50, 40, { width:40 }); // company logo
    doc.fontSize(18).fillColor("#000").text("Zynith IT Solutions", 100, 45);
    doc.fontSize(10).fillColor("gray").text("Chennai, India", 100, 65);
    doc.fontSize(15).fillColor("gray").text("Payslip For the Month", 380, 47);
    doc.fontSize(12).text(`${payslip.month}`, 475, 75);

    doc.moveTo(50, 100).lineTo(550, 100).strokeColor("#ccc").stroke();

    doc.fontSize(12).fillColor("black").text("EMPLOYEE SUMMARY", 50, 120);
    doc.fontSize(11).fillColor("gray").text("Employee Name", 50, 140);
    doc.text(":", 138, 140);
    doc.fontSize(11).fillColor("black").text(payslip.name, 150, 140);

    doc.fontSize(11).fillColor("gray").text("Employee ID", 50, 160);
    doc.text(":", 138, 160);
    doc.fontSize(11).fillColor("black").text(payslip.employeeId, 150, 160);

    doc.fontSize(11).fillColor("gray").text("Designation", 50, 180);
    doc.text(":", 138, 180);
    doc.fontSize(11).fillColor("black").text(payslip.designation, 150, 180);

    doc.fontSize(11).fillColor("gray").text("Pay Period", 50, 200);
    doc.text(":", 138, 200);
    doc.fontSize(11).fillColor("black").text(payslip.month, 150, 200);

    doc.fontSize(11).fillColor("gray").text("Pay Date", 50, 220);
    doc.text(":", 138, 220);
    doc.fontSize(11).fillColor("black").text(`${(payslip.payDate).toLocaleDateString("en-GB")}`,150, 220);

    const boxX = 350;
    const boxY = 120;
    const boxWidth = 200;
    const boxHeight = 120;
    const radius = 10;

    doc.save();
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight-65, radius)
    .fillOpacity(1)   // solid
    .fillAndStroke("#f2fef6", "#cccccc"); // very light green + grey border
    doc.restore();

    doc.save();
    doc.roundedRect(boxX, boxY+68, boxWidth, boxHeight-65, radius)
    .fillOpacity(1)   // solid
    .fillAndStroke("#e6f3ff", "#cccccc"); // very light green + grey border
    doc.restore();
    
    // ✅ Bold Green Monthly CTC
    doc.fontSize(18).fillColor("#0a9f49").font("Helvetica-Bold")
    .text("Rs.", boxX+15, boxY+15);
    doc.text(payslip.monthlyCtc.toFixed(2), boxX + 46, boxY + 15); // Changed from monthlyCtc to monthlyCtc

    doc.fontSize(11).fillColor("gray").font("Helvetica")
    .text("Monthly CTC", boxX+15, boxY + 32);

    // Paid Days / LOP Days
    doc.fontSize(11).fillColor("black").text("Paid Days :", boxX +20, boxY + 80);
    doc.text(payslip.paidDays, boxX + 120, boxY + 80);

    doc.text("LOP Days :", boxX + 20, boxY + 100);
    doc.text(payslip.lopDays, boxX + 120, boxY + 100);

    doc.moveTo(50, 263).lineTo(550, 263).strokeColor("#ccc").stroke();

    doc.moveDown(2);

    doc.fontSize(11).fillColor("gray").text("Remaining Leave", 50, 273);
    doc.text(":", 138, 273);
    doc.fontSize(11).fillColor("black").text(payslip.remainingLeaves, 150, 273);

    doc.fontSize(11).fillColor("gray").text("Leaves Taken", 290, 273);
    doc.text(":", 378, 273);
    doc.fontSize(11).fillColor("black").text(payslip.leaveTaken, 390, 273);

    const tableX = 50;
    const tableY = 300;
    const tableWidth = 500;
    const tableHeight = 120;

    doc.save();
    doc.roundedRect(tableX, tableY, tableWidth, tableHeight+20, radius)
    .fillAndStroke("#ffffff","#cccccc"); // very light green + grey border
    doc.restore();

    // Table Headers
    doc.fontSize(11).font("Helvetica-Bold").fillColor("black");

    doc.text("EARNINGS", tableX + 20, tableY + 10);
    doc.text("AMOUNT", tableX + 170, tableY + 10);

    doc.text("DEDUCTIONS", tableX + 270, tableY + 10);
    doc.text("AMOUNT", tableX + 430, tableY + 10);

    doc.moveTo(tableX + 20, tableY + 28)
    .lineTo(270, tableY + 28)
    .dash(2, { space: 2 })
    .strokeColor("#999999")
    .stroke()
    .undash();

    doc.moveTo(320, tableY + 28)
    .lineTo(530, tableY + 28)
    .dash(2, { space: 2 })
    .strokeColor("#999999")
    .stroke()
    .undash();

    // Reset font
    doc.fontSize(11).font("Helvetica").fillColor("black");

    let y = tableY + 50;
    payslip.earnings.forEach(e => {
        doc.text(`${e.type}`, tableX + 20, y);
        doc.text(`Rs . ${e.amount.toFixed(2)}`, tableX + 140, y, { align:"right", width: 80 });
        doc.font("Helvetica");
        y += 20;
    });

    doc.font("Helvetica");

    // Deductions Loop (separate y2, same alignment as before)
    let y2 = tableY + 50;
    payslip.deductions.forEach(d => {
        doc.text(`${d.type}`, tableX + 270, y2);
        doc.text(`Rs . ${d.amount.toFixed(2)}`, tableX + 400, y2, { align:"right", width: 80 });
        doc.font("Helvetica");
        y2 += 20;
    });

    doc.moveTo(tableX + 20, 415)
    .lineTo(270, 415)
    .dash(2, { space: 2 })
    .strokeColor("#999999")
    .stroke()
    .undash();

    doc.moveTo(320, 415)
    .lineTo(530, 415)
    .dash(2, { space: 2 })
    .strokeColor("#999999")
    .stroke()
    .undash();

    //let bottomY = tableY + tableHeight - 30;
    doc.font("Helvetica-Bold").text("Gross Earnings", tableX + 20, 423);
    doc.text(`Rs . ${payslip.grossEarnings.toFixed(2)}`, tableX + 140, 423, {align: "right", width: 80 });

    doc.font("Helvetica-Bold").text("Total Deductions", tableX + 270, 423);
    doc.text(`Rs . ${payslip.totalDeductions.toFixed(2)}`, tableX + 400, 423, {align: "right", width: 80 });

    doc.save();
    doc.roundedRect(50, 470, 500, 45, radius)
    .strokeColor("#cccccc")
    .lineWidth(1)
    .stroke();

    const greenWidth = 150; // adjust width of green area
    doc.save();
    doc.roundedRect(50 + (500 - greenWidth), 470, greenWidth, 45, radius)
        .clip(); // clip only right section
    doc.rect(50 + (500 - greenWidth), 470, greenWidth, 45)
        .fill("#e6f9ef"); // light green fill
    doc.restore();

    // Left text
    doc.font("Helvetica-Bold").fontSize(10).fillColor("black")
    .text("TOTAL NET PAYABLE", 50 + 10, 470 + 13);

    doc.font("Helvetica").fontSize(10).fillColor("gray")
    .text("Gross Earnings - Total Deductions", 50 + 10, 470 + 27);

    // Right text (Net Pay in bold)
    doc.font("Helvetica-Bold").fontSize(14).fillColor("black")
    .text(`Rs. ${payslip.netPay.toFixed(2)}`, 310, 470 + 18, {
        align: "right",
        width: boxWidth - 10
    });

    const amountWords = numberToWords.toWords(payslip.netPay).replace(/\b\w/g, c => c.toUpperCase());
    doc.font("Helvetica-Bold").fontSize(10).fillColor("black").text(`${amountWords} Rupees Only`, 50, 530, { width: 380, align: "center" });
    doc.moveTo(50, 550).lineTo(550, 550).strokeColor("#ccc").stroke();
    
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Server error while generating PDF' });
  }
});


// Get employee salary details with hike information
router.get('/employee/:employeeId/details', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get current active salary
    const activeSalary = await Salary.findOne({
      employeeId: req.params.employeeId,
      activeStatus: 'enabled'
    });

    // Get all salaries for history
    const salaryHistory = await Salary.find({
      employeeId: req.params.employeeId
    }).sort({ createdAt: -1 });

    // Get pending hikes (disabled salaries with future hike dates)
    const pendingHikes = await Salary.find({
      employeeId: req.params.employeeId,
      activeStatus: 'disabled',
      'hike.applied': true,
      'hike.startDate': { $gt: new Date() }
    }).sort({ 'hike.startDate': 1 });

    res.json({
      employee,
      activeSalary,
      salaryHistory,
      pendingHikes
    });
  } catch (error) {
    console.error('Error fetching employee salary details:', error);
    res.status(500).json({ message: 'Server error while fetching employee details' });
  }
});

// Get all disabled salary records (for the "Disabled Records" list)
router.get('/disabled', authenticateToken, async (req, res) => {
  try {
    
    const disabledSalaries = await Salary.find({activeStatus : 'disabled'});

    res.json({ salaries: disabledSalaries });
  } catch (error) {
    console.error('Error fetching all disabled salaries:', error);
    res.status(500).json({ message: 'Server error while fetching disabled salaries' });
  }
});

// Get disabled salary records for a specific employee
router.get('/employee/:employeeId/disabled', authenticateToken, async (req, res) => {
  try {
    const disabledSalaries = await Salary.find({
      employeeId: req.params.employeeId,
      activeStatus: 'disabled'
    }).sort({ createdAt: -1 });

    res.json({ salaries: disabledSalaries });
  } catch (error) {
    console.error('Error fetching disabled salaries for employee:', error);
    res.status(500).json({ message: 'Server error while fetching disabled salaries' });
  }
});

// Get all pending hikes across all employees (admin view)
router.get('/hikes/pending', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const pendingHikes = await Salary.find({
      activeStatus: 'disabled',
      'hike.applied': true,
      'hike.startDate': { $gt: new Date() }
    })
      .populate('employeeId', 'name email designation department')
      .sort({ 'hike.startDate': 1 });

    res.json({ pendingHikes });
  } catch (error) {
    console.error('Error fetching pending hikes:', error);
    res.status(500).json({ message: 'Server error while fetching pending hikes' });
  }
});

export default router;