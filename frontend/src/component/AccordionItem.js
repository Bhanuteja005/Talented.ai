import { motion } from "framer-motion";
import React from "react";
import styled from "styled-components";
import { useAnimations } from "../Hooks/useAnimations";

const AccordionItemStyle = styled(motion.div)`
  padding: 0.5rem 0;
  transition: 0.5s all ease;
  cursor: pointer;

  h4 {
    font-family: "Chillax", sans-serif;
    font-weight: 400;
    font-size: 1.5rem;
    margin-bottom: 1rem;
    transition: 0.5s all ease;
  }

  .answer {
    max-height: 0;
    font-family: "Chillax", sans-serif;
    font-weight: 200;
    font-size: 1.2rem;
    overflow: hidden;
    margin: 1rem 0;
    transition: 0.5s all ease;
    border-bottom: 1px solid #768cff;

    p {
      opacity: 0;
    }

    &.open {
      max-height: unset;
      overflow: unset;
      transition: 0.5s all ease;
      padding-bottom: 10px;

      p {
        opacity: 1;
        transition: 0.5s all ease 0.1s;
      }
    }
  }
`;

const AccordionItem = (props) => {
  const { itemID, question, answer, openedID, onChange } = props;
  const { revealAnimation } = useAnimations();

  return (
    <AccordionItemStyle
      variants={revealAnimation}
      className="question"
      onClick={() => onChange(itemID)}
    >
      <h4>{question}</h4>
      <div className={openedID === itemID ? "answer open" : "answer"}>
        <p>{answer}</p>
      </div>
    </AccordionItemStyle>
  );
};

export { AccordionItem };
