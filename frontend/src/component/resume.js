import { Typography } from '@material-ui/core';
import { createTheme, makeStyles } from '@material-ui/core/styles';
import axios from "axios";
import React, { useRef, useState } from "react";
import { useReactToPrint } from 'react-to-print';

// Create theme instance
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});
const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
    paddingTop: '5vh',
    width: '100%',
    padding: '0 1rem',
    [theme.breakpoints.down('sm')]: {
      
      paddingTop: '2vh',
      gap: '1rem',
    }
  },
  contentContainer: {
    display: 'flex',
    gap: '2rem',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto', // Add this for centering
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      gap: '1rem',
      padding: '0 15px',
      width: '90%', // Add this for small screens
      margin: '0 auto' // Reinforce centering on small screens
    }
  },
  formContainer: {
    width: '500px',
    height: '660px',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    overflow: 'auto',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    [theme.breakpoints.down('sm')]: {
      width: '100%', 
      height: 'auto',
      maxHeight: '500px',
      margin: '0 auto' // Add this for centering on small screens
    }
  },
  innerContainer: {
    padding: '1.5rem',
    [theme.breakpoints.down('sm')]: {
      padding: '1rem',
    }
  },
  formGroup: {
    marginBottom: '1rem',
    paddingRight: '1rem',
    [theme.breakpoints.down('sm')]: {
      paddingRight: '0',
    }
  },
  input: {
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    borderRadius: '0.375rem',
    width: '100%',
    padding: '0.5rem 0.75rem',
    '&:focus': {
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.5)',
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: '14px',
    }
  },
  button: {
    backgroundColor: '#4299e1',
    color: 'white',
    fontWeight: 'bold',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    marginTop: '1rem',
    '&:hover': {
      backgroundColor: '#2b6cb0',
    },
    [theme.breakpoints.down('sm')]: {
      padding: '0.75rem',
    }
  },
  previewContainer: {
    width: '500px',
    height: '600px',
    padding: '2rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    overflowY: 'auto',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      height: 'auto',
      minHeight: '400px',
      padding: '1rem',
    }
  },
  companyList: {
    marginTop: '1rem',
    [theme.breakpoints.down('sm')]: {
      marginTop: '0.5rem',
    }
  },
  title: {
    fontSize: '2rem',
    marginBottom: '2rem',
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.5rem',
      marginBottom: '1rem',
    }
  },
  subtitle: {
    fontSize: '1.25rem',
    [theme.breakpoints.down('sm')]: {
      fontSize: '1rem',
    }
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  }
});

