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


const validateResumeData = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .escape(),
  body('currentPosition')
    .trim()
    .notEmpty().withMessage('Current position is required')
    .escape(),
  body('currentLength')
    .isFloat({ min: 0 }).withMessage('Experience length must be a positive number')
    .toFloat(),
  body('currentTechnologies')
    .trim()
    .notEmpty().withMessage('Technologies are required')
    .escape(),
  body('companies')
    .custom((value) => {
      try {
        const companies = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(companies)) {
          throw new Error('Companies must be an array');
        }
        if (companies.length === 0) {
          throw new Error('At least one company is required');
        }
        companies.forEach(company => {
          if (!company.name || !company.position) {
            throw new Error('Each company must have a name and position');
          }
        });
        return true;
      } catch (error) {
        throw new Error(`Invalid companies format: ${error.message}`);
      }
    })
];

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
app.use("/upload", require("./routes/uploadRoutes"));
app.use("/host", require("./routes/downloadRoutes"));

// Route to indicate server is running
app.get("/", (req, res) => {
  res.send("<h1>Server is running!</h1>");
});

// Job Skills Suggestion API Endpoint
app.post("/api/suggest-skills", async (req, res) => {
  const { jobTitle, company, location, jobType, description, skills } = req.body;

  const prompt = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Job Title: ${jobTitle}\nCompany: ${company}\nLocation: ${location}\nJob Type: ${jobType}\nDescription: ${description}\nSkills: ${skills}\nBased on the above job description, suggest some learning skills and learning paths that would be beneficial for a candidate applying for this job.`
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
      const suggestedSkills = response.data.candidates[0].content.parts.map(part => part.text).join("\n");
      res.json({ suggestedSkills });
    } else {
      console.log("No valid response structure found.");
      res.status(500).json({ error: "No valid response from AI." });
    }
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
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



// Resume Generation API Endpoint
app.post("/api/resume-create", validateResumeData, async (req, res) => {
  try {
    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: errors.array() 
      });
    }

    let { fullName, currentPosition, currentLength, currentTechnologies, companies } = req.body;

    // Ensure companies is properly parsed
    let workHistory;
    try {
      workHistory = typeof companies === 'string' ? JSON.parse(companies) : companies;
    } catch (error) {
      return res.status(400).json({
        error: "Invalid companies data",
        details: error.message
      });
    }

    // Structured prompts with error handling
    const summaryPrompt = {
      contents: [{
        role: "user",
        parts: [{
          text: `Generate a professional summary for a resume:
          Name: ${fullName}
          Position: ${currentPosition}
          Experience: ${currentLength} years
          Technologies: ${currentTechnologies}
          
          Write a compelling first-person summary in 100 words highlighting expertise and career goals.
          Focus on quantifiable achievements and technical expertise.`
        }]
      }]
    };

    const skillsPrompt = {
      contents: [{
        role: "user",
        parts: [{
          text: `Based on this profile:
          Position: ${currentPosition}
          Technologies: ${currentTechnologies}
          Experience: ${currentLength} years
          
          Generate a comprehensive list of 10-12 skills including:
          1. Technical skills from the technologies mentioned
          2. Relevant soft skills for the position
          3. Industry-specific competencies
          
          Format as a clear, bulleted list.`
        }]
      }]
    };

    const experiencePrompt = {
      contents: [{
        role: "user",
        parts: [{
          text: `Generate detailed work experience descriptions for each role:
          ${workHistory.map(job => 
            `Company: ${job.name}
             Position: ${job.position}
             Provide:
             - 3 key responsibilities
             - 2 notable achievements with metrics
             - Technologies used
             - Business impact`
          ).join('\n\n')}
          
          Format in bullet points using strong action verbs.`
        }]
      }]
    };

    // Make parallel API calls with error handling
    try {
      const [summaryResp, skillsResp, experienceResp] = await Promise.all([
        axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`,
          summaryPrompt,
          { 
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000 
          }
        ),
        axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`,
          skillsPrompt,
          { 
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000 
          }
        ),
        axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`,
          experiencePrompt,
          { 
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000 
          }
        )
      ]);

      // Extract and clean generated content with fallbacks
      const summary = summaryResp.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Failed to generate summary';
      const skills = skillsResp.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Failed to generate skills';
      const experience = experienceResp.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Failed to generate experience';

      // Process experience text into company-specific sections
      const experienceSections = experience.split('\n\n');

      // Construct resume data
      const resumeData = {
        basics: {
          name: fullName,
          position: currentPosition,
          yearsOfExperience: currentLength,
          summary: summary
        },
        skills: skills.split('\n')
          .map(skill => skill.trim())
          .filter(skill => skill && !skill.startsWith('-')), // Remove empty lines and bullet points
        workHistory: workHistory.map((company, index) => ({
          ...company,
          description: experienceSections[index] || 'Experience details not available'
        })),
        technologies: currentTechnologies.split(',').map(tech => tech.trim())
      };

      res.json(resumeData);

    } catch (apiError) {
      console.error("API call error:", apiError);
      res.status(500).json({
        error: "Failed to generate resume content",
        details: apiError.message
      });
    }

  } catch (error) {
    console.error("Resume generation error:", error);
    res.status(500).json({
      error: "Failed to process resume request",
      details: error.message
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