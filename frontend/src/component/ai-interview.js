import { Avatar, CircularProgress, Typography } from '@material-ui/core';
import { createTheme, makeStyles } from '@material-ui/core/styles';
import { Android, Person } from '@material-ui/icons';
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

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

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
    paddingTop: '5vh',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '0 1rem',
    [theme.breakpoints.down('sm')]: {
      height: 'calc(100vh - 100px)',
      paddingTop: '2vh',
      gap: '1rem',
      margin: '0 15px', // Add horizontal margins for small screens
      width: 'calc(100% - 30px)', // Adjust width to account for margins
      maxWidth: 'none',
    },
  },
  contentContainer: {
    display: 'flex',
    gap: '2rem',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      
      gap: '1rem',
      flexDirection: 'column',
    },
  },
  formContainer: {
    width: '100%',
    maxWidth: '500px',
    height: 'auto',
    minHeight: '400px',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    [theme.breakpoints.down('sm')]: {
      maxWidth: '100%',
    },
  },
  innerContainer: {
    margin: '2rem',
    width: 'auto',
    [theme.breakpoints.down('sm')]: {
      margin: '1rem',
    },
  },
  chatContainer: {
    width: '100%',
    height: '600px',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    [theme.breakpoints.down('sm')]: {
      height: 'calc(100vh - 200px)',
    },
  },
  chatMessages: {
    textAlign: 'left',
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    [theme.breakpoints.down('sm')]: {
      padding: '0.5rem',
    },
  },
  messageContent: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '70%',
    [theme.breakpoints.down('sm')]: {
      maxWidth: '80%',
    },
  },
  messageBox: {
    padding: '1rem',
    borderRadius: '0.5rem',
    maxWidth: '100%',
    wordBreak: 'break-word',
    [theme.breakpoints.down('sm')]: {
      padding: '0.75rem',
      fontSize: '0.9rem',
    },
  },
  inputContainer: {
    padding: '1rem',
    borderTop: '1px solid #e2e8f0',
    [theme.breakpoints.down('sm')]: {
      padding: '0.5rem',
    },
  },
  input: {
    width: '95%',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #e2e8f0',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
    },
    [theme.breakpoints.down('sm')]: {
      
      width: '100%',
      padding: '0.5rem',
    },
  },
  scoreContainer: {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    zIndex: 1000,
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.8rem',
      padding: '0.25rem 0.75rem',
    },
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.25rem',
      marginBottom: '1rem',
    },
  },

  button: {
    width: '100%',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '1.5rem',
    '&:hover': {
      backgroundColor: '#2563eb',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
    '&:disabled': {
      backgroundColor: '#93c5fd',
      cursor: 'not-allowed',
    },
},
messageRow: {
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: '1rem',
  gap: '0.5rem',
},

messageRowReverse: {
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: '1rem',
  gap: '0.5rem',
  flexDirection: 'row-reverse',
},

messageContent: {
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '70%',
},

messageAvatar: {
  width: '40px',
  height: '40px',
  backgroundColor: '#e5e7eb',
  '& .MuiSvgIcon-root': {
    width: '24px',
    height: '24px',
  },
},

aiAvatar: {
  backgroundColor: '#3b82f6',
  color: 'white',
},

userAvatar: {
  backgroundColor: '#10b981',
},

messageBox: {
  padding: '1rem',
  borderRadius: '0.5rem',
  maxWidth: '100%',
  wordBreak: 'break-word',
},

aiMessage: {
  backgroundColor: '#f3f4f6',
  borderTopLeftRadius: 0,
},

userMessage: {
  backgroundColor: '#10b981',
  color: 'white',
  borderTopRightRadius: 0,
},
h2: {
  fontSize: '2rem',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
  },
},
}));

