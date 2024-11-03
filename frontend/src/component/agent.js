import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import sanitizeHtml from 'sanitize-html';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
    paddingTop: '10vh',
  },
  contentContainer: {
    display: 'flex',
    gap: '2rem',
  },
  formContainer: {
    width: '500px',
    height: '600px',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  innerContainer: {
    padding: '1.5rem',
  },
  title: {
    fontWeight: 'bold',
    fontSize: '1.25rem',
    marginBottom: '0.5rem',
  },
  formGroup: {
    marginBottom: '1rem',
    paddingRight:'1rem'
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
    '&:focus': {
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.5)',
    },
  },
  buttonContainer: {
    padding: '1.5rem',
  },
  button: {
    backgroundColor: '#4299e1',
    color: 'white',
    fontWeight: 'bold',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
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
});

const JobForm = ({ onSubmit }) => {
  const classes = useStyles();
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [skills, setSkills] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    const sanitizedDescription = sanitizeHtml(description);
    const jobData = {
      jobTitle,
      company,
      skills,
      description: sanitizedDescription,
    };
    onSubmit(jobData);
  };

  return (
    <div className={classes.formContainer}>
      <div className={classes.innerContainer}>
        <div className={classes.title}>Job Skills Assistant</div>
        <div className={classes.formGroup}>
          <label className={classes.label} htmlFor="jobTitle">
            Job Title
          </label>
          <input
            className={classes.input}
            id="jobTitle"
            type="text"
            placeholder="Enter job title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.label} htmlFor="company">
            Company
          </label>
          <input
            className={classes.input}
            id="company"
            type="text"
            placeholder="Enter company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.label} htmlFor="skills">
            Job Skills
          </label>
          <textarea
            className={classes.input}
            id="skills"
            placeholder="Enter job skills"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.label} htmlFor="description">
            Job Description
          </label>
          <textarea
            className={classes.input}
            id="description"
            placeholder="Enter job description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className={classes.buttonContainer}>
          <button
            className={classes.button}
            type="button"
            onClick={handleSubmit}
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};

function JobAssistant() {
  const classes = useStyles();
  const [jobData, setJobData] = useState(null);
  const [jobText, setJobText] = useState("");
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
    setJobText('');
    setError(null);
    setJobData(data);

    try {
      const response = await fetch('https://talented-ai-api.vercel.app/api/suggest-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const sanitizedSkills = sanitizeHtml(result.suggestedSkills, {
        allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em'],
        allowedAttributes: {}
      });
      setJobText(sanitizedSkills);
    } catch (error) {
      console.error('Error generating suggested skills:', error);
      setError('Failed to generate suggested skills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.container}>
      <Typography variant="h2" align="center" style={{ fontFamily: "Chillax-semibold, sans-serif" }}>
        Learning Agent
      </Typography>
      <div className={classes.contentContainer}>
        <JobForm onSubmit={onSubmit} />
        <div className={classes.jobDescriptionContainer}>
          {loading ? (
            <div className={classes.loaderContainer}>
              <div className="loader"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <div>
              {error && <div className={classes.errorMessage}>{error}</div>}
              <div dangerouslySetInnerHTML={{ __html: jobText }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobAssistant;