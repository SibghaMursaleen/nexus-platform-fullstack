const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 5000;

// Security Middleware (Headers) 🛡️
app.use(helmet());
app.use(cookieParser());
app.use(cors()); // Prioritize CORS access

// Rate Limiting for Auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: 'Too many login attempts, please try again after 15 minutes'
});
app.use('/api/auth', authLimiter);

// Standard Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input Sanitization (Must be after body parser) 🧼
app.use(mongoSanitize());
app.use(xss());

app.use(morgan('dev'));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

// Mongoose Debugging
mongoose.set('debug', true);

// Connect and Start Server
const startServer = async () => {
    let connectionUri = process.env.MONGO_URI;

    if (process.env.USE_MEMORY_DB === 'true') {
        try {
            console.log('🔄 Starting In-Memory MongoDB...');
            const mongoServer = await MongoMemoryServer.create();
            connectionUri = mongoServer.getUri();
            console.log('✅ In-Memory MongoDB started at:', connectionUri);
        } catch (err) {
            console.error('❌ Failed to start In-Memory MongoDB:', err);
            process.exit(1);
        }
    }

    if (connectionUri) {
        mongoose.connect(connectionUri)
            .then(async () => {
                console.log(process.env.USE_MEMORY_DB === 'true' ? '✅ Connected to In-Memory MongoDB' : '✅ Connected to MongoDB Atlas');
                
                // Seed Demo Users if in Memory Mode
                if (process.env.USE_MEMORY_DB === 'true') {
                    const demoUsers = [
                        { 
                            name: "Demo Entrepreneur", 
                            email: "entrepreneur@nexus.com", 
                            password: "password123", 
                            role: "entrepreneur", 
                            isVerified: true,
                            bio: "Serial entrepreneur with 10+ years of experience in SaaS and fintech.",
                            startupName: "TechWave AI",
                            industry: "FinTech",
                            location: "San Francisco, CA",
                            pitchSummary: "AI-powered financial analytics platform helping SMBs make data-driven decisions.",
                            fundingNeeded: "$1.5M",
                            teamSize: 12,
                            foundedYear: "2021",
                            isOnline: true,
                            avatarUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg"
                        },
                        { 
                            name: "Demo Investor", 
                            email: "investor@nexus.com", 
                            password: "password123", 
                            role: "investor", 
                            isVerified: true,
                            bio: "Early-stage investor with focus on B2B SaaS and fintech. Previously founded and exited two startups.",
                            startupName: "Innovate VC",
                            location: "New York, NY",
                            investmentInterests: ["FinTech", "SaaS", "AI/ML"],
                            investmentStage: ["Seed", "Series A"],
                            portfolioCompanies: ["PayStream", "DataSense", "CloudSecure"],
                            totalInvestments: 12,
                            minimumInvestment: "$250K",
                            maximumInvestment: "$1.5M",
                            isOnline: true,
                            avatarUrl: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg"
                        }
                    ];
                    for (const u of demoUsers) {
                        const exists = await User.findOne({ email: u.email });
                        if (!exists) {
                            await User.create(u);
                        } else {
                            // Update existing users in memory DB if schema changed
                            Object.assign(exists, u);
                            await exists.save();
                        }
                    }
                    console.log('👥 Demo accounts seeded with full profile data');
                }

                server.listen(PORT, () => {
                    console.log(`🚀 Server with Socket.io is running on http://localhost:${PORT}`);
                });
            })
            .catch(err => {
                console.error('❌ MongoDB Connection Error:', err);
                process.exit(1);
            });
    } else {
        console.error('MONGO_URI is not defined in .env');
        process.exit(1);
    }
};

startServer();

// Routes
const authRoutes = require('./routes/authRoutes');

// API Endpoints
const testRoutes = require('./routes/testRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const documentRoutes = require('./routes/documentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', require('./routes/userRoutes')); // Branding & Profile ✅

// Static for uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Welcome Route
app.get('/', (req, res) => {
    res.status(200).send('Welcome to the Nexus API Backend! Access your endpoints at /api/... or visit /api/health for status.');
});

// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Nexus Backend is running!',
        timestamp: new Date().toISOString()
    });
});

// Socket.io Signaling Logic
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join-room', (roomId) => {
        console.log(`User ${socket.id} joined room: ${roomId}`);
        socket.join(roomId);
        // Notify others in the room
        socket.to(roomId).emit('user-joined', { userId: socket.id });
    });

    // 1:1 Call Signaling - Initiate call
    socket.on('call-user', (data) => {
        // data: { to, from, fromName, roomId }
        console.log(`Socket: Calling user ${data.to} from ${data.from}`);
        socket.to(data.to).emit('incoming-call', {
            from: data.from,
            fromName: data.fromName,
            roomId: data.roomId
        });
    });

    socket.on('offer', (data) => {
        // data: { roomId, offer }
        socket.to(data.roomId).emit('offer', {
            offer: data.offer,
            senderId: socket.id
        });
    });

    socket.on('answer', (data) => {
        // data: { roomId, answer }
        socket.to(data.roomId).emit('answer', {
            answer: data.answer,
            senderId: socket.id
        });
    });

    socket.on('ice-candidate', (data) => {
        // data: { roomId, candidate }
        socket.to(data.roomId).emit('ice-candidate', {
            candidate: data.candidate,
            senderId: socket.id
        });
    });

    // Messaging Socket Events
    socket.on('join-chat', (userId) => {
        console.log(`User ${userId} joined their personal chat room: ${userId}`);
        socket.join(userId);
    });

    socket.on('send-message', (data) => {
        // data: { senderId, receiverId, content, createdAt, _id }
        console.log(`Socket: Sending message from ${data.senderId} to ${data.receiverId}`);
        socket.to(data.receiverId).emit('receive-message', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
