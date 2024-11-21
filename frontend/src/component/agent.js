import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

  const useStyles = makeStyles(theme => ({
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2rem',
      padding: '5vh 1rem',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
    },
    contentContainer: {
      display: 'flex',
      gap: '2rem',
      width: '100%',
      maxWidth: '1200px',
      '@media (max-width: 768px)': {
        flexDirection: 'column',
        gap: '1rem',
      },
    },
    formContainer: {
      width: '500px',
      height: '600px',
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      '@media (max-width: 768px)': {
        width: '100%',
        height: 'auto',
        minHeight: '500px',
      },
    },
    innerContainer: {
      padding: '1.5rem',
      '@media (max-width: 768px)': {
        padding: '1rem',
      },
    },
    title: {
      fontWeight: 'bold',
      fontSize: '1.25rem',
      marginBottom: '0.5rem',
      '@media (max-width: 768px)': {
        fontSize: '1.1rem',
      },
    },
    formGroup: {
      marginBottom: '1rem',
      paddingRight: '1rem',
      '@media (max-width: 768px)': {
        paddingRight: '0',
      },
    },
    label: {
      display: 'block',
      color: '#4a5568',
      fontSize: '0.875rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
    },
    input: {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      borderRadius: '0.375rem',
      width: '100%',
      padding: '0.5rem 0.75rem',
      color: '#4a5568',
      lineHeight: '1.25',
      boxSizing: 'border-box',
      '&:focus': {
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.5)',
      },
    },
    buttonContainer: {
      padding: '1.5rem',
      '@media (max-width: 768px)': {
        padding: '1rem',
      },
    },
    button: {
      backgroundColor: '#4299e1',
      color: 'white',
      fontWeight: 'bold',
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      width: '100%',
      '&:hover': {
        backgroundColor: '#2b6cb0',
      },
      '&:focus': {
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.5)',
      },
    },
    jobDescriptionContainer: {
      width: '500px',
      height: '570px',
      fontSize: '0.75rem',
      color: '#718096',
      padding: '1rem',
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      whiteSpace: 'pre-line',
      overflowY: 'auto',
      '@media (max-width: 768px)': {
        width: '90%',
        height: '400px',
      },
    },
    pageTitle: {
      fontFamily: "Chillax-semibold, sans-serif",
      '@media (max-width: 768px)': {
        fontSize: '1.75rem',
      },
    },
  loaderContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  errorMessage: {
    color: 'red',
    fontWeight: 'bold',
    marginTop: '1rem',
  },
  pathContainer: {
    width: '600px',
    height: '600px',
    padding: '1.5rem',
    backgroundColor: '#fff',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflowY: 'auto',
    '@media (max-width: 768px)': {
      width: '100%',
      height: 'auto',
      maxHeight: '500px',
      padding: '1rem',
      marginTop: '1rem',
      marginBottom: '2rem'
    }
  },
  
  milestone: {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.375rem',
    '@media (max-width: 768px)': {
      padding: '0.75rem',
      marginBottom: '1rem',
      fontSize: '0.9rem'
    }
  },
  
  resourceList: {
    listStyle: 'none',
    padding: '0',
    margin: '0.5rem 0',
    '@media (max-width: 768px)': {
      margin: '0.25rem 0'
    }
  },
  mobileScrollContainer: {
    WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
    msOverflowStyle: 'none', // Hide scrollbar on IE/Edge
    scrollbarWidth: 'none', // Hide scrollbar on Firefox
    '&::-webkit-scrollbar': {
      display: 'none' // Hide scrollbar on Chrome/Safari
    }
  },

  contentText: {
    '@media (max-width: 768px)': {
      fontSize: '0.9rem',
      lineHeight: '1.4'
    }
  }
}));

