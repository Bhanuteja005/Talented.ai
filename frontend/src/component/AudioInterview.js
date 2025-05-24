import { Box, Button, CircularProgress, Paper, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Mic, Stop, VolumeUp } from '@material-ui/icons';
import axios from 'axios';
import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Webcam from "webcam-easy";
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
  },
  videoContainer: {
    width: '100%',
    maxWidth: '640px',
    height: '360px',
    margin: '0 auto',
    backgroundColor: '#000',
    overflow: 'hidden',
    borderRadius: '4px',
    position: 'relative',
  },
  videoElement: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  recordingIndicator: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'red',
    animation: '$blink 1s infinite',
  },
  '@keyframes blink': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.4 },
    '100%': { opacity: 1 },
  },
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
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const webcamVideoRef = useRef(null);
  const webcamCanvasRef = useRef(null);
  const webcamInstanceRef = useRef(null);
  const [mediaRecorderReady, setMediaRecorderReady] = useState(false);
  
  const classes = useStyles({ isRecording });

  // Initialize speech recognition with better error handling
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false; // Fix: set to false to avoid duplicate results
    recognitionInstance.interimResults = false; // Fix: only get final results
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event) => {
      // Only take the last final result to avoid duplicates
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      finalTranscript = formatTranscript(finalTranscript);
      setTranscript(finalTranscript.trim());
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
      let errorMessage = 'Speech recognition error';
      if (event.error === 'no-speech') {
        errorMessage = 'No speech was detected. Please try again.';
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Audio capture failed. Please check your microphone.';
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone access was denied. Please allow microphone access.';
      }
      setPopup({
        open: true,
        severity: 'error',
        message: errorMessage
      });
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [setPopup]);

  // Helper function to format transcript with proper capitalization and punctuation
  const formatTranscript = (text) => {
    if (!text || text.trim() === '') return '';
    
    // Basic cleanup
    let formatted = text.trim();
    
    // Capitalize first letter of sentences
    formatted = formatted.replace(/(^\s*\w|[.!?]\s*\w)/g, function(c) { 
      return c.toUpperCase(); 
    });
    
    // Add periods if missing at the end of sentences
    if (!formatted.match(/[.!?]$/)) {
      formatted += '.';
    }
    
    return formatted;
  };

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
        // Change the URL to use your local server
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
        
        console.log("Question API response:", questionResponse.data);
        setQuestion(questionResponse.data);
      } catch (error) {
        console.error('Error generating question:', error.response || error);
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

  // Initialize camera using webcam-easy and set up MediaRecorder
  useEffect(() => {
    let webcam;
    let stream = null;
    let didCancel = false;

    const setupCamera = async () => {
      try {
        // Wait for DOM to render video/canvas elements
        if (!webcamVideoRef.current || !webcamCanvasRef.current) {
          // Try again on next tick if refs are not ready
          setTimeout(setupCamera, 100);
          return;
        }
        webcam = new Webcam(webcamVideoRef.current, "user", webcamCanvasRef.current);
        webcamInstanceRef.current = webcam;
        await webcam.start();
        if (didCancel) {
          webcam.stop();
          return;
        }
        setCameraReady(true);

        // Get the stream from the video element after webcam-easy starts
        stream = webcamVideoRef.current.srcObject;
        if (stream) {
          const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
          mediaRecorderRef.current = recorder;
          setMediaRecorderReady(true);

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              setRecordedChunks(prev => [...prev, event.data]);
            }
          };

          recorder.onerror = (event) => {
            setError("Error recording video: " + event.error);
          };
        } else {
          setMediaRecorderReady(false);
        }
      } catch (err) {
        setError("Camera/Microphone access error: " + err.message + ". Please check your camera permissions and refresh the page.");
        setCameraReady(false);
        setMediaRecorderReady(false);
      }
    };

    setupCamera();

    return () => {
      didCancel = true;
      if (webcamInstanceRef.current) {
        webcamInstanceRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (recognition) recognition.stop();
      setIsRecording(false);
      
      // Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        console.log("Stopping media recorder");
      }

      // Save the answer only if it's not empty
      if (transcript && transcript.trim() !== '') {
        setAnswer(transcript);
        // Evaluate the answer
        evaluateAnswer(transcript);
      } else {
        setPopup({
          open: true,
          severity: 'warning',
          message: 'No speech detected. Please try recording again.'
        });
      }
    } else {
      // Start recording
      setTranscript('');
      setRecordedChunks([]);
      
      // Only start if mediaRecorder is ready
      if (mediaRecorderRef.current && mediaRecorderReady) {
        try {
          mediaRecorderRef.current.start(1000); // Record in 1-second chunks
          console.log("Starting media recorder");
        } catch (e) {
          console.error("Error starting media recorder:", e);
          setPopup({
            open: true,
            severity: 'error',
            message: 'Failed to start video recording. Please refresh the page.'
          });
          return;
        }
      } else {
        setPopup({
          open: true,
          severity: 'error',
          message: 'Video recorder not ready. Please wait for the camera to load before starting recording.'
        });
        return;
      }
      
      // Start speech recognition
      if (recognition) recognition.start();
      
      setIsRecording(true);
    }
  };

  const evaluateAnswer = async (answer) => {
    try {
      setLoading(true);
      
      // Ensure answer is properly formatted and not empty before sending for evaluation
      const formattedAnswer = formatTranscript(answer);
      
      // Check if answer is empty and use a placeholder if it is
      if (!formattedAnswer || formattedAnswer.trim() === '') {
        setPopup({
          open: true,
          severity: 'error',
          message: 'Your answer is empty. Please record an answer before proceeding.'
        });
        setLoading(false);
        return;
      }
      
      console.log("Sending answer for evaluation:", {
        question: question.question,
        expectedAnswer: question.expectedAnswer,
        userAnswer: formattedAnswer
      });
      
      const response = await axios.post(
        `${apiList.evaluateAnswer}`,
        {
          question: question.question,
          expectedAnswer: question.expectedAnswer,
          userAnswer: formattedAnswer
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Evaluation response:", response.data);
      
      // Update feedback and score
      setFeedback(response.data.feedback);
      setScore(response.data.score);

    } catch (error) {
      console.error('Error evaluating answer:', error.response || error);
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
      if (!answer || answer.trim() === '') {
        setPopup({
          open: true,
          severity: 'error',
          message: 'Please provide an answer before completing the interview.'
        });
        return;
      }
      setLoading(true);
      setInterviewComplete(true);

      const formattedAnswer = formatTranscript(answer);

      let videoBlob = null;
      if (recordedChunks.length > 0) {
        videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
      }

      const formData = new FormData();
      formData.append('jobId', jobId);
      formData.append('applicationId', applicationId);
      formData.append('questions', question.question);
      formData.append('answers', formattedAnswer);
      formData.append('scores', score);
      formData.append('overallScore', score);
      if (videoBlob && videoBlob.size > 0) {
        formData.append('video', videoBlob, 'interview.webm');
      }

      try {
        // Fix: Use the correct API endpoint and check for backend errors
        const response = await axios.post(
          apiList.interviewResults,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.data && response.data.success) {
          await axios.put(
            `${apiList.applications}/${applicationId}/interview-complete`,
            { interviewCompleted: true, interviewScore: score },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }
            }
          );
          setPopup({
            open: true,
            severity: "success",
            message: "Interview completed successfully!"
          });
        } else {
          throw new Error(response.data && response.data.message ? response.data.message : "Unknown error");
        }
      } catch (submissionError) {
        // Show backend error message if available
        let msg = 'Error saving interview results. Your progress has been recorded locally.';
        if (submissionError.response && submissionError.response.data && submissionError.response.data.message) {
          msg = submissionError.response.data.message;
        }
        setPopup({
          open: true,
          severity: 'error',
          message: msg
        });
      }
    } catch (error) {
      setPopup({
        open: true,
        severity: 'error',
        message: 'Error completing interview. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const speakQuestion = () => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech first
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance();
      speech.text = question?.question || '';
      speech.lang = 'en-US';
      speech.rate = 1;
      speech.pitch = 1;
      setIsSpeaking(true);
      speech.onend = () => setIsSpeaking(false);
      speech.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(speech);
    } else {
      setPopup({
        open: true,
        severity: 'error',
        message: 'Text-to-speech is not supported in your browser.'
      });
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
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
            <Typography variant="subtitle1" style={{ marginBottom: '10px' }}>
              Camera Preview {isRecording ? '(Recording...)' : '(Ready to record)'}
            </Typography>
            <div className={classes.videoContainer}>
              {/* Webcam Easy video and canvas elements */}
              <video
                ref={webcamVideoRef}
                id="webcam"
                className={classes.videoElement}
                autoPlay
                playsInline
                muted
                width={640}
                height={480}
              />
              <canvas
                ref={webcamCanvasRef}
                id="canvas"
                style={{ display: "none" }}
                width={640}
                height={480}
              />
              {isRecording && <div className={classes.recordingIndicator}></div>}
              {!cameraReady && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <CircularProgress color="secondary" size={40} />
                  <Typography variant="body2" style={{ marginTop: 10 }}>
                    Loading camera...
                  </Typography>
                </div>
              )}
            </div>
            {!cameraReady && (
              <Typography variant="body2" color="error" style={{ marginTop: 10, textAlign: 'center' }}>
                If your camera doesn't appear, please check your browser permissions and make sure your camera is connected.
              </Typography>
            )}
          </Paper>
          <Paper className={classes.questionCard}>
            <Typography className={classes.questionPrompt}>
              {question?.question || 'Loading question...'}
            </Typography>
            <Button 
              startIcon={<VolumeUp />} 
              variant="outlined"
              className={classes.voiceButton}
              onClick={isSpeaking ? stopSpeaking : speakQuestion}
            >
              {isSpeaking ? 'Stop' : 'Listen'}
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
                disabled={loading || !cameraReady}
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