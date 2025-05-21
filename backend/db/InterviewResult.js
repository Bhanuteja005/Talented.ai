const mongoose = require("mongoose");

const interviewResultSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Application"
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Job"
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
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
  feedbacks: {
    type: [String],
    default: [],
  },
  videoRecording: {
    type: String,
    default: null,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("InterviewResult", interviewResultSchema);
