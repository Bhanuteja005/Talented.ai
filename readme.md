<div align="center">
  <img src="frontend/public/l.png" alt="Talented.ai Logo" width="200"/>

  # Talented.ai 🚀
  > AI-Powered Career Discovery Platform

  [![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
  [![React](https://img.shields.io/badge/React-18.0.0-blue.svg)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-14.0.0-green.svg)](https://nodejs.org/)

  [Live Demo](https://talented-ai.vercel.app/) | [Documentation](docs/README.md) | [Report Bug](issues/new)
</div>

## 🎥 Demo Video
Check out our platform in  action:

<div align="center">
  <a href="https://flonnect.com/video/5379d244bbbf-489e-8e9a-41d5f82addaa">
    <img src="docs/screenshots/video-thumbnail.png" alt="Demo Video" width="600"/>
  </a>
</div>

## ✨ Key Features

🤖 **AI-Powered Matching**
- Smart career recommendations
- Real-time skill gap analysis
- Personalized learning paths

👥 **Smart Profiling**
- Comprehensive skill assessment
- Career compatibility scoring
- Industry insights

## 🚀 Quick Setup

```bash
# Clone repository
git clone https://github.com/Bhanuteja005/Talented.ai.git

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install

# Start application
npm start

### Database Setup

Ensure MongoDB is installed and running on your local machine or use a cloud-hosted MongoDB service like MongoDB Atlas. Configure your `.env` file with the following environment variables:

```bash
MONGO_URI=<your-mongo-database-connection-string>
PORT=4444
```

### API Keys

If Talented.ai requires external API integrations (for example, AI/ML APIs), make sure to include your API keys in the `.env` file as well:

```bash
GOOGLE_API_KEY=<your-gemini-api-key>
```
---

## API Documentation

The Talented.ai platform provides a set of RESTful API endpoints. Below is an overview of the key API endpoints.

### Authentication

- **POST /api/auth/register**: Register a new user.
- **POST /api/auth/login**: Login to the platform.

### User Profiles

- **GET /api/user/profile**: Retrieve user profile details.
- **PUT /api/user/profile/update**: Update profile information.
  
### Career Recommendations

- **GET /api/candidate-suggestion**: Get personalized career recommendations for a user.
- **GET /api/skill-suggestion**: Get the latest trends in specific careers.



---

## Tech Stack

**Frontend**:
- ⚛️ React.js
- 🎨 Material-UI
- 📊 Chart.js

**Backend**
- 🟢 Node.js
- 🚂 Express.js
- 🍃 MongoDB
- 🔒 JWT

---

## 📬 Contact

- Project Link: https://github.com/Bhanuteja005/Talented.ai