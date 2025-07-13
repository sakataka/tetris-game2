/**
 * Celebration Effects Component
 * Asset-free CSS/SVG animations for level celebration
 */

import type React from "react";

export interface CelebrationEffectsProps {
  phase: string;
}

export const CelebrationEffects: React.FC<CelebrationEffectsProps> = ({ phase }) => {
  // Generate particle elements for CSS animation
  const particles = Array.from({ length: 20 }, (_, i) => (
    <div
      key={`particle-${i}`}
      className="particle"
      style={
        {
          "--delay": `${i * 0.1}s`,
          "--angle": `${i * 18}deg`,
        } as React.CSSProperties
      }
    />
  ));

  // Generate burst lines for SVG animation
  const burstLines = Array.from({ length: 8 }, (_, i) => (
    <line
      key={`burst-line-${i}`}
      x1="100"
      y1="100"
      x2="100"
      y2="20"
      stroke="currentColor"
      strokeWidth="3"
      transform={`rotate(${i * 45} 100 100)`}
      className="burst-line"
    />
  ));

  return (
    <div className="celebration-effects" aria-hidden="true">
      {/* Particle-like CSS animations */}
      <div className={`particles phase-${phase}`}>{particles}</div>

      {/* SVG burst effect */}
      <svg className="burst-effect" viewBox="0 0 200 200" width="200" height="200">
        <title>Celebration burst effect</title>
        <g className={`burst-group phase-${phase}`}>{burstLines}</g>
      </svg>

      {/* CSS-only glow effect */}
      <div className={`glow-ring phase-${phase}`} />

      {/* Secondary ripple effect */}
      <div className={`ripple-effect phase-${phase}`} />

      {/* Sparkle elements */}
      <div className={`sparkles phase-${phase}`}>
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={`sparkle-${i}`}
            className="sparkle"
            style={
              {
                "--sparkle-delay": `${i * 0.15}s`,
                "--sparkle-position": `${(i * 30) % 360}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
};
