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

      const scrollableHeight = Math.max(1, scrollHeight - clientHeight);
      const progress = (scrollTop / scrollableHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));

      // Hide the progress bar when there is little/no scrollable content.
      setIsVisible(scrollHeight - clientHeight > 24 && progress > 1 && progress < 99);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className="absolute top-0 left-0 z-30 h-px pointer-events-none transition-opacity duration-200"
      style={{
        width: `${scrollProgress}%`,
        opacity: isVisible ? 1 : 0
      }}
    />
  );
}
