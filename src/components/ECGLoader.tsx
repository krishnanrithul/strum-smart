const ECGLoader = () => (
  <svg width="80" height="32" viewBox="0 0 80 32" fill="none" className="text-primary">
    <style>{`
      @keyframes ecgPulse {
        0%   { stroke-dashoffset: 160; }
        70%  { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: 0; }
      }
    `}</style>
    <polyline
      points="0,16 14,16 20,4 24,28 28,16 46,16 52,4 56,28 60,16 80,16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        strokeDasharray: 160,
        strokeDashoffset: 160,
        animation: "ecgPulse 1.8s ease-in-out infinite",
      }}
    />
  </svg>
);

export default ECGLoader;
