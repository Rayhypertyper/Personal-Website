type PaperPlaneDoodleProps = {
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
  animate?: boolean;
};

export function PaperPlaneDoodle({
  className,
  strokeColor = "#1677ff",
  strokeWidth = 5.2,
  animate = false,
}: PaperPlaneDoodleProps) {
  const classes = [
    "paper-plane-doodle",
    animate ? "paper-plane-doodle--animated" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={classes}
      viewBox="0 0 256 384"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Paper airplane flight path"
    >
      <g className="paper-plane-doodle__flight-path">
        <path
          pathLength="1"
          d="M 26 300 C 35 272 52 246 77 235 C 95 227 113 228 126 237 C 143 249 145 269 133 282 C 120 296 99 297 85 288 C 71 279 68 259 78 246 C 86 236 100 232 114 238 C 133 217 154 194 173 168 C 192 141 206 113 218 91"
        />
      </g>

      <g className="paper-plane-doodle__airplane">
        <path d="M 185 96 L 231 76 L 216 119 L 203 106 Z" />
        <path d="M 185 96 L 203 106 L 231 76" />
        <path d="M 203 106 L 201 122 L 203 106" />
        <path d="M 203 106 L 216 119 L 231 76" />
      </g>

    </svg>
  );
}
