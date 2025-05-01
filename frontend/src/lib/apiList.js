export const server = "https://talented-ai-api.vercel.app";

const apiList = {
  login: `${server}/auth/login`,
  signup: `${server}/auth/signup`,
  uploadResume: `${server}/upload/resume`,
  uploadProfileImage: `${server}/upload/profile`,
  jobs: `${server}/api/jobs`,
  applications: `${server}/api/applications`,
  rating: `${server}/api/rating`,
  user: `${server}/api/user`,
  applicants: `${server}/api/applicants`,
  interviewResults: `${server}/api/interview-results`,
  getInterviewQuestion: `${server}/api/get-interview-question`,
  evaluateAnswer: `${server}/api/evaluate-answer`,
};

export default apiList;
