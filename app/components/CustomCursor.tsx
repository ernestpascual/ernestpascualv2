"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        // Adjust for the center of the 6px x 6px ball (3px offset)
        cursorRef.current.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`;
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div 
      ref={cursorRef}
      className="fixed top-0 left-0 w-[6px] h-[6px] bg-[#E6231D] rounded-full pointer-events-none z-[99999] shadow-[0_0_10px_3px_rgba(230,35,29,0.8)]"
      style={{ willChange: "transform" }}
    />
  );
}
