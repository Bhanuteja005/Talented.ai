const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passportConfig = require("./lib/passportConfig");
const cors = require("cors");
const axios = require("axios"); // For making HTTP requests to Gemini API
require('dotenv').config(); // Import and configure dotenv
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

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((res) => console.log("Connected to DB"))
  .catch((err) => {
    console.error("Error connecting to DB:", err);
    process.exit(1); // Exit the process with an error code
  });

const app = express();
const port = process.env.PORT || 4444;

app.use(bodyParser.json()); // Support JSON-encoded request bodies
app.use(bodyParser.urlencoded({ extended: true })); // Support URL-encoded request bodies

// Setting up middlewares
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
app.use(express.json());
app.use(passportConfig.initialize());

// Routing
app.use("/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/apiRoutes"));
app.use("/uploads", require("./routes/uploadRoutes"));
app.use("/host", require("./routes/downloadRoutes"));

// Route to indicate server is running
app.get("/", (req, res) => {
  res.send("<h1>Server is running!</h1>");
});
// Job Skills Suggestion API Endpoint
app.post("/api/suggest-learning-path", async (req, res) => {
  try {
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

    // Clean the response text
    let responseText = response.data.candidates[0].content.parts[0].text;
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    responseText = responseText.trim();

    try {
      const learningPath = JSON.parse(responseText);
      
      // Validate response structure
      if (!learningPath.learningPath || !learningPath.learningPath.milestones) {
        throw new Error('Invalid learning path structure');
      }

      res.json(learningPath);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.log("Raw Response:", responseText);
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
// Recruiter Agent API Endpoint
app.post("/api/suggest-candidate", async (req, res) => {
  const { companyDescription, candidateInfo, jobDescription } = req.body;

  const prompt = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Company Description: ${companyDescription}\nCandidate Information: ${candidateInfo}\nJob Description: ${jobDescription}\nBased on the above information, evaluate if the candidate matches the job description and provide the pros and cons of this match.`
          }
        ]
      }
    ]
  };

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      prompt,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data && response.data.candidates && response.data.candidates[0].content && response.data.candidates[0].content.parts) {
      const evaluation = response.data.candidates[0].content.parts.map(part => part.text).join("\n");
      res.json({ evaluation });
    } else {
      console.log("No valid response structure found.");
      res.status(500).json({ error: "No valid response from AI." });
    }
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});
// Interview Question Generation API Endpoint
app.post("/api/get-interview-question", 
  apiLimiter,
  validateInterviewQuestion,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { jobTitle, skills, experience, currentQuestion } = req.body;

      const prompt = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Generate a technical interview question as if an interviewer is asking, based on the job title and required skills. Ensure that questions are directly relevant to the job role and related skills, and that no questions repeat:
                Job Title: ${jobTitle}
                Required Skills: ${skills}
                Experience Level: ${experience} years
                Question Number: ${currentQuestion + 1}
        
                {
                  "question": "detailed technical question",
                  "expectedAnswer": "comprehensive model answer",
                  "difficulty": "beginner"
                }`
              }
            ]
          }
        ]        
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

      // Clean the response text
      let responseText = response.data.candidates[0].content.parts[0].text;
      // Remove markdown code blocks if present
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      // Remove any leading/trailing whitespace
      responseText = responseText.trim();

      try {
        const result = JSON.parse(responseText);
        res.json(result);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.log("Raw Response:", responseText);
        res.status(500).json({ 
          error: "Failed to parse AI response",
          details: parseError.message
        });
      }

    } catch (error) {
      console.error("Error generating question:", error);
      res.status(500).json({ 
        error: "Failed to generate interview question",
        details: error.message
      });
    }
});
// Answer Evaluation API Endpoint
app.post("/api/evaluate-answer",
  apiLimiter,
  validateAnswer,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { question, expectedAnswer, userAnswer } = req.body;

      const prompt = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an interview evaluator. Compare the candidate's answer with the expected answer and provide a score and feedback.
                
                Question: ${question}
                Expected Answer: ${expectedAnswer}
                Candidate's Answer: ${userAnswer}
                
                Evaluate the answer based on:
                1. Accuracy of technical concepts (40 points)
                2. Completeness of answer (30 points)
                3. Clear explanation (30 points)
                
                Respond strictly in this JSON format without any markdown or additional text:
                {
                  "score": <number between 0-100>,
                  "feedback": "<specific feedback on the answer>",
                  "strengths": ["<specific strength>", "<specific strength>"],
                  "improvements": ["<specific improvement>", "<specific improvement>"],
                  "accuracy": "<percentage> match"
                }`
              }
            ]
          }
        ]
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

      // Clean the response text
      let responseText = response.data.candidates[0].content.parts[0].text;
      // Remove any markdown formatting
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      // Remove any leading/trailing whitespace
      responseText = responseText.trim();

      try {
        const result = JSON.parse(responseText);
        
        // Ensure score is a number between 0-100
        result.score = Math.min(Math.max(parseInt(result.score) || 0, 0), 100);
        
        // Ensure other required fields exist
        result.feedback = result.feedback || 'No feedback provided';
        result.strengths = Array.isArray(result.strengths) ? result.strengths : [];
        result.improvements = Array.isArray(result.improvements) ? result.improvements : [];
        result.accuracy = result.accuracy || '0%';

        res.json(result);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.log("Raw Response:", responseText);
        res.status(500).json({ 
          error: "Failed to parse evaluation",
          score: 0,
          feedback: "Error evaluating answer",
          strengths: [],
          improvements: ["Unable to evaluate answer properly"],
          accuracy: "0%"
        });
      }

    } catch (error) {
      console.error("Error evaluating answer:", error);
      res.status(500).json({ 
        error: "Failed to evaluate answer",
        score: 0,
        feedback: "Error processing answer",
        strengths: [],
        improvements: ["System error occurred"],
        accuracy: "0%"
      });
    }
});

// Add generateSkills helper function
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
    // Fallback skills based on provided technologies
    return data.currentTechnologies
      .split(',')
      .map(tech => tech.trim())
      .filter(tech => tech.length > 0);
  }
};
// Add generateSummary helper function
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
    // Fallback summary
    return `Experienced ${data.currentPosition} with ${data.currentLength} years of expertise in ${data.currentTechnologies}. Proven track record of delivering high-quality solutions and driving technical innovation.`;
  }
};
// Update resume creation endpoint
app.post("/api/resume-create", validateResumeInput, async (req, res) => {
  try {
    const { fullName, currentPosition, currentLength, currentTechnologies, companies } = req.body;

    // Generate AI content with error handling
    const [summary, skills] = await Promise.allSettled([
      generateSummary({ fullName, currentPosition, currentLength, currentTechnologies }),
      generateSkills({ currentPosition, currentTechnologies, currentLength })
    ]);

    const resumeData = {
      fullName,
      currentPosition, 
      currentLength,
      currentTechnologies,
      companies,
      summary: summary.status === 'fulfilled' ? summary.value : 'Professional summary generation failed',
      skills: skills.status === 'fulfilled' ? skills.value : currentTechnologies.split(','),
      generatedAt: new Date().toISOString()
    };

    res.json(resumeData);
  } catch (error) {
    console.error('Resume generation error:', error);
    res.status(500).json({
      error: 'Failed to generate resume',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}!`);
});