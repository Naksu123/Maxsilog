"use client";

import React, { useEffect, useRef, useState } from "react";

export default function Dynamic3DCarBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // Mouse tilt target and current lerped values
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    // Explicitly guarantee video autoplay per browser media policies
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
    }

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      targetX.current = nx;
      targetY.current = ny;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let startTime = performance.now();
    const render = () => {
      if (containerRef.current) {
        const now = performance.now();
        const elapsed = (now - startTime) / 1000;

        currentX.current += (targetX.current - currentX.current) * 0.05;
        currentY.current += (targetY.current - currentY.current) * 0.05;

        // Subtle continuous 3D breathing motion
        const ambientRotX = Math.sin(elapsed * 0.4) * 0.6;
        const ambientRotY = Math.cos(elapsed * 0.35) * 0.8;
        const ambientTransY = Math.sin(elapsed * 0.5) * 3;

        const rotY = currentX.current * 6 + ambientRotY;
        const rotX = -currentY.current * 4.5 + ambientRotX;
        const transX = currentX.current * 12;
        const transY = currentY.current * 8 + ambientTransY;

        containerRef.current.style.transform = `perspective(1200px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translate3d(${transX.toFixed(2)}px, ${transY.toFixed(2)}px, 0px) scale(1.05)`;
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  // Compute depth dimming as user scrolls past hero section (0 to 1)
  const scrollProgress = Math.min(Math.max(scrollY / 1000, 0), 1);
  const overlayOpacity = 0.45 + scrollProgress * 0.38; // 0.45 at top for rich video clarity, up to 0.83 deeper down

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070B14]"
      style={{ perspective: "1200px" }}
    >
      {/* 3D Moving Video Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-[-4%] w-[108%] h-[108%] will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.08]"
        >
          {/* Direct CDN URL provided by user */}
          <source
            src="https://cdn.pixabay.com/video/2023/06/17/167659-837413029_large.mp4"
            type="video/mp4"
          />
          {/* Local cached high-definition video fallback */}
          <source src="/videos/bmw-hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Dynamic Multi-Stop Shading Overlay */}
      {/* 1. Base dark tint that deepens with scroll for continuous readability */}
      <div
        className="absolute inset-0 bg-[#080D1A] transition-opacity duration-300 pointer-events-none"
        style={{ opacity: overlayOpacity }}
      />

      {/* 2. Top-to-bottom vignette gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080D1A]/90 via-transparent to-[#080D1A] pointer-events-none" />

      {/* 3. Radial spotlight vignette that highlights the vehicle motion */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#080D1A]/30 to-[#080D1A]/90 pointer-events-none" />

      {/* 4. Horizontal edge shading */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#080D1A]/75 via-transparent to-[#080D1A]/75 pointer-events-none" />
    </div>
  );
}
