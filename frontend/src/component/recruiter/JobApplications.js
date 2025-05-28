import {
  Avatar,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  makeStyles,
  Modal,
  Paper,
  Typography,
} from "@material-ui/core";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import FilterListIcon from "@material-ui/icons/FilterList";
import Rating from "@material-ui/lab/Rating";
import axios from "axios";
import { useCallback, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { SetPopupContext } from "../../App";

import apiList, { server } from "../../lib/apiList";

const useStyles = makeStyles((theme) => ({
  body: {
    height: "inherit",
  },

  jobTileOuter: {
    padding: "30px",
    margin: "20px 0",
    boxSizing: "border-box",
    width: "80%",
  },
  button: {
    padding: '5px 15px',
    fontSize: '0.875rem',
    borderRadius: '20px',
    backgroundColor: '#3f51b5',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#303f9f',
    },
  },
  popupDialog: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: theme.spacing(17),
    height: theme.spacing(17),
  },
  statusBlock: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textTransform: "uppercase",
    padding: '10px 20px',
    fontSize: '0.875rem',
    borderRadius: '20px',
    color: '#ffffff',
    '&.shortlisted': {
      backgroundColor: '#3f51b5',
      '&:hover': {
        backgroundColor: '#303f9f',
      },
    },
    '&.rejected': {
      backgroundColor: '#f44336',
      '&:hover': {
        backgroundColor: '#d32f2f',
      },
    },
    '&.accepted': {
      backgroundColor: '#4caf50',
      '&:hover': {
        backgroundColor: '#388e3c',
      },
    },
    '&.cancelled': {
      backgroundColor: '#ff9800',
      '&:hover': {
        backgroundColor: '#f57c00',
      },
    },
    '&.finished': {
      backgroundColor: '#9e9e9e',
      '&:hover': {
        backgroundColor: '#757575',
      },
    },
  },
  smallButton: {
    padding: '5px',
    fontSize: '0.875rem',
    borderRadius: '50%',
    backgroundColor: '#3f51b5',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#303f9f',
    },
  },
}));

