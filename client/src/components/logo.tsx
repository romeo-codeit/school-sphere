export function Logo() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary"
    >
      <rect width="40" height="40" rx="12" fill="currentColor" />
      <g>
        <ellipse cx="20" cy="28" rx="10" ry="4" fill="#fff" fillOpacity="0.15" />
        <path d="M12 28V16C12 13.2386 14.2386 11 17 11H23C25.7614 11 28 13.2386 28 16V28" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="16" y="18" width="8" height="6" rx="2" fill="#fff" fillOpacity="0.7" />
        <path d="M20 18V24" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="15" r="2" fill="#fff" />
      </g>
    </svg>
  );
}
