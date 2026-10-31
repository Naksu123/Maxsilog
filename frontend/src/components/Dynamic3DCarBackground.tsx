"use client";

import React, { useEffect, useRef, useState } from "react";

export default function Dynamic3DCarBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // Mouse / gyro tilt target and current lerped values
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Explicitly guarantee video autoplay per browser and mobile OS media policies
      video.defaultMuted = true;
      video.muted = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");

      const attemptPlay = () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay blocked by mobile battery saver / low power mode until user gesture
          });
        }
      };

      attemptPlay();

      // Mobile user gesture unlock: on first touch, click, or scroll, unlock playback immediately
      const unlockAutoplay = () => {
        if (video.paused) {
          video.play().catch(() => {});
        }
      };

      window.addEventListener("touchstart", unlockAutoplay, { passive: true, once: true });
      window.addEventListener("scroll", unlockAutoplay, { passive: true, once: true });
      window.addEventListener("click", unlockAutoplay, { passive: true, once: true });
    }

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Desktop mouse tilt
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      targetX.current = nx;
      targetY.current = ny;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Mobile touch swipe tilt
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        const nx = (touch.clientX / window.innerWidth) * 2 - 1;
        const ny = (touch.clientY / window.innerHeight) * 2 - 1;
        targetX.current = nx * 0.75;
        targetY.current = ny * 0.75;
      }
    };
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Mobile gyroscope / deviceorientation tilt
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // gamma: left-to-right tilt (-30 to 30 deg mapped to -1 to 1)
        // beta: front-to-back tilt (15 to 75 deg mapped to -1 to 1)
        const nx = Math.max(-1, Math.min(1, e.gamma / 25));
        const ny = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
        targetX.current = nx;
        targetY.current = ny;
      }
    };
    if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", handleDeviceOrientation, { passive: true });
    }

    const startTime = performance.now();
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
      window.removeEventListener("touchmove", handleTouchMove);
      if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
        window.removeEventListener("deviceorientation", handleDeviceOrientation);
      }
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  // Compute depth dimming as user scrolls past hero section (0 to 1)
  const scrollProgress = Math.min(Math.max(scrollY / 1000, 0), 1);
  const overlayOpacity = 0.38 + scrollProgress * 0.42; // 0.38 at top for rich automotive clarity, up to 0.80 deeper down

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070B14]"
      style={{ perspective: "1200px" }}
    >
      {/* 3D Moving Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-[-4%] w-[108%] h-[108%] will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Guaranteed Instant Fallback Static Image:
            Renders immediately at 0ms on all mobile devices and desktops,
            ensuring the car is 100% visible even before video finishes downloading
            or if autoplay is blocked by iOS / Android battery saver */}
        <div
          className="absolute inset-0 bg-cover bg-center filter brightness-[0.92] contrast-[1.08]"
          style={{
            backgroundImage: "url('/bmw-poster.jpg')",
          }}
        />

        {/* High-Definition Automotive Video Layer */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/bmw-poster.jpg"
          className="relative w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.08]"
        >
          {/* 1. Primary local high-definition video source for instant zero-latency loading */}
          <source src="/videos/bmw-hero.mp4" type="video/mp4" />
          {/* 2. Fallback CDN URL */}
          <source
            src="https://cdn.pixabay.com/video/2023/06/17/167659-837413029_large.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* Dynamic Multi-Stop Shading Overlay */}
      {/* 1. Base dark tint that deepens with scroll for continuous readability */}
      <div
        className="absolute inset-0 bg-[#080D1A] transition-opacity duration-300 pointer-events-none"
        style={{ opacity: overlayOpacity }}
      />

      {/* 2. Top-to-bottom vignette gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080D1A]/85 via-transparent to-[#080D1A] pointer-events-none" />

      {/* 3. Radial spotlight vignette that highlights the vehicle motion */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#080D1A]/20 to-[#080D1A]/85 pointer-events-none" />

      {/* 4. Horizontal edge shading */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#080D1A]/65 via-transparent to-[#080D1A]/65 pointer-events-none" />
    </div>
  );
}
