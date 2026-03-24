require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const developerRoutes = require('./routes/developerRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const cronRoutes = require('./routes/cronRoutes');

// Initialize express app
const app = express();

// Preload face detection models (non-blocking)
const { loadModels } = require('./utils/faceDetection');
loadModels().catch((err) => console.warn('⚠️  Face model preload failed (will retry on first request):', err.message));

// Middleware to connect to database on each request (for serverless)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
        });
    }
});

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'http://localhost:5173',
            'http://localhost:3000',
            'https://attendiify.netlify.app',

        ].filter(Boolean);

        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all origins for now during deployment
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));

// Increase payload limit for base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cron', cronRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'IDentix API is running',
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// Start server only in non-Vercel environments
const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`
  🚀 IDentix Server Started
  ===========================
  📡 Port: ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  📅 Started: ${new Date().toLocaleString()}
  `);
    });
}

// Export app for Vercel serverless functions
module.exports = app;
