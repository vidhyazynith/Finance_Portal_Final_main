import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import employeeRoutes from './routes/employees.js'; // Add this line
import salaryRoutes from './routes/salaryRoutes.js';
import CustomerRoutes from './routes/CustomerRoutes.js';
import employeeDashboardRoutes from './routes/EmployeeDashboard.js';
import transactionRoutes from './routes/transaction.js'; 
import Invoice from './routes/invoice.js';
import companyRoutes from './routes/companyRoutes.js';
//import Phot from "./routes/upload.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { startHikeCronJob } from './services/cronService.js';


dotenv.config();

const app = express();


// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Serve static files from uploads directory
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes); 
app.use('/api/salaries', salaryRoutes);
app.use('/api/customer',CustomerRoutes);
app.use('/api/employee', employeeDashboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/billing', Invoice);
app.use('/api/company', companyRoutes);



// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((error) => console.error('❌ MongoDB connection error:', error));

const PORT = process.env.PORT || 5000;
const MongoDB = process.env.MONGODB_URI ; 
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`${MongoDB}`);
});

// After database connection
startHikeCronJob();

export default app;