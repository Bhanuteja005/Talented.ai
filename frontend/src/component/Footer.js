import React from "react";
import styled, { keyframes } from "styled-components";

const footerAnimation = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const FooterStyle = styled.div`
    width: auto;
    padding: 2rem 0;
    margin-left: 2rem;
    padding-right: 2rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    color: #333;
    animation: ${footerAnimation} 1s linear;
    
    .footer-left {
        width: 30%;
        @media (max-width: 420px) {
            width: 100%;
        }
        
        &-top {
            font-family: chillax;
            font-size: 1.5rem;
            font-weight: 600;
            padding: 1rem 0;
        }
        
        &-bottom {
            font-family: chillax;
            font-size: 1rem;
            font-weight: 200;
            border-top: 1px solid #333;
            padding: 1rem 0;
            
            @media (max-width: 800px) {
                font-size: 10px;
            }
            
            div {
                display: flex;
                justify-content: space-between;
                
                span {
                    width: 50%;
                    margin-bottom: 1rem;
                    
                    &:hover {
                        color: #ccc;
                    }
                }
            }
        }
    }
    
    .footer-right {
        margin-right: 4rem;
        width: 60%;
        
        @media (max-width: 420px) {
            width: 100%;
        }
        
        &-top {
            font-family: chillax;
            font-size: 1.5rem;
            font-weight: 600;
            padding: 1rem 0;
        }
        
        &-bottom {
            display: flex;
            justify-content: space-between;
            font-family: chillax;
            font-size: 1rem;
            font-weight: 200;
            
            @media (max-width: 800px) {
                font-size: 10px;
            }
            
            .footer-section {
                border-top: 1px solid #333;
                width: 31%;
                height: 10rem;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                
                .section-title {
                    padding-top: 1rem;
                    font-weight: bold;
                    padding-bottom: 1rem;
                }
            }
        }
    }
`;

const Footer = () => {
    return (
        <FooterStyle>
            <div className="footer-left">
                <div className="footer-left-top">Connect with Us</div>
                <div className="footer-left-bottom">
                    <div>
                        <span>Job Seekers</span>
                        <span><a href={"/jobs"}>Browse Jobs</a></span>
                    </div>
                    <div>
                        <span>Employers</span>
                        <span><a href={"/post-job"}>Post a Job</a></span>
                    </div>
                </div>
            </div>
            <div className="footer-right">
                <div className="footer-right-top">Quick Links</div>
                <div className="footer-right-bottom">
                    <div className="footer-section">
                        <div className="section-title">Support</div>
                        <p>
                            <a href={"/support"}>Help Center</a>
                            <br />
                            <a href={"/contact"}>Contact Us</a>
                            <br />
                            <a href={"/faq"}>FAQs</a>
                        </p>
                    </div>
                    <div className="footer-section">
                        <div className="section-title">Resources</div>
                        <p>
                            <a href={"/career-tips"}>Career Tips</a>
                            <br />
                            <a href={"/blog"}>Job Portal Blog</a>
                            <br />
                            <a href={"/resume-builder"}>Resume Builder</a>
                        </p>
                    </div>
                    <div className="footer-section">
                        <div className="section-title">Company</div>
                        <p>
                            <a href={"/about-us"}>About Us</a>
                            <br />
                            <a href={"/careers"}>Join Our Team</a>
                            <br />
                            <a href={"/privacy-policy"}>Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </div>
        </FooterStyle>
    );
}

export { Footer };
