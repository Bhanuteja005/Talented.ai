import {
    Button,
    Chip,
    Grid,
    Modal,
    Paper,
    Typography,
} from "@material-ui/core";
import axios from "axios";
import { useEffect, useState } from "react";
import apiList from "../../apiList";

const JobTile = (props) => {
  const { job, open, handleClose } = props;
  const [applications, setApplications] = useState([]);
  const [interviewResults, setInterviewResults] = useState([]);
  const [popup, setPopup] = useState({ open: false, severity: "", message: "" });

  useEffect(() => {
    if (open) {
      getApplications();
      fetchInterviewResults();
    }
  }, [open]);

  const getApplications = async () => {
    // Fetch applications logic here
  };

  const fetchInterviewResults = async () => {
    try {
      const response = await axios.get(apiList.interviewResults, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (response.data.success) {
        // Filter results for this specific job
        const jobResults = response.data.results.filter(result => 
          result.jobId._id === job._id
        );
        setInterviewResults(jobResults);
      }
    } catch (error) {
      console.error("Error fetching interview results:", error);
    }
  };

  const getInterviewScore = (applicationId) => {
    const result = interviewResults.find(r => r.applicationId._id === applicationId);
    return result ? result.overallScore : null;
  };

  const downloadInterviewVideo = async (videoFileId, videoFilename) => {
    try {
      const downloadUrl = `${apiList.downloadInterview}/${videoFileId || videoFilename}`;
      console.log("Downloading video from:", downloadUrl);
      
      const response = await axios.get(downloadUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', videoFilename || 'interview_video.webm');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setPopup({
        open: true,
        severity: "success",
        message: "Video downloaded successfully",
      });

    } catch (error) {
      console.error("Video download failed:", error);
      setPopup({
        open: true,
        severity: "error",
        message: "Failed to download video: " + (error.response?.data?.message || error.message),
      });
    }
  };

  const viewInterviewDetails = (applicationId) => {
    const result = interviewResults.find(r => r.applicationId._id === applicationId);
    if (!result) {
      setPopup({
        open: true,
        severity: "info",
        message: "No interview results found for this application."
      });
      return;
    }

    setPopup({
      open: true,
      severity: "info",
      message: (
        <div style={{ maxHeight: '500px', overflowY: 'auto', width: '100%' }}>
          <h3>Interview Results</h3>
          <div style={{ marginBottom: '15px' }}>
            <p><strong>Overall Score:</strong> 
              <span style={{ 
                color: result.overallScore >= 7 ? 'green' : result.overallScore >= 5 ? 'orange' : 'red',
                fontSize: '18px',
                fontWeight: 'bold',
                marginLeft: '10px'
              }}>
                {result.overallScore}/10
              </span>
            </p>
            <p><strong>Questions Asked:</strong> {result.questions.length}</p>
            <p><strong>Completed At:</strong> {new Date(result.completedAt).toLocaleString()}</p>
          </div>
          
          {result.questions.map((question, index) => (
            <div key={index} style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <p style={{ fontWeight: 'bold', color: '#2196F3' }}>
                Question {index + 1}:
              </p>
              <p style={{ marginBottom: '10px' }}>{question}</p>
              
              <p style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                Answer:
              </p>
              <p style={{ marginBottom: '10px', fontStyle: 'italic' }}>
                {result.answers[index] || 'No answer provided'}
              </p>
              
              <p style={{ fontWeight: 'bold' }}>
                Score: 
                <span style={{ 
                  color: (result.scores[index] || 0) >= 7 ? 'green' : 
                         (result.scores[index] || 0) >= 5 ? 'orange' : 'red',
                  marginLeft: '5px'
                }}>
                  {result.scores[index] || 0}/10
                </span>
              </p>
            </div>
          ))}
          
          {(result.videoFileId || result.videoRecording) && (
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              border: '2px solid #2196F3',
              borderRadius: '8px',
              backgroundColor: '#e3f2fd'
            }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                📹 Interview Video Recording Available
              </p>
              <button
                onClick={() => downloadInterviewVideo(result.videoFileId, result.videoRecording)}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Download Video
              </button>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                File: {result.videoRecording}
              </p>
            </div>
          )}
        </div>
      )
    });
  };

  return (
    <Paper className={classes.body} elevation={3}>
      {/* ...existing job details... */}
      
      <Modal open={open} onClose={handleClose} className={classes.popupDialog}>
        <Paper className={classes.popup}>
          <Grid
            container
            item
            xs
            direction="column"
            spacing={3}
            style={{ padding: "30px", width: "50vw" }}
          >
            <Grid item>
              <Typography variant="h4">Applications</Typography>
            </Grid>
            <Grid
              container
              item
              xs
              direction="column"
              style={{ width: "100%", maxHeight: "400px", overflow: "auto" }}
            >
              {applications.length > 0 ? (
                applications.map((obj, index) => {
                  const interviewScore = getInterviewScore(obj._id);
                  
                  return (
                    <Grid
                      item
                      container
                      xs
                      key={obj._id}
                      style={{
                        padding: "15px",
                        margin: "10px 0",
                        border: "2px solid #000",
                        borderRadius: "10px",
                        backgroundColor: "#f5f5f5"
                      }}
                    >
                      {/* ...existing application details... */}
                      
                      {interviewScore !== null && (
                        <Grid item>
                          <Chip
                            label={`Interview Score: ${interviewScore}/10`}
                            variant="outlined"
                            color={interviewScore >= 7 ? "primary" : interviewScore >= 5 ? "default" : "secondary"}
                            onClick={() => viewInterviewDetails(obj._id)}
                            style={{ cursor: "pointer", margin: "5px" }}
                          />
                        </Grid>
                      )}
                      
                      {/* ...existing action buttons... */}
                    </Grid>
                  );
                })
              ) : (
                <Typography variant="h5" style={{ textAlign: "center" }}>
                  No Applications Found
                </Typography>
              )}
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                style={{ padding: "10px 50px" }}
                onClick={() => {
                  handleClose();
                }}
              >
                Close
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Modal>
    </Paper>
  );
};

export default JobTile;