const FilterPopup = (props) => {
  const classes = useStyles();
  const { open, handleClose, searchOptions, setSearchOptions, getData } = props;
  return (
    <Modal open={open} onClose={handleClose} className={classes.popupDialog}>
      <Paper
        style={{
          padding: "50px",
          outline: "none",
          minWidth: "50%",
        }}
      >
        <Grid container direction="column" alignItems="center" spacing={3}>
          <Grid container item alignItems="center">
            <Grid item xs={3}>
              Application Status
            </Grid>
            <Grid
              container
              item
              xs={9}
              justify="space-around"
              // alignItems="center"
            >
              <Grid item>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="rejected"
                      checked={searchOptions.status.rejected}
                      onChange={(event) => {
                        setSearchOptions({
                          ...searchOptions,
                          status: {
                            ...searchOptions.status,
                            [event.target.name]: event.target.checked,
                          },
                        });
                      }}
                    />
                  }
                  label="Rejected"
                />
              </Grid>
              <Grid item>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="applied"
                      checked={searchOptions.status.applied}
                      onChange={(event) => {
                        setSearchOptions({
                          ...searchOptions,
                          status: {
                            ...searchOptions.status,
                            [event.target.name]: event.target.checked,
                          },
                        });
                      }}
                    />
                  }
                  label="Applied"
                />
              </Grid>
              <Grid item>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="shortlisted"
                      checked={searchOptions.status.shortlisted}
                      onChange={(event) => {
                        setSearchOptions({
                          ...searchOptions,
                          status: {
                            ...searchOptions.status,
                            [event.target.name]: event.target.checked,
                          },
                        });
                      }}
                    />
                  }
                  label="Shortlisted"
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid container item alignItems="center">
            <Grid item xs={3}>
              Sort
            </Grid>
            <Grid item container direction="row" xs={9}>
              <Grid
                item
                container
                xs={4}
                justify="space-around"
                alignItems="center"
                style={{ border: "1px solid #D1D1D1", borderRadius: "5px" }}
              >
                <Grid item>
                  <Checkbox
                    name="name"
                    checked={searchOptions.sort["jobApplicant.name"].status}
                    onChange={(event) =>
                      setSearchOptions({
                        ...searchOptions,
                        sort: {
                          ...searchOptions.sort,
                          "jobApplicant.name": {
                            ...searchOptions.sort["jobApplicant.name"],
                            status: event.target.checked,
                          },
                        },
                      })
                    }
                    id="name"
                  />
                </Grid>
                <Grid item>
                  <label for="name">
                    <Typography>Name</Typography>
                  </label>
                </Grid>
                <Grid item>
                  <IconButton
                    disabled={!searchOptions.sort["jobApplicant.name"].status}
                    onClick={() => {
                      setSearchOptions({
                        ...searchOptions,
                        sort: {
                          ...searchOptions.sort,
                          "jobApplicant.name": {
                            ...searchOptions.sort["jobApplicant.name"],
                            desc: !searchOptions.sort["jobApplicant.name"].desc,
                          },
                        },
                      });
                    }}
                  >
                    {searchOptions.sort["jobApplicant.name"].desc ? (
                      <ArrowDownwardIcon />
                    ) : (
                      <ArrowUpwardIcon />
                    )}
                  </IconButton>
                </Grid>
              </Grid>
              <Grid
                item
                container
                xs={4}
                justify="space-around"
                alignItems="center"
                style={{ border: "1px solid #D1D1D1", borderRadius: "5px" }}
              >
                <Grid item>
                  <Checkbox
                    name="dateOfApplication"
                    checked={searchOptions.sort.dateOfApplication.status}
                    onChange={(event) =>
                      setSearchOptions({
                        ...searchOptions,
                        sort: {
                          ...searchOptions.sort,
                          dateOfApplication: {
                            ...searchOptions.sort.dateOfApplication,
                            status: event.target.checked,
                          },
                        },
                      })
                    }
                    id="dateOfApplication"
                  />
                </Grid>
                <Grid item>
                  <label for="dateOfApplication">
                    <Typography>Date of Application</Typography>
                  </label>
                </Grid>
                <Grid item>
                  <IconButton
                    disabled={!searchOptions.sort.dateOfApplication.status}
                    onClick={() => {
                      setSearchOptions({
                        ...searchOptions,
                        sort: {
                          ...searchOptions.sort,
                          dateOfApplication: {
                            ...searchOptions.sort.dateOfApplication,
                            desc: !searchOptions.sort.dateOfApplication.desc,
                          },
                        },
                      });
                    }}
                  >
                    {searchOptions.sort.dateOfApplication.desc ? (
                      <ArrowDownwardIcon />
                    ) : (
                      <ArrowUpwardIcon />
                    )}
                  </IconButton>
                </Grid>
              </Grid>
              <Grid
                item
                container
                xs={4}
                justify="space-around"
                alignItems="center"
                style={{ border: "1px solid #D1D1D1", borderRadius: "5px" }}
              >
                <Grid item>
                  <Checkbox
                    name="rating"
                    checked={searchOptions.sort["jobApplicant.rating"].status}
                    onChange={(event) =>
                      setSearchOptions({
                        ...searchOptions,
                        sort: {
                          ...searchOptions.sort,
                          "jobApplicant.rating": {
                            ...searchOptions.sort[["jobApplicant.rating"]],
                            status: event.target.checked,
                          },
                        },
                      })
                    }
                    id="rating"
                  />
                </Grid>
                <Grid item>
                  <label for="rating">
                    <Typography>Rating</Typography>
                  </label>
                </Grid>
                <Grid item>
                  <IconButton
                    disabled={!searchOptions.sort["jobApplicant.rating"].status}
                    onClick={() => {
                      setSearchOptions({
                        ...searchOptions,
                        sort: {
                          ...searchOptions.sort,
                          "jobApplicant.rating": {
                            ...searchOptions.sort["jobApplicant.rating"],
                            desc: !searchOptions.sort["jobApplicant.rating"]
                              .desc,
                          },
                        },
                      });
                    }}
                  >
                    {searchOptions.sort["jobApplicant.rating"].desc ? (
                      <ArrowDownwardIcon />
                    ) : (
                      <ArrowUpwardIcon />
                    )}
                  </IconButton>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <Button
              variant="contained"
              color="primary"
              className={classes.button}
              style={{ padding: "10px 50px" }}
              onClick={() => getData()}
            >
              Apply
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Modal>
  );
};

