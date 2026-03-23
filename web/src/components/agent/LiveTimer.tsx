"use client";

import { useState, useEffect } from "react";

interface LiveTimerProps {
  startTime: string;
}

export function LiveTimer({ startTime }: LiveTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <>
      Running · {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </>
  );
}
