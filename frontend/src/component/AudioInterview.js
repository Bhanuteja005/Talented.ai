import { Box, Button, CircularProgress, Paper, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Mic, Stop, VolumeUp } from '@material-ui/icons';
import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SetPopupContext } from '../App';
import apiList from '../lib/apiList';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(4),
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    marginBottom: theme.spacing(4),
    textAlign: 'center',
  },
  questionCard: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(4),
  },
  answerArea: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(4),
    backgroundColor: '#f5f7fa',
  },
  transcript: {
    minHeight: '100px',
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(3),
  },
  recordButton: {
    backgroundColor: props => props.isRecording ? '#f44336' : '#4caf50',
    color: 'white',
    '&:hover': {
      backgroundColor: props => props.isRecording ? '#d32f2f' : '#388e3c',
    },
  },
  progress: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  feedbackCard: {
    padding: theme.spacing(3),
    marginTop: theme.spacing(2),
    backgroundColor: '#e8f5e9',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '300px',
    flexDirection: 'column',
  },
  navigationButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(4),
  },
  summary: {
    padding: theme.spacing(3),
    marginTop: theme.spacing(4),
    backgroundColor: '#e3f2fd',
  },
  questionNumber: {
    fontWeight: 'bold', 
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: theme.spacing(1),
  },
  questionPrompt: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(2),
  },
  voiceButton: {
    marginLeft: theme.spacing(2),
  }
}));

