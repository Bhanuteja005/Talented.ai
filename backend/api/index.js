const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passportConfig = require("../lib/passportConfig");
const cors = require("cors");
const axios = require("axios");
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Validation middleware
const validateInterviewQuestion = [
  body('jobTitle').trim().notEmpty().escape(),
  body('skills').trim().notEmpty().escape(),
  body('experience').isInt({ min: 0, max: 50 }),
  body('currentQuestion').isInt({ min: 0 })
];

const validateAnswer = [
  body('question').trim().notEmpty().escape(),
  body('expectedAnswer').trim().notEmpty().escape(),
  body('userAnswer').trim().notEmpty().escape()
];

const validateResumeInput = (req, res, next) => {
  try {
    const { fullName, currentPosition, currentLength, currentTechnologies, companies } = req.body;

    if (!fullName || !currentPosition || !currentTechnologies) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ error: 'At least one company is required' });
    }

    if (typeof currentLength !== 'number' || currentLength < 0) {
      return res.status(400).json({ error: 'Invalid experience length' });
    }

    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid request format' });
  }
};

// Set mongoose strictQuery option
mongoose.set('strictQuery', true);

// MongoDB connection with connection pooling for serverless
let cachedConnection = null;

const connectToDatabase = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0 // Disable mongoose buffering
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

// Setting up middlewares
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

const allowedOrigins = ['https://talented-aii.vercel.app', 'http://localhost:3000'];
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
  res.json({ message: "Server is running!", timestamp: new Date().toISOString() });
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
                  
                  Write a concise, first-person professional summary (100-150 words) that:
                  1. Highlights key expertise
                  2. Mentions years of experience
                  3. Emphasizes technical skills
                  4. Notes significant achievements
                  
                  Return only the summary text, no additional formatting.`
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
    return `Experienced ${data.currentPosition} with ${data.currentLength} years of expertise in ${data.currentTechnologies}. Proven track record of delivering high-quality solutions and driving technical innovation.`;
  }
};

// AI API Endpoints
app.post("/suggest-learning-path", async (req, res) => {
  try {
    await connectToDatabase();
    
    const { skill, currentLevel, learningGoal, timeframe, preferredStyle } = req.body;
    
    if (!skill || !currentLevel || !learningGoal) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = {
      contents: [{
        role: "user",
        parts: [{
          text: `Generate a structured learning path in valid JSON format only, no additional text:
          {
            "learningPath": {
              "overview": "Brief overview of ${skill} learning path",
              "prerequisites": ["Required prerequisite 1", "Required prerequisite 2"],
              "milestones": [
                {
                  "title": "Milestone title",
                  "description": "Milestone description",
                  "duration": "Estimated duration",
                  "resources": [
                    {
                      "type": "video|article|exercise",
                      "title": "Resource title",
                      "url": "Resource URL"
                    }
                  ]
                }
              ],
              "estimatedTimeToComplete": "Total estimated duration",
              "skillLevel": "${currentLevel}",
              "goal": "${learningGoal}"
            }
          }`
        }]
      }]
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      prompt,
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid AI response structure');
    }

    let responseText = response.data.candidates[0].content.parts[0].text;
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    responseText = responseText.trim();

    try {
      const learningPath = JSON.parse(responseText);
      
      if (!learningPath.learningPath || !learningPath.learningPath.milestones) {
        throw new Error('Invalid learning path structure');
      }

      res.json(learningPath);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      res.status(500).json({ 
        error: "Failed to parse learning path",
        details: parseError.message
      });
    }

  } catch (error) {
    console.error("Error generating learning path:", error);
    res.status(500).json({ 
      error: "Failed to generate learning path",
      details: error.message 
    });
  }
});

// ...existing AI endpoints with similar error handling...

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal Server Error",
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