const InterviewForm = ({ onStart }) => {
  const classes = useStyles();
  const [jobTitle, setJobTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");

  const handleSubmit = () => {
    onStart({
      jobTitle,
      skills,
      experience,
    });
  };

  return (
    <div className={classes.formContainer}>
      <div className={classes.innerContainer}>
        <div className={classes.title}>AI Interview Assistant</div>
        <div className={classes.formGroup}>
          <label className={classes.label}>Job Title</label>
          <input
            className={classes.input}
            placeholder="e.g. Frontend Developer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.label}>Required Skills</label>
          <textarea
            className={classes.input}
            placeholder="e.g. React, JavaScript, CSS"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>
        <div className={classes.formGroup}>
          <label className={classes.label}>Years of Experience</label>
          <input
            className={classes.input}
            type="number"
            placeholder="e.g. 3"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
        </div>
        <button
          className={classes.button}
          onClick={handleSubmit}
        >
          Start Interview
        </button>
      </div>
    </div>
  );
};

const ChatInterface = ({ messages, onSendMessage, loading }) => {
  const classes = useStyles();
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answer.trim()) {
      onSendMessage(answer);
      setAnswer("");
    }
  };

  return (
    <div className={classes.chatContainer}>
      <div className={classes.chatMessages}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={msg.type === 'ai' ? classes.messageRow : classes.messageRowReverse}
          >
            <Avatar className={`${classes.messageAvatar} ${
              msg.type === 'ai' ? classes.aiAvatar : classes.userAvatar
            }`}>
              {msg.type === 'ai' ? <Android /> : <Person />}
            </Avatar>
            <div className={classes.messageContent}>
              <div
                className={`${classes.messageBox} ${
                  msg.type === 'ai' ? classes.aiMessage : classes.userMessage
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className={classes.messageRow}>
            <Avatar className={`${classes.messageAvatar} ${classes.aiAvatar}`}>
              <Android />
            </Avatar>
            <CircularProgress size={24} />
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className={classes.inputContainer}>
        <input
          className={classes.input}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer..."
        />
      </form>
    </div>
  );
};
function InterviewAssistant() {
    const classes = useStyles();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [score, setScore] = useState(0);
const [totalQuestions] = useState(5); // Total number of questions
const [answeredQuestions, setAnsweredQuestions] = useState(0);

    // Add new state variables
    const [jobDetails, setJobDetails] = useState({
      jobTitle: '',
      skills: '',
      experience: ''
    });
    const [currentQuestionData, setCurrentQuestionData] = useState(null);
    const navigate = useNavigate();
  
    const startInterview = async (data) => {
      setJobDetails(data); // Store job details
      setInterviewStarted(true);
      setMessages([
        {
          type: 'ai',
          content: `Welcome to your interview for ${data.jobTitle} position. Let's begin with the first question.`
        }
      ]);
      // Generate first question using the passed data
      askQuestion(data);
    };
  
    const askQuestion = async (jobData = jobDetails) => {
      setLoading(true);
      try {
        const response = await fetch('https://talented-ai-api.vercel.app/api/get-interview-question', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            jobTitle: jobData.jobTitle,
            skills: jobData.skills,
            experience: jobData.experience,
            currentQuestion 
          }),
        });
        
        const data = await response.json();
        setCurrentQuestionData(data); // Store full question data
        setMessages(prev => [...prev, {
          type: 'ai',
          content: data.question
        }]);
      } catch (error) {
        console.error('Error fetching question:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const handleAnswer = async (answer) => {
      if (!currentQuestionData) return;
    
      setMessages(prev => [...prev, {
        type: 'user',
        content: answer
      }]);
    
      setLoading(true);
      try {
        const response = await fetch('https://talented-ai-api.vercel.app/api/evaluate-answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: currentQuestionData.question,
            expectedAnswer: currentQuestionData.expectedAnswer,
            userAnswer: answer
          }),
        });
        
        const feedback = await response.json();
        
        // Ensure score is a number and add it to total
        const numericScore = parseInt(feedback.score) || 0;
        setScore(prevScore => prevScore + numericScore);
        setAnsweredQuestions(prev => prev + 1);
        
        setMessages(prev => [...prev, {
          type: 'ai',
          content: `${feedback.feedback}\n\nScore for this answer: ${numericScore}/100`
        }]);
    
        if (currentQuestion < totalQuestions - 1) {
          setCurrentQuestion(prev => prev + 1);
          askQuestion();
        } else {
          // Calculate final average score
          const finalScore = Math.round((score + numericScore) / totalQuestions);
          setMessages(prev => [...prev, {
            type: 'ai',
            content: `Interview completed!\n\nFinal Score: ${finalScore}/100\n\nStrengths:\n${feedback.strengths.join('\n')}\n\nAreas for Improvement:\n${feedback.improvements.join('\n')}`
          }]);
        }
      } catch (error) {
        console.error('Error processing answer:', error);
        setMessages(prev => [...prev, {
          type: 'ai',
          content: 'Sorry, there was an error evaluating your answer. Please try again.'
        }]);
      } finally {
        setLoading(false);
      }
    };
    
    
  
    return (
      <div className={classes.container}>
        <Typography variant="h2" align="center" className={classes.h2}>
      Interview Practice Bot
    </Typography>
        {score > 0 && answeredQuestions > 0 && (
      <div className={classes.scoreContainer}>
        Current Score: {Math.round(score / answeredQuestions)}/100
      </div>
    )}
        <div className={classes.contentContainer}>
          {!interviewStarted ? (
            <InterviewForm onStart={startInterview} />
          ) : (
            <ChatInterface
              messages={messages}
              onSendMessage={handleAnswer}
              loading={loading}
            />
          )}
        </div>
      </div>
    );
  }
export default InterviewAssistant;