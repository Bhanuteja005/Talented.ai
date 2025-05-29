import {
  AppBar,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import AddIcon from "@material-ui/icons/Add";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import HomeIcon from "@material-ui/icons/Home";
import LockOpenIcon from "@material-ui/icons/LockOpen";
import MenuIcon from "@material-ui/icons/Menu";
import PeopleIcon from "@material-ui/icons/People";
import PersonIcon from "@material-ui/icons/Person";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import WorkIcon from "@material-ui/icons/Work";
import { motion, useAnimation } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import isAuth, { userType } from "../lib/isAuth";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginLeft: 'auto', // Move menu icon to right
    color: 'black', // Make icon visible
  },
  title: {
    flexGrow: 1,
    color: 'black',
  },
  drawer: {
    width: 240, // Fixed width for drawer
  },
  listItem: {
    padding: theme.spacing(2),
  },
  listItemIcon: {
    minWidth: 40,
    color: 'black',
  },
  listItemText: {
    marginLeft: theme.spacing(1),
    color: 'black',
  }
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
  const navigate = useNavigate();
  const controls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleClick = (location) => {
    console.log(location);
    navigate(location);
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

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const renderButtons = () => {
    const buttons = [];

    if (isAuth()) {
      if (userType() === "recruiter") {
        buttons.push(
          <StyledButton key="home" variants={buttonVariants} onClick={() => handleClick("/home")}>
            Home
          </StyledButton>,
          <StyledButton key="addjob" variants={buttonVariants} onClick={() => handleClick("/addjob")}>
            Add Jobs
          </StyledButton>,
          <StyledButton key="myjobs" variants={buttonVariants} onClick={() => handleClick("/myjobs")}>
            My Jobs
          </StyledButton>,
          <StyledButton key="employees" variants={buttonVariants} onClick={() => handleClick("/employees")}>
            Employees
          </StyledButton>,
          /*<StyledButton key="recruiter" variants={buttonVariants} onClick={() => handleClick("/recruiter")}>
            Agent
          </StyledButton>,*/
          <StyledButton key="profile" variants={buttonVariants} onClick={() => handleClick("/profile")}>
            Profile
          </StyledButton>,
          <StyledButton key="logout" variants={buttonVariants} onClick={() => handleClick("/logout")}>
            Logout
          </StyledButton>
        );
      } else {
        buttons.push(
          <StyledButton key="home" variants={buttonVariants} onClick={() => handleClick("/home")}>
            Home
          </StyledButton>,
          <StyledButton key="applications" variants={buttonVariants} onClick={() => handleClick("/applications")}>
            Applications
          </StyledButton>,
          <StyledButton key="profile" variants={buttonVariants} onClick={() => handleClick("/profile")}>
            Profile
          </StyledButton>,
          /*<StyledButton key="ai-interview" variants={buttonVariants} onClick={() => handleClick("/ai-interview")}>
            Skill Assessment
          </StyledButton>,*/
          
          <StyledButton key="candidate" variants={buttonVariants} onClick={() => handleClick("/candidate")}>
            Learning Agent
          </StyledButton>,
          <StyledButton key="logout" variants={buttonVariants} onClick={() => handleClick("/logout")}>
            Logout
          </StyledButton>
        );
      }
    } else {
      buttons.push(
        <StyledButton key="login" variants={buttonVariants} onClick={() => handleClick("/login")}>
          Login
        </StyledButton>,
        <StyledButton key="signup" variants={buttonVariants} onClick={() => handleClick("/signup")}>
          Signup
        </StyledButton>
      );
    }

    return buttons;
  };

  const renderIconButtons = () => {
    const buttons = [];

    if (isAuth()) {
      if (userType() === "recruiter") {
        buttons.push(
          { key: "home", icon: <HomeIcon />, onClick: () => handleClick("/home") },
          { key: "addjob", icon: <AddIcon />, onClick: () => handleClick("/addjob") },
          { key: "myjobs", icon: <WorkIcon />, onClick: () => handleClick("/myjobs") },
          { key: "employees", icon: <PeopleIcon />, onClick: () => handleClick("/employees") },
          { key: "recruiter", icon: <PersonIcon />, onClick: () => handleClick("/recruiter") },
          { key: "profile", icon: <PersonIcon />, onClick: () => handleClick("/profile") },
          { key: "logout", icon: <ExitToAppIcon />, onClick: () => handleClick("/logout") }
        );
      } else {
        buttons.push(
          { key: "home", icon: <HomeIcon />, onClick: () => handleClick("/home") },
          { key: "applications", icon: <WorkIcon />, onClick: () => handleClick("/applications") },
          { key: "profile", icon: <PersonIcon />, onClick: () => handleClick("/profile") },
          { key: "skill-assesment", icon: <PersonIcon />, onClick: () => handleClick("/ai-interview") },
          { key: "candidate", icon: <PersonIcon />, onClick: () => handleClick("/candidate") },
          { key: "logout", icon: <ExitToAppIcon />, onClick: () => handleClick("/logout") }
        );
      }
    } else {
      buttons.push(
        { key: "login", icon: <LockOpenIcon />, onClick: () => handleClick("/login") },
        { key: "signup", icon: <PersonAddIcon />, onClick: () => handleClick("/signup") }
      );
    }

    return buttons;
  };

  return (
    <StyledAppBar position="fixed" onMouseEnter={handleMouseEnter}>
      <Toolbar>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Typography variant="h6" className={classes.title} style={{ fontFamily: 'Chillax, sans-serif', color: 'black' }}>
            Talented.ai
          </Typography>
        </Link>
        {isSmallScreen ? (
  <>
    <IconButton 
      edge="end"
      className={classes.menuButton}
      aria-label="menu"
      onClick={toggleDrawer(true)}
    >
      <MenuIcon />
    </IconButton>
    <Drawer 
      anchor="right"
      open={drawerOpen}
      onClose={toggleDrawer(false)}
      classes={{
        paper: classes.drawer
      }}
    >
      <List>
        {renderIconButtons().map((button) => (
          <ListItem 
            button 
            key={button.key} 
            onClick={() => {
              button.onClick();
              setDrawerOpen(false);
            }}
            className={classes.listItem}
          >
            <ListItemIcon className={classes.listItemIcon}>
              {button.icon}
            </ListItemIcon>
            <Typography className={classes.listItemText}>
              {button.key.charAt(0).toUpperCase() + button.key.slice(1)}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Drawer>
  </>
) : (
          <div style={{ marginLeft: 'auto', display: 'flex' }}>
            <motion.div initial="hidden" animate={controls} variants={buttonVariants} style={{ display: 'flex' }}>
              {renderButtons()}
            </motion.div>
          </div>
        )}
      </Toolbar>
    </StyledAppBar>
  );
};

export default Navbar;