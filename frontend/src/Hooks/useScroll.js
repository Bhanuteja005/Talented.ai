import { useAnimation } from "framer-motion";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

export const useScroll = (threshold) => {
    const controls = useAnimation();
    const [element, inView] = useInView({ threshold: threshold, triggerOnce: true });

    useEffect(() => {
        if (inView) {
            controls.start("show");
        } else {
            controls.start("hidden");
        }
    }, [controls, inView]);
    return { element, controls };
};