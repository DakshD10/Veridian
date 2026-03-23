"use client";

import { useEffect, useState } from "react";

export function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const scrollContainer = document.getElementById('scroll-container');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;
      
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
      
      setIsVisible(progress > 5 && progress < 95);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className="fixed top-14 left-64 right-0 z-50 h-0.5 bg-violet-500 transition-opacity duration-200"
      style={{
        width: `${scrollProgress}%`,
        opacity: isVisible ? 1 : 0
      }}
    />
  );
}
