/* eslint-disable no-unused-vars */
import React, { useEffect, useRef } from 'react';

export default function LogoAnimation({ onDone }) {
  const wrapperRef = useRef(null);

  const STROKE_DURATION = 2800;
  const PAUSE = 400;
  const SLIDE_DURATION = 700;
  const TOTAL = STROKE_DURATION + PAUSE + SLIDE_DURATION;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof onDone === 'function') onDone();
    }, TOTAL);
    return () => clearTimeout(timer);
  }, [onDone]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    void el.offsetWidth;
    el.classList.add('anim-start');
  }, []);

  return (
    <div className="logo-splash" ref={wrapperRef} aria-hidden="true">
      <svg
        className="logo-svg"
        viewBox="0 0 800 200"  /* width 800 ensures full text fits */
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#071428" />
            <stop offset="100%" stopColor="#0b1a33" />
          </linearGradient>
        </defs>

        <text
          className="logo-text-svg"
          x="50%"  /* center horizontally */
          y="50%"  /* center vertically */
          dominantBaseline="middle"
          textAnchor="middle"
        >
          DevSpace
        </text>
      </svg>
    </div>
  );
}
