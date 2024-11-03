import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import axios from "axios";
import React, { useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';

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
    height: '660px',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    overflow: 'auto',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  innerContainer: {
    padding: '1.5rem',
  },
  formGroup: {
    marginBottom: '1rem',
    paddingRight: '1rem'
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
    '&:focus': {
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.5)',
    }
  },
  fileInput: {
    marginTop: '0.5rem',
  },
  button: {
    backgroundColor: '#4299e1',
    color: 'white',
    fontWeight: 'bold',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: 'none',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#2b6cb0',
    }
  },
  addButton: {
    backgroundColor: '#48bb78',
    '&:hover': {
      backgroundColor: '#38a169',
    }
  },
  deleteButton: {
    backgroundColor: '#f56565',
    '&:hover': {
      backgroundColor: '#e53e3e',
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
  },
  companyList: {
    marginTop: '1rem',
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

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      headshot: e.target.files[0]
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const componentRef = useRef();
  const navigate = useNavigate();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: resumeData?.fullName ? `${resumeData.fullName}_Resume` : 'Resume',
  });

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'companies') {
          data.append(key, JSON.stringify(formData[key]));
        } else if (key === 'headshot' && formData[key]) {
          data.append(key, formData[key]);
        } else {
          data.append(key, formData[key]);
        }
      });

      const response = await axios.post('https://talented-ai-api.vercel.app/api/resume-create', data);
      setResumeData(response.data);
    } catch (err) {
      console.error('Error creating resume:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.container}>
      <Typography variant="h2" align="center">
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