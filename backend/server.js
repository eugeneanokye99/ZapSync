const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const fileRoutes = require('./routes/fileRoutes'); 
const folderRoutes = require('./routes/folderRoutes');
const trashRoutes = require('./routes/trashRoutes');
const searchRoutes = require('./routes/searchRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const starredRoutes = require('./routes/starredRoutes');
const path = require('path');
const { setupAutoExport } = require('./controllers/searchController');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Enable CORS - Place this before other middleware
app.use(cors()); // Basic CORS configuration

// For more advanced CORS configuration:
/*
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
*/

// Middleware
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/search', searchRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/analytics', analyticsRoutes);
app.use('/api/starred', starredRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// After database connection is established
mongoose.connection.once('open', () => {
  setupAutoExport();
});