const AudioInterview = () => {
  const { jobId, applicationId } = useParams();
  const navigate = useNavigate();
  const setPopup = useContext(SetPopupContext);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [jobDetails, setJobDetails] = useState(null);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState(null);
  
  const classes = useStyles({ isRecording });

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
      }
      setTranscript(currentTranscript);
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
      setPopup({
        open: true,
        severity: 'error',
        message: `Speech recognition error: ${event.error}`
      });
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [setPopup]);

  // Fetch job details and generate a single question
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        console.log(`Fetching job with ID: ${jobId}`);
        
        // First, fetch the job details
        const jobResponse = await axios.get(`${apiList.jobs}/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setJobDetails(jobResponse.data);
        console.log("Job details:", jobResponse.data);
        
        // Generate a single question
        await generateQuestion(jobResponse.data);
      } catch (error) {
        console.error('Error fetching details:', error);
        setError('Failed to load job details. Please try again.');
        setPopup({
          open: true,
          severity: 'error',
          message: 'Failed to load interview details. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, applicationId, navigate, setPopup]);

  const generateQuestion = async (jobData) => {
    try {
      const token = localStorage.getItem('token');
      
      try {
        const questionResponse = await axios.post(
          'https://talented-ai-api.vercel.app/api/get-interview-question',
          {
            jobTitle: jobData.title,
            skills: jobData.skillsets.join(', '),
            experience: 2, // Default to mid-level
            currentQuestion: 0
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        setQuestion(questionResponse.data);
      } catch (error) {
        console.error('Error generating question:', error);
        // Create a fallback question if API fails
        setQuestion({
          question: `Please explain your experience with ${jobData.skillsets[0] || 'this technology'}`,
          expectedAnswer: 'A thorough explanation of relevant experience and technical knowledge',
          difficulty: 'intermediate'
        });
      }
    } catch (error) {
      console.error('Error generating question:', error);
      throw error;
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);

      // Save the answer
      setAnswer(transcript);

      // Evaluate the answer
      evaluateAnswer(transcript);
    } else {
      setTranscript('');
      recognition.start();
      setIsRecording(true);
    }
  };

  const evaluateAnswer = async (answer) => {
    try {
      setLoading(true);
      
      const response = await axios.post(
        'https://talented-ai-api.vercel.app/api/evaluate-answer',
        {
          question: question.question,
          expectedAnswer: question.expectedAnswer,
          userAnswer: answer
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Update feedback and score
      setFeedback(response.data.feedback);
      setScore(response.data.score);

    } catch (error) {
      console.error('Error evaluating answer:', error);
      setPopup({
        open: true,
        severity: 'error',
        message: 'Failed to evaluate your answer. Please try again.'
      });

      // Set default feedback
      setFeedback("We couldn't evaluate this answer automatically. Please review it yourself.");
    } finally {
      setLoading(false);
    }
  };

  const completeInterview = async () => {
    try {
      setLoading(true);
      setInterviewComplete(true);

      // Save the interview results to the backend
      if (applicationId) {
        await axios.post(
          'https://talented-ai-api.vercel.app/api/interview-results',
          {
            jobId,
            applicationId,
            questions: [question.question],
            answers: [answer],
            scores: [score],
            overallScore: score
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
    } catch (error) {
      console.error('Error completing interview:', error);
      setPopup({
        open: true,
        severity: 'error',
        message: 'Error saving interview results. Your progress has been recorded locally.'
      });
    } finally {
      setLoading(false);
    }
  };

  const speakQuestion = () => {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance();
      speech.text = question?.question || '';
      speech.lang = 'en-US';
      speech.rate = 1;
      speech.pitch = 1;
      window.speechSynthesis.speak(speech);
    } else {
      setPopup({
        open: true,
        severity: 'error',
        message: 'Text-to-speech is not supported in your browser.'
      });
    }
  };

  if (loading && !question) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress />
        <Typography variant="h6" style={{ marginTop: 20 }}>Loading your interview question...</Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.root}>
        <Paper className={classes.questionCard}>
          <Typography variant="h5" color="error">{error}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate(-1)}
            style={{ marginTop: 20 }}
          >
            Go Back
          </Button>
        </Paper>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <Typography variant="h4" className={classes.title}>
        {jobDetails?.title ? `Interview: ${jobDetails.title}` : 'Technical Interview'}
      </Typography>

      {!interviewComplete ? (
        <>
          <Paper className={classes.questionCard}>
            <Typography className={classes.questionPrompt}>
              {question?.question || 'Loading question...'}
            </Typography>
            <Button 
              startIcon={<VolumeUp />} 
              variant="outlined"
              className={classes.voiceButton}
              onClick={speakQuestion}
            >
              Listen
            </Button>
          </Paper>

          <Paper className={classes.answerArea}>
            <Typography variant="h6">Your Answer</Typography>
            <Box className={classes.transcript}>
              {transcript || 'Your answer will appear here as you speak...'}
            </Box>
            <div className={classes.buttonContainer}>
              <Button
                variant="contained"
                className={classes.recordButton}
                startIcon={isRecording ? <Stop /> : <Mic />}
                onClick={toggleRecording}
                disabled={loading}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
            </div>
          </Paper>

          {feedback && (
            <Paper className={classes.feedbackCard}>
              <Typography variant="h6">Feedback</Typography>
              <Typography variant="body1">{feedback}</Typography>
              <Typography variant="h6" style={{ marginTop: 16 }}>Score: {score}/100</Typography>
            </Paper>
          )}

          <div className={classes.navigationButtons} style={{ justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={completeInterview}
              disabled={loading || !answer}
            >
              Complete Interview
            </Button>
          </div>
        </>
      ) : (
        <Paper className={classes.summary}>
          <Typography variant="h5" gutterBottom>Interview Complete</Typography>
          <Typography variant="h6" gutterBottom>Your Score: {score}/100</Typography>
          
          <Typography variant="h6" style={{ marginTop: 20 }}>Question Summary:</Typography>
          <Paper style={{ padding: 16, margin: '12px 0' }}>
            <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>Question: {question.question}</Typography>
            <Typography variant="body2" style={{ marginTop: 8 }}>Your Answer: {answer}</Typography>
            <Typography variant="body2" style={{ marginTop: 8 }}>Score: {score}/100</Typography>
          </Paper>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate(-1)}
            style={{ marginTop: 20 }}
          >
            Return to Applications
          </Button>
        </Paper>
      )}
    </div>
  );
};

export default AudioInterview;
