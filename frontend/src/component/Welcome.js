import { Typography } from "@material-ui/core";
import { motion } from "framer-motion";
import React from "react";
import styled from "styled-components";
import { useAnimations } from "../Hooks/useAnimations";

// Styled components for the layout
const WelcomeStyles = styled(motion.div)`
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem;
  background-color: white;

  @media (max-width: 1200px) {
    flex-wrap: wrap;
  }

  .welcome-description {
    width: 50%;
    @media (max-width: 1200px) {
      width: 100%;
    }
    
    .title {
      font-family: "Chillax-semibold", sans-serif;
      font-weight: bold;
      font-size: 2.5rem;
      margin-bottom: 1.5rem;
      color: #333;

      @media (max-width: 400px) {
        font-size: 1.5rem;
      }

      span {
        color: #768cff;
      }
    }

    .subtitle {
      font-family: "chillax", sans-serif;
      font-size: 1.2rem;
      margin-bottom: 2rem;
      color: #666;
    }

    button {
      font-family: "chillax", sans-serif;
      font-weight: lighter;
      font-size: 1rem;
      border: 1px solid #768cff;
      padding: 0.5rem 1rem;
      border-radius: 5px;
      background-color: transparent;
      color: black;
      cursor: pointer;
      transition: 0.3s all ease;

      &:hover {
        background-color: lightblue;
        transition: 0.3s all ease;
      }
    }
  }

  .welcome-photo {
    width: 45%;
    overflow: hidden;

    @media (max-width: 1200px) {
      display: none;
    }

    img {
      width: 100%;
    }
  }

  .welcome-photo-mobile {
    display: none;

    @media (max-width: 1200px) {
      display: block;
      position: absolute;
      width: 100%;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      opacity: 0.2;
      z-index: -1;
    }

    img {
      width: 100%;
    }
  }
`;

const Welcome = () => {
  const { heroPictureAnimation, titleAnimation, lineContainerAnimation, heroStagger } = useAnimations();

  return (
    <WelcomeStyles variants={heroStagger} initial="hidden" animate="show">
      <motion.div
        variants={heroStagger}
        initial="hidden"
        animate="show"
        className="welcome-description"
      >
        <motion.div className="title" variants={titleAnimation}>
          <motion.div variants={lineContainerAnimation} className="hide">
            <motion.h2 variants={titleAnimation}>
              Connecting Talent with Opportunities through <span>Innovative Job Solutions</span>
            </motion.h2>
          </motion.div>
          <motion.div variants={titleAnimation} className="subtitle">
            <Typography variant="body1" style={{ fontSize: "1.5rem", color: "#666", textAlign: "center" }}>
              Discover your dream job and take the next step in your career with our platform. We streamline the hiring process for both candidates and recruiters, ensuring a seamless experience.
            </Typography>
          </motion.div>
          <motion.div variants={titleAnimation}>
            <button>Learn More</button>
          </motion.div>
        </motion.div>
      </motion.div>
      <motion.div
        variants={heroPictureAnimation}
        initial="hidden"
        animate="show"
        className="welcome-photo"
      >
        <img src="https://dotcom-react.netlify.app/static/media/Hero.8c3cc6ed.png" alt="Hero" />
      </motion.div>
      <div className="welcome-photo-mobile">
        <img src="https://dotcom-react.netlify.app/static/media/Hero.8c3cc6ed.png" alt="Hero" />
      </div>
    </WelcomeStyles>
  );
};

export default Welcome;

export const ErrorPage = (props) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-2xl w-full text-center">
        <Typography variant="h2" className="text-4xl font-bold text-gray-900 mb-4">
          Error 404
        </Typography>
        <Typography variant="body1" className="text-gray-600">
          The page you are looking for does not exist. Please check the URL or return to the homepage.
        </Typography>
      </div>
    </div>
  );
};