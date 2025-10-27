import express from "express";
import multer from "multer";
import { 
  generateInvoice, 
  getInvoices,
  getInvoiceById,
  verifyPayment, 
  deleteInvoice ,
  downloadInvoice,
  getPaymentProof,
  getInvoicePaymentProof
} from "../Controllers/invoiceController.js";
import { authenticateToken, requireRole } from '../middleware/auth.js';


const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Invoice routes
router.post("/generate-invoice", authenticateToken, requireRole('admin'), generateInvoice);
router.get("/invoices", authenticateToken, requireRole('admin'),getInvoices);
router.get("/invoices/:id",authenticateToken, requireRole('admin'), getInvoiceById);
router.get("/invoices/:id/download",authenticateToken, requireRole('admin'), downloadInvoice); // Add this route
router.delete("/invoices/:id",authenticateToken, requireRole('admin'), deleteInvoice); // ADD DELETE INVOICE ROUTE
router.post("/verify-payment", upload.single('transactionProof'), verifyPayment); // ADD VERIFY PAYMENT ROUTE
router.get('/payment-proofs/:filename', getPaymentProof);
router.get('/invoices/:id/payment-proof', getInvoicePaymentProof);

export default router;
