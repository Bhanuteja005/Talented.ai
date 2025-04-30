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
});

const JobForm = ({ onSubmit }) => {
  const classes = useStyles();
  const [companyDescription, setCompanyDescription] = useState("");
  const [candidateInfo, setCandidateInfo] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const handleSubmit = () => {
    const jobData = {
      companyDescription,
      candidateInfo,
      jobDescription,
    };
    onSubmit(jobData);
  };

  return (
    <div className={classes.formContainer}>
      <div className={classes.innerContainer}>
        <div className={classes.title}>Job Hiring Agent</div>
        <div className={classes.formGroup}>
          <label className={classes.label} htmlFor="companyDescription">
            Company Description
          </label>
          <textarea
            className={classes.input}
            id="companyDescription"
            placeholder="Enter company description"
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.label} htmlFor="candidateInfo">
            Candidate Information
          </label>
          <textarea
            className={classes.input}
            id="candidateInfo"
            placeholder="Enter candidate information"
            value={candidateInfo}
            onChange={(e) => setCandidateInfo(e.target.value)}
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.label} htmlFor="jobDescription">
            Job Description
          </label>
          <textarea
            className={classes.input}
            id="jobDescription"
            placeholder="Enter job description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
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
  const [ setJobData] = useState(null);
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
      const response = await fetch('https://talented-ai-api.vercel.app/api/suggest-candidate', {
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
      setJobText(result.evaluation);
    } catch (error) {
      console.error('Error generating evaluation:', error);
      setError('Failed to generate evaluation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sanitizedText = sanitizeHtml(jobText, {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em'],
    allowedAttributes: {}
  });

  return (
    <div className={classes.container}>
      <Typography variant="h2" align="center" style={{ fontFamily: "Chillax-semibold, sans-serif" }}>
        Recruiter Agent
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
              <div dangerouslySetInnerHTML={{ __html: sanitizedText }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobAssistant;