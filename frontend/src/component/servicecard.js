import { motion } from "framer-motion";
import React from "react";
import styled from "styled-components";
import { useAnimations } from "../Hooks/useAnimations";

const ServiceCardStyle = styled(motion.div)`
  width: 45%;
  margin-bottom: 1rem;
  @media (max-width: 420px) {
    width: 100%;
  }
  .card-icon {
    @media (max-width: 420px) {
      display: none;
    }
  }
  .card-title {
    margin-bottom: 1rem;
    margin-top: 0.5rem;
    font-family: "Chillax-semibold", sans-serif;
    font-weight: 600;
    font-size: 1.2rem;
    @media (max-width: 420px) {
      color: #768cff;
    }
  }
  .card-text {
    font-family: "Chillax", sans-serif;
    font-weight: regular;
    font-size: 1rem;
  }
`;

export const ServiceCard = (props) => {
  const { titleAnimation } = useAnimations();
  return (
    <ServiceCardStyle variants={titleAnimation} className="services-cards-card">
      <div className="card-icon">
        <img src={props.iconURL} alt="" />
      </div>
      <div className="card-title">{props.title}</div>
      <p className="card-text">{props.text}</p>
    </ServiceCardStyle>
  );
};