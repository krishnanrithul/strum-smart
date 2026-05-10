const MiniLogo = ({ color = "#22c55e" }: { color?: string }) => {
  const stringColor = color === "#0a0a0a" ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.25)";
  return (
    <svg width="16" height="20" viewBox="0 0 210 290" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="21"  y1="18" x2="21"  y2="290" stroke={stringColor} strokeWidth="3"/>
      <line x1="63"  y1="18" x2="63"  y2="290" stroke={stringColor} strokeWidth="3"/>
      <line x1="105" y1="18" x2="105" y2="290" stroke={stringColor} strokeWidth="3"/>
      <line x1="147" y1="18" x2="147" y2="290" stroke={stringColor} strokeWidth="3"/>
      <line x1="189" y1="18" x2="189" y2="290" stroke={stringColor} strokeWidth="3"/>
      <rect x="0" y="0" width="210" height="22" rx="5" fill={color}/>
      <rect x="1" y="24" width="208" height="52" rx="26" fill={color}/>
      <circle cx="63" cy="128" r="30" fill={color}/>
      <circle cx="147" cy="198" r="30" fill={color}/>
    </svg>
  );
};

export default MiniLogo;
