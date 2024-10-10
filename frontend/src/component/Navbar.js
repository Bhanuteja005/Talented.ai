import {
  AppBar,
  Button,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { motion, useAnimation } from "framer-motion";
import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import styled from "styled-components";
import { useAnimations } from "../Hooks/useAnimations";
import isAuth, { userType } from "../lib/isAuth";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

const StyledAppBar = styled(AppBar)`
  background: white !important;
  box-shadow: none !important;
`;

const StyledButton = styled(motion(Button))`
  font-family: Chillax, sans-serif !important;
  color: black !important;
  position: relative;
  &:after {
    content: '';
    position: absolute;
    width: 0;
    height: 2px;
    bottom: -2px;
    left: 0;
    background-color: black;
    transition: width 0.3s ease-in-out;
  }
  &:hover:after {
    width: 100%;
  }
`;

const Navbar = (props) => {
  const classes = useStyles();
  let history = useHistory();
  const controls = useAnimation();
  const { staggerChildrenAnimation } = useAnimations();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (location) => {
    console.log(location);
    history.push(location);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    controls.start("show");
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: -20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <StyledAppBar position="fixed" onMouseEnter={handleMouseEnter}>
      <Toolbar>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Typography variant="h6" className={classes.title} style={{ fontFamily: 'Chillax, sans-serif', color: 'black' }}>
            Talented.ai
          </Typography>
        </Link>
        <div style={{ marginLeft: 'auto', display: 'flex' }}>
          <motion.div initial="hidden" animate={controls} variants={buttonVariants} style={{ display: 'flex' }}>
            {isAuth() ? (
              userType() === "recruiter" ? (
                <>
                  <StyledButton variants={buttonVariants} onClick={() => handleClick("/home")}>
                    Home
                  </StyledButton>
                  <StyledButton variants={buttonVariants} onClick={() => handleClick("/addjob")}>
                    Add Jobs
                  </StyledButton>
                  <StyledButton variants={buttonVariants} onClick={() => handleClick("/myjobs")}>
                    My Jobs
                  </StyledButton>
                  <StyledButton variants={buttonVariants} onClick={() => handleClick("/employees")}>
                    Employees
                  </StyledButton>
                  <StyledButton variants={buttonVariants} onClick={() => handleClick("/profile")}>
                    Profile
                  </StyledButton>
                  <StyledButton variants={buttonVariants} onClick={() => handleClick("/logout")}>
                    Logout
                  </StyledButton>
                </>
              ) : (
                <>
                  <StyledButton variants={buttonVariants} onClick={() => handleClick("/home")}>
                    Home
                  </StyledButton>
                  <StyledButton variants={buttonVariants} onClick={() => handleClick("/applications")}>
                    Applications
                  </StyledButton>
                  <StyledButton variants={buttonVariants} onClick={() => handleClick("/profile")}>
                    Profile
                  </StyledButton>
                  <StyledButton variants={buttonVariants} onClick={() => handleClick("/candidate")}>
                    Candidate
                  </StyledButton>
                  <StyledButton variants={buttonVariants} onClick={() => handleClick("/logout")}>
                    Logout
                  </StyledButton>
                </>
              )
            ) : (
              <>
                <StyledButton variants={buttonVariants} onClick={() => handleClick("/login")}>
                  Login
                </StyledButton>
                <StyledButton variants={buttonVariants} onClick={() => handleClick("/signup")}>
                  Signup
                </StyledButton>
              </>
            )}
          </motion.div>
        </div>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Navbar;