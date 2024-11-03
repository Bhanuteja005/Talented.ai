import { Grid, makeStyles } from "@material-ui/core";
import { createContext, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Applications from "./component/Applications";
import { Footer } from "./component/Footer";
import Home from "./component/Home";
import Login from "./component/Login";
import Logout from "./component/Logout";
import Navbar from "./component/Navbar";
import Profile from "./component/Profile";
import Signup from "./component/Signup";
import Welcome, { ErrorPage } from "./component/Welcome";
import JobAssistant from "./component/agent";
import InterviewAssistant from "./component/ai-interview";
import AcceptedApplicants from "./component/recruiter/AcceptedApplicants";
import CreateJobs from "./component/recruiter/CreateJobs";
import JobApplications from "./component/recruiter/JobApplications";
import MyJobs from "./component/recruiter/MyJobs";
import RecruiterProfile from "./component/recruiter/Profile";
import JobAssistantRecruiter from "./component/recruteragent"; // Corrected import
import ResumeBuilder from "./component/resume";
import MessagePopup from "./lib/MessagePopup";
import { userType } from "./lib/isAuth";
const useStyles = makeStyles((theme) => ({
  body: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "98vh",
    paddingTop: "64px",
    boxSizing: "border-box",
    width: "100%",
  },
}));

export const SetPopupContext = createContext();

function App() {
  const classes = useStyles();
  const [popup, setPopup] = useState({
    open: false,
    severity: "",
    message: "",
  });

  return (
    <BrowserRouter>
      <SetPopupContext.Provider value={setPopup}>
        <Grid container direction="column">
          <Grid item xs>
            <Navbar />
          </Grid>
          <Grid item className={classes.body}>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/home" element={<Home />} />
              <Route path="/applications" element={<Applications />} />
              <Route 
                path="/profile" 
                element={userType() === "recruiter" ? <RecruiterProfile /> : <Profile />} 
              />
              <Route path="/addjob" element={<CreateJobs />} />
              <Route path="/myjobs" element={<MyJobs />} />
              <Route path="/job/applications/:jobId" element={<JobApplications />} />
              <Route path="/employees" element={<AcceptedApplicants />} />
              <Route path="/candidate" element={<JobAssistant />} />
              <Route path="/ai-interview" element={<InterviewAssistant />} />
              <Route path="/resume" element={<ResumeBuilder />} />
              <Route path="/recruiter" element={<JobAssistantRecruiter />} />
              <Route path="*" element={<ErrorPage />} />
            </Routes>
          </Grid>
          <Grid item xs>
            <Footer />
          </Grid>
        </Grid>
        <MessagePopup
          open={popup.open}
          setOpen={(status) =>
            setPopup({
              ...popup,
              open: status,
            })
          }
          severity={popup.severity}
          message={popup.message}
        />
      </SetPopupContext.Provider>
    </BrowserRouter>
  );
}

export default App;