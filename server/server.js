require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);

// Get client URL from environment or use defaults
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Configure Socket.IO with proper CORS
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      CLIENT_URL,
      'https://linkup-chat-lemon.vercel.app' // Add your actual Vercel URL
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["x-auth-token", "Content-Type"]
  },
  transports: ['websocket', 'polling']
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
  res.json({ message: 'LinkUp API is running!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Accepting requests from: ${CLIENT_URL}`);
});