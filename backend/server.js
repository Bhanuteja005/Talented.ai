const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passportConfig = require("./lib/passportConfig");
const cors = require("cors");
const axios = require("axios"); // For making HTTP requests to Gemini API
require('dotenv').config(); // Import and configure dotenv

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
// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}!`);
});