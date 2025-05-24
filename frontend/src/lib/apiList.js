export const server = "http://localhost:4444";

const apiList = {
  login: `${server}/auth/login`,
  signup: `${server}/auth/signup`,
  uploadResume: `${server}/api/uploads/resume`, // Fixed: Added /api prefix
  uploadProfileImage: `${server}/upload/profile`,
  jobs: `${server}/api/jobs`,
  applications: `${server}/api/applications`,
  rating: `${server}/api/rating`,
  user: `${server}/api/user`,
  applicants: `${server}/api/applicants`,
  interviewResults: `${server}/api/interview-results`,
  getInterviewQuestion: `${server}/api/get-interview-question`,
  evaluateAnswer: `${server}/api/evaluate-answer`,
  downloadResume: `${server}/api/download/resume`,
  downloadInterview: `${server}/api/download/interview`,
};

export default apiList;
