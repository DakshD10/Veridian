"use client";

import { motion } from "framer-motion";

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerContainer({ 
  children, 
  staggerDelay = 0.05,
  className = "" 
}: StaggerContainerProps) {
  const childrenArray = Array.isArray(children) ? children : [children];

  return (
    <div className={className}>
      {childrenArray.map((child, index) => {
        if (typeof child === 'string' || typeof child === 'number') {
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 1, 0.5, 1], 
                delay: index * staggerDelay 
              }}
            >
              {child}
            </motion.div>
          );
        }

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ 
              duration: 0.4, 
              ease: [0.25, 1, 0.5, 1], 
              delay: index * staggerDelay 
            }}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
}
