const WaveformLoader = () => (
  <svg width="32" height="24" viewBox="0 0 32 24" className="text-primary">
    <style>{`
      @keyframes waveBar {
        from { transform: scaleY(0.2); }
        to   { transform: scaleY(1.0); }
      }
    `}</style>
    {[0, 1, 2, 3, 4].map((i) => (
      <rect
        key={i}
        x={i * 7}
        y={0}
        width={4}
        height={24}
        rx={2}
        fill="currentColor"
        style={{
          transformOrigin: "50% 100%",
          animation: `waveBar 600ms ease-in-out ${i * 100}ms infinite alternate`,
        }}
      />
    ))}
  </svg>
);

export default WaveformLoader;
