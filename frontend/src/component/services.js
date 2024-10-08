import { motion } from "framer-motion";
import React from "react";
import styled from "styled-components";
import Skate from "../assets/Skate.png";
import { ServiceCardsData } from "../data/ServiceCardsData";
import { useAnimations } from "../Hooks/useAnimations";
import { useScroll } from "../Hooks/useScroll";
import { ServiceCard } from "./servicecard";
import { Wave } from "./Wave";

const ServicesStyles = styled(motion.div)`
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 90vh;
    color: #333;
    position: relative;
    @media (max-width: 1200px) {
        flex-wrap: wrap;
        min-height: unset;
    }
    .services-left{
        width: 45%;
        @media (max-width: 1200px) {
            display: none;
        }
        img{
            width: 100%;
        }
    }
    .services-right{
        width: 50%;
        min-height: 75vh;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        align-items: center;
        @media (max-width: 420px) {
            width: 100%;
            min-height: unset;
        }
        @media (max-width: 1200px) {
            width: 100%;
            min-height: 75vh;
        }
        .services-description{
font-family: "Chillax-semibold", sans-serif;
            font-weight: 600;
            font-size: 1.5rem;
            padding: 1rem 0;
        }
        .services-cards{
            flex-grow: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
        }
    }
`

const Services = () =>{
    const {element, controls} = useScroll(0.2);
    const {staggerChildrenAnimation, pictureAnimation, titleAnimation} = useAnimations();

    return(
        <ServicesStyles 
            variants={staggerChildrenAnimation}
            initial="hidden"
            ref={element}
            animate={controls}
        >
            <motion.div  
            variants={pictureAnimation}
            className="services-left">
                <img src={Skate} alt=""/>
            </motion.div>
            <motion.div 
            variants={staggerChildrenAnimation}
            className="services-right">
                <motion.div
                variants={titleAnimation}
                className="services-description">
                    <h2>Quality Services, Timely Turnaround</h2>
                </motion.div>
                <div className="services-cards">
                    {
                        ServiceCardsData.map((card)=>{
                            return(
                                <ServiceCard
                                key={card.id}
                                iconURL={card.iconURL}
                                text={card.text}
                                title={card.title}
                                />
                            )
                        })
                    }
                </div>
            </motion.div>
            <Wave/>
        </ServicesStyles>
    )
}

export { Services };