const ApplicationTile = (props) => {
  const classes = useStyles();
  const { application, getData } = props;
  const setPopup = useContext(SetPopupContext);
  const [open, setOpen] = useState(false);
  const [interviewResult, setInterviewResult] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // --- Suggestion Modal State ---
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");

  const appliedOn = new Date(application.dateOfApplication);

  const handleClose = () => {
    setOpen(false);
  };

  const getResume = () => {
    if (application.jobApplicant.resume && application.jobApplicant.resume !== "") {
      const address = `${server}/api/download/resume/${application.jobApplicant.resume}`;
      console.log(address);
      axios(address, {
        method: "GET",
        responseType: "blob",
      })
        .then((response) => {
          const file = new Blob([response.data], { type: "application/pdf" });
          const fileURL = URL.createObjectURL(file);
          window.open(fileURL);
        })
        .catch((error) => {
          console.log(error);
          setPopup({
            open: true,
            severity: "error",
            message: "Error downloading resume",
          });
        });
    } else {
      setPopup({
        open: true,
        severity: "error",
        message: "No resume found",
      });
    }
  };

  const updateStatus = (status) => {
    const address = `${apiList.applications}/${application._id}`;
    const statusData = {
      status: status,
      dateOfJoining: new Date().toISOString(),
    };
    axios
      .put(address, statusData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        setPopup({
          open: true,
          severity: "success",
          message: response.data.message,
        });
        getData();
      })
      .catch((err) => {
        setPopup({
          open: true,
          severity: "error",
          message: err.response.data.message,
        });
        console.log(err.response);
      });
  };

  const fetchInterviewResults = async (applicationId) => {
    setLoadingResults(true);
    try {
      // First, refresh the application data to get the latest interviewCompleted status
      await getData();
      
      const response = await axios.get(
        `${apiList.applications}/${applicationId}/interview-results`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (response.data.success) {
        setInterviewResult(response.data.result);
        setShowResults(true);
      } else {
        setPopup({
          open: true,
          severity: "warning",
          message: "No interview results found"
        });
      }
    } catch (error) {
      console.error("Error fetching interview results:", error);
      setPopup({
        open: true,
        severity: "error",
        message: "Failed to load interview results"
      });
    } finally {
      setLoadingResults(false);
    }
  };

  // --- Suggestion Handler ---
  const handleOpenSuggestion = async () => {
    setSuggestionOpen(true);
    setSuggestionLoading(true);
    setSuggestionText("");
    try {
      // Compose job and candidate info
      const jobDescription = `Title: ${application.job.title}\nSkills: ${application.job.skillsets?.join(", ")}`;
      // Include SOP and all relevant candidate info
      const candidateInfo = [
        `Name: ${application.jobApplicant.name}`,
        `Skills: ${application.jobApplicant.skills?.join(", ")}`,
        `Education: ${application.jobApplicant.education?.map(e => `${e.institutionName} (${e.startYear}-${e.endYear || "Ongoing"})`).join(", ")}`,
        `SOP: ${application.sop || "Not Provided"}`
      ].join('\n');
      // Optionally add more fields if needed

      const res = await axios.post(
        "/api/suggest-candidate",
        {
          companyDescription: "", // Not available here
          candidateInfo,
          jobDescription
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setSuggestionText(res.data.evaluation || "No suggestion available.");
    } catch (e) {
      setSuggestionText("Failed to fetch suggestion.");
    } finally {
      setSuggestionLoading(false);
    }
  };

  const buttonSet = {
    applied: (
      <>
        <Grid item xs>
          <Button
            className={`${classes.statusBlock} shortlisted`}
            onClick={() => updateStatus("shortlisted")}
          >
            Shortlist
          </Button>
        </Grid>
        <Grid item xs>
          <Button
            className={`${classes.statusBlock} rejected`}
            onClick={() => updateStatus("rejected")}
          >
            Reject
          </Button>
        </Grid>
      </>
    ),
    shortlisted: (
      <>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Button
              className={`${classes.statusBlock} accepted`}
              onClick={() => updateStatus("accepted")}
            >
              Accept
            </Button>
          </Grid>
          {application.interviewCompleted ? (
            <Grid item xs={12}>
              <Button
                className={`${classes.statusBlock}`}
                style={{ backgroundColor: '#6366f1', color: 'white' }}
                onClick={() => fetchInterviewResults(application._id)}
              >
                View Interview Results ({application.interviewScore || 0}/100)
              </Button>
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Button
                className={`${classes.statusBlock}`}
                style={{ backgroundColor: '#9CA3AF', color: 'white' }}
                disabled
              >
                Awaiting Interview
              </Button>
            </Grid>
          )}
          <Grid item xs={12}>
            <Button
              className={`${classes.statusBlock} rejected`}
              onClick={() => updateStatus("rejected")}
            >
              Reject
            </Button>
          </Grid>
        </Grid>
      </>
    ),
    rejected: (
      <>
        <Grid item xs>
          <Paper className={`${classes.statusBlock} rejected`}>
            Rejected
          </Paper>
        </Grid>
      </>
    ),
    accepted: (
      <>
        <Grid item xs>
          <Paper className={`${classes.statusBlock} accepted`}>
            Accepted
          </Paper>
        </Grid>
      </>
    ),
    cancelled: (
      <>
        <Grid item xs>
          <Paper className={`${classes.statusBlock} cancelled`}>
            Cancelled
          </Paper>
        </Grid>
      </>
    ),
    finished: (
      <>
        <Grid item xs>
          <Paper className={`${classes.statusBlock} finished`}>
            Finished
          </Paper>
        </Grid>
      </>
    ),
  };

  return (
    <Paper className={classes.jobTileOuter} elevation={3}>
      <Grid container>
        <Grid
          item
          xs={2}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Avatar
            src={`${server}${application.jobApplicant.profile}`}
            className={classes.avatar}
          />
        </Grid>
        <Grid container item xs={7} spacing={1} direction="column">
          <Grid item>
            <Typography variant="h5">
              {application.jobApplicant.name}
            </Typography>
          </Grid>
          <Grid item>
            <Rating
              value={
                application.jobApplicant.rating !== -1
                  ? application.jobApplicant.rating
                  : null
              }
              readOnly
            />
          </Grid>
          <Grid item>Applied On: {appliedOn.toLocaleDateString()}</Grid>
          <Grid item>
            Education:{" "}
            {application.jobApplicant.education
              .map((edu) => {
                return `${edu.institutionName} (${edu.startYear}-${
                  edu.endYear ? edu.endYear : "Ongoing"
                })`;
              })
              .join(", ")}
          </Grid>
          <Grid item>
            SOP: {application.sop !== "" ? application.sop : "Not Submitted"}
          </Grid>
          <Grid item>
            {application.jobApplicant.skills.map((skill) => (
              <Chip label={skill} style={{ marginRight: "2px" }} />
            ))}
          </Grid>
        </Grid>
        <Grid item container direction="column" xs={3}>
          <Grid item>
            <Button
              variant="contained"
              className={classes.statusBlock}
              color="primary"
              onClick={() => getResume()}
            >
              Download Resume
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              className={classes.statusBlock}
              style={{ background: "#2196F3", color: "#fff", marginTop: 8 }}
              onClick={handleOpenSuggestion}
            >
              Open Suggestion
            </Button>
          </Grid>
          <Grid item container xs>
            {buttonSet[application.status]}
          </Grid>
        </Grid>
      </Grid>
      <Modal open={open} onClose={handleClose} className={classes.popupDialog}>
        <Paper
          style={{
            padding: "20px",
            outline: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minWidth: "30%",
            alignItems: "center",
          }}
        >
          <Button
            variant="contained"
            color="primary"
            style={{ padding: "10px 50px" }}
            // onClick={() => changeRating()}
          >
            Submit
          </Button>
        </Paper>
      </Modal>
      <Modal open={showResults} onClose={() => setShowResults(false)} className={classes.popupDialog}>
        <Paper
          style={{
            padding: "20px",
            outline: "none",
            display: "flex",
            flexDirection: "column",
            minWidth: "60%",
            maxWidth: "800px",
            maxHeight: "80vh",
            overflowY: "auto"
          }}
        >
          <Typography variant="h5" gutterBottom>Interview Results</Typography>
          
          {loadingResults ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
              <CircularProgress />
            </div>
          ) : interviewResult ? (
            <>
              <Typography variant="h6" color="primary" gutterBottom>
                Overall Score: {interviewResult.overallScore}/100
              </Typography>
              
              <Typography variant="subtitle1" style={{ marginTop: '20px', marginBottom: '10px', fontWeight: 'bold' }}>
                Question & Answer Details:
              </Typography>
              
              {interviewResult.questions.map((question, index) => (
                <Paper key={index} style={{ padding: '15px', margin: '10px 0', backgroundColor: '#f5f5f5' }}>
                  <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
                    Question {index + 1}:
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {question}
                  </Typography>
                  
                  <Typography variant="subtitle2" style={{ fontWeight: 'bold' }}>
                    Answer:
                  </Typography>
                  <Typography variant="body2" paragraph style={{ fontStyle: 'italic' }}>
                    {interviewResult.answers[index]}
                  </Typography>
                  
                  <Typography variant="subtitle2">
                    Score: <span style={{ color: '#1E88E5', fontWeight: 'bold' }}>{interviewResult.scores[index]}/100</span>
                  </Typography>
                </Paper>
              ))}
              
              {interviewResult.videoFileId || interviewResult.videoRecording ? (
                <div style={{ margin: '20px 0' }}>
                  <Typography variant="subtitle1" style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                    Interview Recording:
                  </Typography>
                  {/* Video preview (stream from backend) */}
                  <video
                    controls
                    style={{ width: '100%', maxHeight: '320px', backgroundColor: '#000' }}
                  >
                    <source
                      src={
                        interviewResult.videoFileId
                          ? `${server}/api/stream/interview/${interviewResult.videoFileId}`
                          : `${server}/api/stream/interview/${interviewResult.videoRecording}`
                      }
                      type="video/webm"
                    />
                    Your browser does not support the video tag.
                  </video>
                  <div style={{ marginTop: '10px' }}>
                    <a
                      href={
                        interviewResult.videoFileId
                          ? `${server}/api/download/interview/${interviewResult.videoFileId}`
                          : `${server}/api/download/interview/${interviewResult.videoRecording}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#fff",
                        background: "#2196F3",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        textDecoration: "none",
                        fontWeight: "bold"
                      }}
                    >
                      Download Video
                    </a>
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                    File: {interviewResult.videoRecording}
                  </div>
                </div>
              ) : null}
              
              <Typography variant="body2" style={{ marginTop: '15px', color: '#666' }}>
                Interview completed on: {new Date(interviewResult.completedAt).toLocaleString()}
              </Typography>
              
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => setShowResults(false)}
                style={{ marginTop: '20px', alignSelf: 'center' }}
              >
                Close
              </Button>
            </>
          ) : (
            <Typography variant="body1">No interview results found.</Typography>
          )}
        </Paper>
      </Modal>
      {/* Suggestion Modal */}
      <Modal open={suggestionOpen} onClose={() => setSuggestionOpen(false)} className={classes.popupDialog}>
        <Paper
          style={{
            padding: "24px",
            outline: "none",
            display: "flex",
            flexDirection: "column",
            minWidth: "40%",
            maxWidth: "600px",
            maxHeight: "80vh",
            overflowY: "auto",
            alignItems: "center"
          }}
        >
          <Typography variant="h5" gutterBottom>
            Recruiter Agent Suggestion
          </Typography>
          {suggestionLoading ? (
            <div style={{ padding: "30px" }}>
              <CircularProgress />
              <Typography style={{ marginTop: 16 }}>Loading suggestion...</Typography>
            </div>
          ) : (
            <Typography variant="body1" style={{ whiteSpace: "pre-line" }}>
              {suggestionText}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            style={{ marginTop: 24 }}
            onClick={() => setSuggestionOpen(false)}
          >
            Close
          </Button>
        </Paper>
      </Modal>
    </Paper>
  );
};

const JobApplications = (props) => {
  const classes = useStyles();
  const setPopup = useContext(SetPopupContext);
  const [applications, setApplications] = useState([]);
  const { jobId } = useParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOptions, setSearchOptions] = useState({
    status: {
      all: false,
      applied: false,
      shortlisted: false,
    },
    sort: {
      "jobApplicant.name": {
        status: false,
        desc: false,
      },
      dateOfApplication: {
        status: true,
        desc: true,
      },
      "jobApplicant.rating": {
        status: false,
        desc: false,
      },
    },
  });

  const getData = useCallback(() => {
    let searchParams = [];

    if (searchOptions.status.rejected) {
      searchParams = [...searchParams, `status=rejected`];
    }
    if (searchOptions.status.applied) {
      searchParams = [...searchParams, `status=applied`];
    }
    if (searchOptions.status.shortlisted) {
      searchParams = [...searchParams, `status=shortlisted`];
    }

    let asc = [],
      desc = [];

    Object.keys(searchOptions.sort).forEach((obj) => {
      const item = searchOptions.sort[obj];
      if (item.status) {
        if (item.desc) {
          desc = [...desc, `desc=${obj}`];
        } else {
          asc = [...asc, `asc=${obj}`];
        }
      }
    });
    searchParams = [...searchParams, ...asc, ...desc];
    const queryString = searchParams.join("&");
    console.log(queryString);
    let address = `${apiList.applicants}?jobId=${jobId}`;
    if (queryString !== "") {
      address = `${address}&${queryString}`;
    }

    console.log(address);

    axios
      .get(address, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        console.log("Applications data:", response.data);
        setApplications(response.data);
        
        // Force UI refresh to show updated interview status
        setFilterOpen(false);
      })
      .catch((err) => {
        console.log(err.response);
        setApplications([]);
        setPopup({
          open: true,
          severity: "error",
          message: err.response.data.message,
        });
      });
  }, [searchOptions, jobId, setPopup]);

  useEffect(() => {
    getData();
  }, [getData]);
  
  return (
    <>
      <Grid
        container
        item
        direction="column"
        alignItems="center"
        style={{ padding: "30px", minHeight: "93vh" }}
      >
        <Grid item>
          <Typography variant="h2">Applications</Typography>
        </Grid>
        <Grid item>
          <IconButton className={classes.smallButton} onClick={() => setFilterOpen(true)}>
            <FilterListIcon />
          </IconButton>
        </Grid>
        <Grid
          container
          item
          xs
          direction="column"
          style={{ width: "100%" }}
          alignItems="stretch"
          justify="center"
        >
          {applications.length > 0 ? (
            applications.map((obj) => (
              <Grid item>
                {/* {console.log(obj)} */}
                <ApplicationTile application={obj} getData={getData} />
              </Grid>
            ))
          ) : (
            <Typography variant="h5" style={{ textAlign: "center" }}>
              No Applications Found
            </Typography>
          )}
        </Grid>
      </Grid>
      <FilterPopup
        open={filterOpen}
        searchOptions={searchOptions}
        setSearchOptions={setSearchOptions}
        handleClose={() => setFilterOpen(false)}
        getData={() => {
          getData();
          setFilterOpen(false);
        }}
      />
    </>
  );
};

export default JobApplications;