const ResumeForm = ({ onSubmit }) => {
  const classes = useStyles();
  const [formData, setFormData] = useState({
    fullName: '',
    currentPosition: '',
    currentLength: 1,
    currentTechnologies: '',
    headshot: null,
    companies: [{ name: '', position: '' }]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCompany = () => {
    setFormData(prev => ({
      ...prev,
      companies: [...prev.companies, { name: '', position: '' }]
    }));
  };

  const handleRemoveCompany = (index) => {
    setFormData(prev => ({
      ...prev,
      companies: prev.companies.filter((_, i) => i !== index)
    }));
  };

  const handleCompanyChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      companies: prev.companies.map((company, i) => 
        i === index ? { ...company, [field]: value } : company
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className={classes.formContainer}>
      <div className={classes.innerContainer}>
        <Typography variant="h6" gutterBottom>Resume Builder</Typography>
        <form onSubmit={handleSubmit}>
          <div className={classes.formGroup}>
            <label className={classes.label}>Full Name</label>
            <input
              className={classes.input}
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={classes.formGroup}>
            <label className={classes.label}>Current Position</label>
            <input
              className={classes.input}
              name="currentPosition"
              value={formData.currentPosition}
              onChange={handleChange}
              required
            />
          </div>

          <div className={classes.formGroup}>
            <label className={classes.label}>Experience (years)</label>
            <input
              className={classes.input}
              type="number"
              name="currentLength"
              value={formData.currentLength}
              onChange={handleChange}
              required
              min="0"
            />
          </div>

          <div className={classes.formGroup}>
            <label className={classes.label}>Technologies</label>
            <input
              className={classes.input}
              name="currentTechnologies"
              value={formData.currentTechnologies}
              onChange={handleChange}
              required
            />
          </div>

          <div className={classes.companyList}>
            <Typography variant="subtitle1" gutterBottom>Work Experience</Typography>
            {formData.companies.map((company, index) => (
              <div key={index} className={classes.formGroup}>
                <input
                  className={classes.input}
                  placeholder="Company Name"
                  value={company.name}
                  onChange={(e) => handleCompanyChange(index, 'name', e.target.value)}
                  required
                />
                <input
                  className={classes.input}
                  placeholder="Position"
                  value={company.position}
                  onChange={(e) => handleCompanyChange(index, 'position', e.target.value)}
                  required
                  style={{ marginTop: '0.5rem' }}
                />
                <div style={{ marginTop: '0.5rem' }}>
                  {index > 0 && (
                    <button
                      type="button"
                      className={`${classes.button} ${classes.deleteButton}`}
                      onClick={() => handleRemoveCompany(index)}
                    >
                      Remove
                    </button>
                  )}
                  {index === formData.companies.length - 1 && (
                    <button
                      type="button"
                      className={`${classes.button} ${classes.addButton}`}
                      onClick={handleAddCompany}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      Add More
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button type="submit" className={classes.button}>
            Generate Resume
          </button>
        </form>
      </div>
    </div>
  );
};

const ResumePreview = ({ data, componentRef }) => {
  const classes = useStyles();

  if (!data) {
    return (
      <div className={classes.previewContainer}>
        <Typography variant="subtitle1" align="center">
          Fill the form to preview your resume
        </Typography>
      </div>
    );
  }
 
  return (
    <div className={classes.previewContainer} ref={componentRef}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        {data.imageUrl && (
          <img 
            src={data.imageUrl}
            alt={data.fullName}
            style={{ width: '150px', height: '150px', borderRadius: '50%' }}
          />
        )}
        <Typography variant="h4">{data.fullName}</Typography>
        <Typography variant="h6">{data.currentPosition}</Typography>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <Typography variant="h6" gutterBottom>Professional Summary</Typography>
        <Typography>{data.summary}</Typography>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <Typography variant="h6" gutterBottom>Technical Skills</Typography>
        <Typography>{data.currentTechnologies}</Typography>
      </div>

      <div>
        <Typography variant="h6" gutterBottom>Work Experience</Typography>
        {data.companies.map((company, index) => (
          <div key={index} style={{ marginBottom: '1rem' }}>
            <Typography variant="subtitle1">{company.name}</Typography>
            <Typography variant="body2">{company.position}</Typography>
          </div>
        ))}
      </div>
    </div>
  );
};

function ResumeBuilder() {
  const classes = useStyles();
  const [resumeData, setResumeData] = useState(null);
  const [ setLoading] = useState(false);
  const [error, setError] = useState(null);
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: resumeData?.fullName ? `${resumeData.fullName}_Resume` : 'Resume',
  });

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
  
    try {
      const requestData = {
        fullName: formData.fullName.trim(),
        currentPosition: formData.currentPosition.trim(),
        currentLength: Number(formData.currentLength),
        currentTechnologies: formData.currentTechnologies.trim(),
        companies: formData.companies.map(company => ({
          name: company.name.trim(),
          position: company.position.trim()
        }))
      };
  
      const API_URL = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:4444'
        : 'https://talented-ai-api.vercel.app';
  
      const response = await axios.post(
        `${API_URL}/api/resume-create`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000,
          validateStatus: status => status < 500
        }
      );
  
      if (response.status === 400) {
        throw new Error(response.data.error || 'Invalid form data');
      }
  
      if (!response.data || response.data.error) {
        throw new Error(response.data?.error || 'Failed to create resume');
      }
  
      setResumeData(response.data);
    } catch (err) {
      console.error('Resume creation error:', err);
      setError(err.response?.data?.error || err.message || 'Server error occurred');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={classes.container}>
      <Typography variant="h2" align="center" className={classes.title}>
      Resume Builder
      </Typography>
      {error && (
        <Typography color="error" align="center">
          {error}
        </Typography>
      )}
      <div className={classes.contentContainer}>
        <ResumeForm onSubmit={handleSubmit} />
        <ResumePreview data={resumeData} componentRef={componentRef} />
      </div>
      {resumeData && (
        <button
          onClick={handlePrint}
          className={classes.button}
          style={{ marginTop: '1rem' }}
        >
          Print Resume
        </button>
      )}
    </div>
  );
}

export default ResumeBuilder;