const LearningPathForm = ({ onSubmit }) => {
  const classes = useStyles();
  const [formData, setFormData] = useState({
    domain: 'webdev',
    skill: '',
    currentLevel: 'beginner',
    learningGoal: '',
    timeframe: 'flexible',
    preferredStyle: 'interactive'
  });

  const domains = {
    webdev: {
      name: 'Web Development',
      skills: ['React', 'Node.js', 'JavaScript', 'TypeScript', 'HTML/CSS']
    },
    mobile: {
      name: 'Mobile Development',
      skills: ['React Native', 'Flutter', 'iOS', 'Android']
    },
    data: {
      name: 'Data Science',
      skills: ['Python', 'Machine Learning', 'Data Analysis', 'Statistics']
    },
    cloud: {
      name: 'Cloud Computing',
      skills: ['AWS', 'Azure', 'Docker', 'Kubernetes']
    }
  };

  return (
    <div className={classes.formContainer}>
      <div className={classes.innerContainer}>
        <Typography variant="h6" className={classes.title}>
          Learning Agent
        </Typography>

        <div className={classes.formGroup}>
          <label className={classes.label}>Domain</label>
          <select
            className={classes.input}
            value={formData.domain}
            onChange={(e) => setFormData({
              ...formData,
              domain: e.target.value,
              skill: ''
            })}
          >
            {Object.entries(domains).map(([key, value]) => (
              <option key={key} value={key}>{value.name}</option>
            ))}
          </select>
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>Skill</label>
          <select
            className={classes.input}
            value={formData.skill}
            onChange={(e) => setFormData({...formData, skill: e.target.value})}
          >
            <option value="">Select a skill</option>
            {domains[formData.domain].skills.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>Current Level</label>
          <select
            className={classes.input}
            value={formData.currentLevel}
            onChange={(e) => setFormData({...formData, currentLevel: e.target.value})}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>Learning Goal</label>
          <textarea
            className={classes.input}
            value={formData.learningGoal}
            onChange={(e) => setFormData({...formData, learningGoal: e.target.value})}
            placeholder="What do you want to achieve?"
            rows={3}
          />
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>Time Commitment</label>
          <select
            className={classes.input}
            value={formData.timeframe}
            onChange={(e) => setFormData({...formData, timeframe: e.target.value})}
          >
            <option value="intensive">Full-time (40+ hrs/week)</option>
            <option value="balanced">Part-time (20-30 hrs/week)</option>
            <option value="flexible">Flexible (5-10 hrs/week)</option>
          </select>
        </div>

        <button
          className={classes.button}
          onClick={() => onSubmit(formData)}
          disabled={!formData.skill || !formData.learningGoal}
        >
          Generate Learning Path
        </button>
      </div>
    </div>
  );
};

function LearningPathGenerator() {
  const classes = useStyles();
  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setPathData(null);
  
    try {
      const API_URL = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:4444'
        : 'https://talented-ai-api.vercel.app';
  
      const response = await fetch(`${API_URL}/api/suggest-learning-path`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          skill: data.skill,
          currentLevel: data.currentLevel,
          learningGoal: data.learningGoal,
          timeframe: data.timeframe,
          preferredStyle: data.preferredStyle
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
  
      const { learningPath } = await response.json();
      
      if (!learningPath) {
        throw new Error('Invalid response format');
      }
  
      setPathData(learningPath);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to generate learning path. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={classes.container}>
      <Typography variant="h2" className={classes.pageTitle}>
        Learning Agent
      </Typography>
      <div className={classes.contentContainer}>
        <LearningPathForm onSubmit={onSubmit} />
        <div className={classes.pathContainer}>
          {loading ? (
            <div className={classes.loaderContainer}>
              <div className="loader"></div>
              <span>Generating your learning path...</span>
            </div>
          ) : error ? (
            <div className={classes.errorMessage}>{error}</div>
          ) : pathData && (
            <div>
              <Typography variant="h6">{pathData.overview}</Typography>
              <Typography variant="subtitle1">
                Estimated time: {pathData.estimatedTimeToComplete}
              </Typography>
              
              <Typography variant="h6" style={{marginTop: '1rem'}}>
                Prerequisites:
              </Typography>
              <ul className={classes.resourceList}>
                {pathData.prerequisites.map((prereq, index) => (
                  <li key={index}>{prereq}</li>
                ))}
              </ul>

              <Typography variant="h6" style={{marginTop: '1.5rem'}}>
                Milestones:
              </Typography>
              {pathData.milestones.map((milestone, index) => (
                <div key={index} className={classes.milestone}>
                  <Typography variant="subtitle1">
                    <strong>{milestone.title}</strong>
                  </Typography>
                  <Typography variant="body2">{milestone.description}</Typography>
                  <Typography variant="caption">
                    Time estimate: {milestone.timeEstimate}
                  </Typography>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LearningPathGenerator;