/*
Example of using module.exports and require in Node.js
    -> use for communicating between files

nodemon => a tool that helps develop Node.js based applications by automatically restarting the node application when file changes in the directory are detected.
-------
    -> npm install -g nodemon

*/

// Load environment variables first
const dotenv = require("dotenv");
dotenv.config();

// ================= Server ==================
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const emailWorker = require("./src/Redis/Worker/EmailWorker");
const PassportUtil = require("./src/Utils/PassportUtil"); // Temporarily disabled for testing 

const app = express();

// CORS configuration for SafeSpace frontend
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true, // This is crucial for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser()); // Add cookie parser middleware
app.use(PassportUtil.initialize()); 

const mongoose = require("mongoose");

const PORT = 3001;

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

// Important: Change app.listen to server.listen
// app.listen(PORT, () => {...});

// Use this instead:
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

// ==================== MVC ====================

const userRoutes = require("./src/Routes/UserRoutes");
const authRoutes = require("./src/Routes/AuthRoutes");
const uploadRoutes = require("./src/Routes/UploadRoutes");
const roleRoutes = require("./src/Routes/RoleRoutes");
const passport = require("./src/Utils/PassportUtil");

app.use("/auth", authRoutes); // Consolidated auth routes
app.use("/users", userRoutes);
app.use("/role", roleRoutes);
app.use("/upload", uploadRoutes); // for file upload

// Simple health check endpoint
app.get("/", (req, res) => {
    res.json({ 
        message: "SafeSpace Node.js API is running", 
        port: PORT,
        timestamp: new Date().toISOString(),
        status: "healthy"
    });
});

mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => {
        console.log("MongoDB connected...");
    })
    .catch((err) => {
        console.log("MongoDB connection error: ", err);
    });

console.log(`EmailWorker initialized and ready to process jobs`);
