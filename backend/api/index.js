const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passportConfig = require("../lib/passportConfig");
const cors = require("cors");
const axios = require("axios");
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Set mongoose strictQuery option
mongoose.set('strictQuery', true);

// MongoDB connection with connection pooling for serverless
let cachedConnection = null;

const connectToDatabase = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });
    
    cachedConnection = connection;
    console.log("Connected to DB");
    return connection;
  } catch (err) {
    console.error("Error connecting to DB:", err);
    throw err;
  }
};

const app = express();

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Setting up middlewares
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

const allowedOrigins = [
  'https://talented-aii.vercel.app', 
  'http://localhost:3000',
  'https://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(apiLimiter);

// Initialize passport after DB connection
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    passportConfig.initialize()(req, res, next);
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Routing
app.use("/auth", require("../routes/authRoutes"));
app.use("/api", require("../routes/apiRoutes"));

// Route to indicate server is running
app.get("/", (req, res) => {
  res.json({ 
    message: "Talented AI Backend API is running!", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await connectToDatabase();
    res.json({ 
      status: "healthy",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions for AI content generation
const generateSkills = async (data) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        contents: [{
          role: "user",
          parts: [{
            text: `Generate a list of professional skills for:
                  Position: ${data.currentPosition}
                  Technologies: ${data.currentTechnologies}
                  Experience: ${data.currentLength} years
                  
                  Return only a comma-separated list of relevant technical and soft skills.`
          }]
        }]
      },
      { timeout: 10000 }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid AI response structure');
    }

    const skillsList = response.data.candidates[0].content.parts[0].text
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    return skillsList;
  } catch (error) {
    console.error('Skills generation error:', error);
    return data.currentTechnologies
      .split(',')
      .map(tech => tech.trim())
      .filter(tech => tech.length > 0);
  }
};

const generateSummary = async (data) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        contents: [{
          role: "user",
          parts: [{
            text: `Generate a professional summary for:
                  Name: ${data.fullName}
                  Current Position: ${data.currentPosition}
                  Years of Experience: ${data.currentLength}
                  Technologies: ${data.currentTechnologies}
                  
                  Write a concise, first-person professional summary (100-150 words).`
          }]
        }]
      },
      { timeout: 10000 }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid AI response structure');
    }

    return response.data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Summary generation error:', error);
    return `Experienced ${data.currentPosition} with ${data.currentLength} years of expertise in ${data.currentTechnologies}.`;
  }
};

// AI API Endpoints
app.post("/generate-resume", async (req, res) => {
  try {
    await connectToDatabase();
    
    const { fullName, currentPosition, currentLength, currentTechnologies, companies } = req.body;
    
    if (!fullName || !currentPosition || !currentTechnologies) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [skills, summary] = await Promise.all([
      generateSkills(req.body),
      generateSummary(req.body)
    ]);

    const resume = {
      fullName,
      currentPosition,
      currentLength,
      summary,
      skills,
      companies: companies || [],
      generatedAt: new Date().toISOString()
    };

    res.json({ resume });
  } catch (error) {
    console.error("Error generating resume:", error);
    res.status(500).json({ 
      error: "Failed to generate resume",
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal Server Error",
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.path,
    method: req.method
  });
});

module.exports = app;
