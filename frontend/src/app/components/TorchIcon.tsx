export function TorchIcon({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 100 150"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Torch stick */}
        <rect x="45" y="40" width="10" height="100" fill="#5d4037" rx="2" />
        <rect x="42" y="135" width="16" height="5" fill="#4a342e" rx="1" />

        {/* Fire base */}
        <ellipse cx="50" cy="35" rx="12" ry="8" fill="#ff6b35" opacity="0.8">
          <animate
            attributeName="ry"
            values="8;10;8"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* Main flame */}
        <path
          d="M 50 35 Q 45 25, 48 15 Q 50 5, 52 15 Q 55 25, 50 35 Z"
          fill="url(#flameGradient1)"
          className="flame-flicker"
        >
          <animate
            attributeName="d"
            values="M 50 35 Q 45 25, 48 15 Q 50 5, 52 15 Q 55 25, 50 35 Z;
                    M 50 35 Q 43 25, 47 13 Q 50 3, 53 13 Q 57 25, 50 35 Z;
                    M 50 35 Q 45 25, 48 15 Q 50 5, 52 15 Q 55 25, 50 35 Z"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>

        {/* Inner flame */}
        <path
          d="M 50 32 Q 47 24, 49 18 Q 50 12, 51 18 Q 53 24, 50 32 Z"
          fill="url(#flameGradient2)"
        >
          <animate
            attributeName="d"
            values="M 50 32 Q 47 24, 49 18 Q 50 12, 51 18 Q 53 24, 50 32 Z;
                    M 50 32 Q 46 24, 48 16 Q 50 10, 52 16 Q 54 24, 50 32 Z;
                    M 50 32 Q 47 24, 49 18 Q 50 12, 51 18 Q 53 24, 50 32 Z"
            dur="1.8s"
            repeatCount="indefinite"
          />
        </path>

        {/* Flame highlights */}
        <path
          d="M 50 30 Q 49 25, 50 20 Q 51 25, 50 30 Z"
          fill="url(#flameGradient3)"
          opacity="0.9"
        >
          <animate
            attributeName="opacity"
            values="0.9;0.6;0.9"
            dur="1.2s"
            repeatCount="indefinite"
          />
        </path>

        <defs>
          <linearGradient id="flameGradient1" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ff6b35" />
            <stop offset="50%" stopColor="#ff8c42" />
            <stop offset="100%" stopColor="#ffa500" />
          </linearGradient>
          <linearGradient id="flameGradient2" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ff8c42" />
            <stop offset="50%" stopColor="#ffa500" />
            <stop offset="100%" stopColor="#ffeb3b" />
          </linearGradient>
          <linearGradient id="flameGradient3" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ffa500" />
            <stop offset="100%" stopColor="#fff9c4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
