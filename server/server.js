require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

console.log('🚀 Starting LinkUp server...');

let authRoutes, messageRoutes;

try {
  authRoutes = require('./routes/auth');
  messageRoutes = require('./routes/messages');
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Get client URL from environment or use defaults
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

console.log('Environment check:');
console.log('- CLIENT_URL:', CLIENT_URL);
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('- PORT:', process.env.PORT || 5000);

// Configure Socket.IO with proper CORS
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      CLIENT_URL,
      'https://linkup-chat-lemon.vercel.app'
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["x-auth-token", "Content-Type"]
  },
  transports: ['polling'] // Use polling for better compatibility on free hosting
});

// CORS middleware - must be before routes
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    CLIENT_URL,
    'https://linkup-chat-lemon.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token']
}));

app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'LinkUp API is running!',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  console.error('Please set MONGODB_URI in Render dashboard');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not defined in environment variables');
  console.error('Please set JWT_SECRET in Render dashboard');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Connection string (sanitized):', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
    process.exit(1);
  });

// Socket.IO
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined`);
  });

  socket.on('sendMessage', (message) => {
    io.to(message.receiverId).emit('receiveMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ msg: 'Server error', error: err.message });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('=================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Accepting requests from: ${CLIENT_URL}`);
  console.log('=================================');
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});