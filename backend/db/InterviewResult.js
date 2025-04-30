const mongoose = require("mongoose");

const interviewResultSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  questions: {
    type: [String],
    default: [],
  },
  answers: {
    type: [String],
    default: [],
  },
  scores: {
    type: [Number],
    default: [],
  },
  overallScore: {
    type: Number,
    default: 0,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("InterviewResult", interviewResultSchema);
