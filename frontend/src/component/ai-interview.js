import { Avatar, CircularProgress, LinearProgress, Typography } from '@material-ui/core';
import { createTheme, makeStyles } from '@material-ui/core/styles';
import { Android, Person } from '@material-ui/icons';
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
    justifyContent: 'center', // Center content
    transition: 'all 0.3s ease', // Smooth transition
    flexDirection: 'column', // Always column layout for better transitions
    alignItems: 'center', // Center align items
    [theme.breakpoints.down('sm')]: {
      gap: '1rem',
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
    transition: 'all 0.3s ease',
    opacity: 1,
    visibility: 'visible',
    [theme.breakpoints.down('sm')]: {
      height: 'calc(100vh - 200px)',
    },
    '&.hidden': {
      opacity: 0,
      visibility: 'hidden',
      height: 0,
      margin: 0,
      padding: 0,
    }
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
progressContainer: {
  width: '100%', // Full width
  maxWidth: '800px', // Increased max width for better display
  padding: '2rem',
  backgroundColor: '#fff',
  borderRadius: '0.5rem',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.5s ease',
  opacity: 0,
  visibility: 'hidden',
  height: 0,
  marginTop: 0,
  overflow: 'hidden',
  '&.visible': {
    opacity: 1,
    visibility: 'visible',
    height: 'auto',
    marginTop: '2rem',
  },
  [theme.breakpoints.down('sm')]: {
    padding: '1rem',
  }
},
questionProgress: {
  marginBottom: '1.5rem',
},
progressLabel: {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '0.5rem',
  fontSize: '0.875rem',
  color: '#4a5568',
},
chartContainer: {
  width: '100%',
  height: '300px',
  marginTop: '2rem',
},
summaryStats: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '1rem',
  marginTop: '2rem',
},
statCard: {
  padding: '1rem',
  backgroundColor: '#f8fafc',
  borderRadius: '0.5rem',
  textAlign: 'center',
},
statValue: {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#2563eb',
},
statLabel: {
  fontSize: '0.875rem',
  color: '#4a5568',
},
}));
const ProgressSummary = ({ questions, scores, answeredQuestions, totalQuestions }) => {
  const classes = useStyles();

  const chartData = questions.map((question, index) => ({
    name: `Q${index + 1}`,
    score: scores[index] || 0,
  }));

  const averageScore = Math.round(
    scores.reduce((acc, score) => acc + score, 0) / scores.length
  );

  const strengthAreas = scores.filter(score => score >= 70).length;
  const improvementAreas = scores.filter(score => score < 70).length;

  return (
<div className={`${classes.progressContainer} ${answeredQuestions === totalQuestions ? 'visible' : ''}`}>
        <Typography variant="h6" gutterBottom>
        Assessment Progress Summary
      </Typography>

      <div className={classes.summaryStats}>
        <div className={classes.statCard}>
          <div className={classes.statValue}>{averageScore}%</div>
          <div className={classes.statLabel}>Average Score</div>
        </div>
        <div className={classes.statCard}>
          <div className={classes.statValue}>{strengthAreas}</div>
          <div className={classes.statLabel}>Strong Areas</div>
        </div>
        <div className={classes.statCard}>
          <div className={classes.statValue}>{improvementAreas}</div>
          <div className={classes.statLabel}>Areas to Improve</div>
        </div>
      </div>

      {questions.map((question, index) => (
        <div key={index} className={classes.questionProgress}>
          <div className={classes.progressLabel}>
            <span>Question {index + 1}</span>
            <span>{scores[index]}%</span>
          </div>
          <LinearProgress
            variant="determinate"
            value={scores[index]}
            color={scores[index] >= 70 ? "primary" : "secondary"}
          />
        </div>
      ))}

      <div className={classes.chartContainer}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar
              dataKey="score"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// SkillAssessmentForm Component
const SkillAssessmentForm = ({ onStart }) => {
  const classes = useStyles();
  const [formData, setFormData] = useState({
    skillName: '',
    skillLevel: 'beginner',
    exerciseType: 'coding',
    focusArea: '',
    questionCount: 5
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const skillOptions = [
    { value: 'javascript', label: 'JavaScript', areas: ['Frontend', 'Backend', 'Algorithms'] },
    { value: 'python', label: 'Python', areas: ['Data Science', 'Backend', 'Automation'] },
    { value: 'react', label: 'React', areas: ['Components', 'Hooks', 'State Management'] },
    { value: 'algorithms', label: 'Algorithms', areas: ['Sorting', 'Searching', 'Dynamic Programming'] }
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const requestBody = {
        jobTitle: formData.skillName,
        skills: formData.focusArea,
        experience: formData.skillLevel === 'beginner' ? 0 : 
                   formData.skillLevel === 'intermediate' ? 3 : 5,
        currentQuestion: 0,
        exerciseType: formData.exerciseType
      };
  
      const response = await fetch('https://talented-ai-api.vercel.app/api/get-interview-question', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      
      if (!data.question) {
        throw new Error('Invalid question format received');
      }
  
      onStart({
        ...formData,
        initialQuestion: data
      });
    } catch (error) {
      console.error('Error starting assessment:', error);
      setErrors({ 
        submit: 'Failed to start assessment. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.formContainer}>
      <div className={classes.innerContainer}>
        <div className={classes.title}>Interactive Skill Assessment</div>
        
        <div className={classes.formGroup}>
          <label className={classes.label}>Select Skill</label>
          <select
            className={classes.input}
            value={formData.skillName}
            onChange={(e) => {
              const skill = skillOptions.find(s => s.value === e.target.value);
              setFormData({
                ...formData,
                skillName: e.target.value,
                focusArea: skill?.areas[0] || ''
              });
            }}
          >
            <option value="">Select a skill...</option>
            {skillOptions.map(skill => (
              <option key={skill.value} value={skill.value}>
                {skill.label}
              </option>
            ))}
          </select>
        </div>

        {formData.skillName && (
          <div className={classes.formGroup}>
            <label className={classes.label}>Focus Area</label>
            <select
              className={classes.input}
              value={formData.focusArea}
              onChange={(e) => setFormData({...formData, focusArea: e.target.value})}
            >
              {skillOptions
                .find(s => s.value === formData.skillName)
                ?.areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
            </select>
          </div>
        )}

        <div className={classes.formGroup}>
          <label className={classes.label}>Skill Level</label>
          <select
            className={classes.input}
            value={formData.skillLevel}
            onChange={(e) => setFormData({...formData, skillLevel: e.target.value})}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>Exercise Type</label>
          <select
            className={classes.input}
            value={formData.exerciseType}
            onChange={(e) => setFormData({...formData, exerciseType: e.target.value})}
          >
            <option value="coding">Interactive Coding</option>
            <option value="concept">Concept Practice</option>
            <option value="debugging">Debug Challenge</option>
          </select>
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>Number of Questions</label>
          <select
            className={classes.input}
            value={formData.questionCount}
            onChange={(e) => setFormData({...formData, questionCount: Number(e.target.value)})}
          >
            <option value="1">1 Question</option>
            <option value="3">3 Questions</option>
            <option value="5">5 Questions</option>
            <option value="7">7 Questions</option>
            <option value="10">10 Questions</option>
          </select>
        </div>

        {errors.submit && (
          <div className={classes.error}>{errors.submit}</div>
        )}

        <button
          className={classes.button}
          onClick={handleSubmit}
          disabled={loading || !formData.skillName}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Start Learning'}
        </button>
      </div>
    </div>
  );
};

const ChatInterface = ({ messages, onSendMessage, loading, answeredQuestions, totalQuestions }) => {
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
<div className={`${classes.chatContainer} ${answeredQuestions === totalQuestions ? 'hidden' : ''}`}>      <div className={classes.chatMessages}>
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
function SkillAssessmentBot() {
  const classes = useStyles();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5); // Default value, will be overridden
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [questionHistory, setQuestionHistory] = useState([]);
  const [scoreHistory, setScoreHistory] = useState([]);

  // Update state variable names
  const [skillDetails, setSkillDetails] = useState({
    skillName: '',
    skillLevel: '',
    focusArea: '',
    questionCount: 5
  });

  const [currentQuestionData, setCurrentQuestionData] = useState(null);
  const navigate = useNavigate();
  const fetchWithRetry = async (url, options, maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          credentials: 'include',
          headers: {
            ...options.headers,
            'Accept': 'application/json',
          }
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
  
        return data;
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  };
    const startAssessment = async (data) => {
      setSkillDetails(data);
      setAssessmentStarted(true);
      setTotalQuestions(data.questionCount); // Set the total questions based on user selection
      setMessages([
        {
          type: 'ai',
          content: `Welcome to your ${data.skillName} skill assessment. I'll ask you ${data.questionCount} questions to evaluate your knowledge. Let's begin with the first question.`
        }
      ]);
      askQuestion(data);
    };
  
    const askQuestion = async (data = skillDetails) => {
      setLoading(true);
      try {
        const requestBody = {
          jobTitle: data.skillName,
          skills: data.focusArea,
          experience: data.skillLevel === 'beginner' ? 0 : 
                     data.skillLevel === 'intermediate' ? 3 : 5,
          currentQuestion: currentQuestion,
          exerciseType: data.exerciseType
        };
    
        const response = await fetchWithRetry(
          'https://talented-ai-api.vercel.app/api/get-interview-question',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          }
        );
    
        if (response.error) {
          throw new Error(response.error);
        }
    
        setCurrentQuestionData(response);
        setMessages(prev => [...prev, {
          type: 'ai',
          content: response.question
        }]);
      } catch (error) {
        console.error('Error fetching question:', error);
        const fallbackQuestion = {
          question: `Tell me about your experience with ${data.skillName}?`,
          expectedAnswer: "The answer should demonstrate practical experience and technical knowledge.",
          difficulty: data.skillLevel
        };
        setCurrentQuestionData(fallbackQuestion);
        setMessages(prev => [...prev, {
          type: 'ai',
          content: fallbackQuestion.question
        }]);
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
    const numericScore = parseInt(feedback.score) || 0;
    
    // Update history
    setQuestionHistory(prev => [...prev, currentQuestionData.question]);
    setScoreHistory(prev => [...prev, numericScore]);
    
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
      const finalScore = Math.round((score + numericScore) / totalQuestions);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: `Assessment completed! You've answered all ${totalQuestions} questions.\n\nFinal Score: ${finalScore}/100`
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
      Skill Assessment Bot
    </Typography>
    {score > 0 && answeredQuestions > 0 && (
      <div className={classes.scoreContainer}>
        Current Score: {Math.round(score / answeredQuestions)}/100
      </div>
    )}
    <div className={classes.contentContainer}>
      {!assessmentStarted ? (
        <SkillAssessmentForm onStart={startAssessment} />
      ) : (
        <>
          <ChatInterface
            messages={messages}
            onSendMessage={handleAnswer}
            loading={loading}
            answeredQuestions={answeredQuestions}
  totalQuestions={totalQuestions}
          />
          <ProgressSummary 
            questions={questionHistory}
            scores={scoreHistory}
            answeredQuestions={answeredQuestions}
  totalQuestions={totalQuestions}
          />
        </>
      )}
    </div>
  </div>
);
}
  export default SkillAssessmentBot;