import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  Mail,
  Power,
} from "lucide-react";
import { TourPageText } from "./TourPageText";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { ContactDoodles } from "./ContactDoodles";
import {
  CONTACT_EMAIL,
  GITHUB_URL,
  LINKEDIN_URL,
  RESUME_URL,
  SCHEDULE_URL,
} from "../contact-links";

type OrbitName = "email" | "linkedin" | "github" | "schedule" | "resume";

interface OrbitDefinition {
  name: OrbitName;
  label: string;
  phase: number;
  icon: ReactNode;
}

const ORBIT_PHASE_STEP = (Math.PI * 2) / 5;
const FORMSPREE_ENDPOINT = "https://formspree.io/f/meajjnqy";
const DEFAULT_CONTACT_MESSAGE = "Hi Ray, I'd love to connect and learn more about your work.";

const ORBITS: readonly OrbitDefinition[] = [
  {
    name: "email",
    label: "Email",
    phase: -Math.PI / 2,
    icon: <Mail className="contact-planet__icon" aria-hidden="true" />,
  },
  {
    name: "linkedin",
    label: "LinkedIn",
    phase: -Math.PI / 2 + ORBIT_PHASE_STEP,
    icon: (
      <svg className="contact-planet__icon contact-planet__icon--brand" viewBox="3 3 18 18" fill="currentColor" stroke="none" aria-hidden="true">
        <path d="M20.45 3H3.55A.55.55 0 0 0 3 3.55v16.9c0 .3.25.55.55.55h16.9c.3 0 .55-.25.55-.55V3.55a.55.55 0 0 0-.55-.55ZM8.34 18.34H5.67V9.75h2.67v8.59ZM7 8.58a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1Zm11.34 9.76h-2.66v-4.18c0-1-.02-2.28-1.39-2.28-1.39 0-1.6 1.09-1.6 2.2v4.26h-2.67V9.75h2.56v1.17h.04a2.81 2.81 0 0 1 2.53-1.39c2.7 0 3.2 1.78 3.2 4.1v4.71Z" />
      </svg>
    ),
  },
  {
    name: "github",
    label: "GitHub",
    phase: -Math.PI / 2 + ORBIT_PHASE_STEP * 2,
    icon: (
      <svg className="contact-planet__icon contact-planet__icon--brand" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
        <path d="M12 .297C5.37.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.236 1.839 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.467-1.334-5.467-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.625-5.479 5.921.43.371.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    name: "schedule",
    label: "Calendy",
    phase: -Math.PI / 2 + ORBIT_PHASE_STEP * 3,
    icon: <CalendarDays className="contact-planet__icon" aria-hidden="true" />,
  },
  {
    name: "resume",
    label: "Resume",
    phase: -Math.PI / 2 + ORBIT_PHASE_STEP * 4,
    icon: <FileText className="contact-planet__icon" aria-hidden="true" />,
  },
] as const;

const STARS = [
  [3, 20, 1],
  [13, 8, 0],
  [24, 31, 1],
  [31, 14, 0],
  [42, 7, 0],
  [53, 15, 1],
  [65, 4, 0],
  [76, 9, 1],
  [84, 16, 1],
  [94, 13, 0],
  [98, 35, 0],
  [89, 48, 0],
  [95, 68, 1],
  [86, 78, 0],
  [73, 89, 1],
  [55, 95, 0],
  [43, 86, 0],
  [32, 96, 1],
  [21, 83, 0],
  [11, 69, 0],
  [3, 79, 1],
] as const;

const DUST = Array.from({ length: 38 }, (_, index) => ({
  left: `${(index * 37 + 9) % 101}%`,
  top: `${(index * 53 + 17) % 97}%`,
  size: `${index % 5 === 0 ? 2 : index % 3 === 0 ? 1.5 : 1}px`,
  opacity: 0.16 + (index % 4) * 0.11,
}));

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const CONTACT_SYSTEM_SCALE = 0.9;
const CONTACT_OUTER_RING_RADIUS = {
  x: 343,
  y: 262,
} as const;
const CONTACT_ORBIT_SPEED_SCALE = 0.34;
const CONTACT_ORBIT_PERIOD = 42_000 / CONTACT_ORBIT_SPEED_SCALE;
const CONTACT_ORBIT_ANGULAR_VELOCITY = (Math.PI * 2) / CONTACT_ORBIT_PERIOD;
const CONTACT_PLANET_LABEL_GAP = 20;
const CONTACT_LABEL_ROCKET_GAP = 8;
const CONTACT_SUN_RAY_DIAMETER = {
  mobile: 144,
  desktop: 214,
} as const;
const CONTACT_SUN_RAY_MAX_SCALE = 1.04;
const CONTACT_SUN_MOUSE_PULL_RADIUS_SCALE = 1.5;
const CONTACT_SOLAR_SYSTEM_OFFSET_Y = 80;
const CONTACT_ROCKET_PNG_WIDTH = 1280;
const CONTACT_ROCKET_PNG_VISIBLE_LEFT = 306;
const CONTACT_ROCKET_PNG_VISIBLE_RIGHT = 1095;

const CONTACT_ROCKET_FLIGHT_CONFIG = {
  preparationDuration: 100,
  ignitionDuration: 260,
  landingDuration: 340,
  landedDuration: 650,
  flightSpeed: 440,
  accelerationDuration: 1_450,
  descentDecelerationScale: 2.5,
  minimumFlightDuration: 1_400,
  maximumFlightDuration: 6_000,
  horizontalLaunchDistance: 132,
  horizontalTurnEaseDistance: 178,
  counterclockwiseTurn: -Math.PI / 2,
  verticalDescentDistance: 112,
  landingApproachDistance: 112,
  landingVisualScale: 0.78,
  curveStrength: 0.36,
  sunAvoidancePadding: 26,
  landingOverlap: 0,
  landingBounce: 3.5,
  vacuumRiseDuration: 420,
  vacuumSuctionDuration: 1_050,
  vacuumRetractDuration: 360,
  vacuumHeadWidthScale: 0.5,
  vacuumHeadHeight: 14,
  vacuumNeckWidthScale: 0.22,
  vacuumMouthOverlap: 5,
  vacuumLetterDuration: 440,
  vacuumLetterDurationJitter: 120,
  vacuumLetterPrewobble: 160,
  vacuumMaxLetters: 260,
  dumpLiftDuration: 240,
  dumpLift: 14,
  dumpPourDuration: 820,
  dumpPourTail: 260,
  dumpLowerDuration: 280,
  dumpGravity: 520,
  dumpAbsorbDepth: 22,
  dumpNozzleInset: 6,
  returnIgnitionDuration: 320,
  returnSpeedScale: 1.35,
  returnApproachDistance: 160,
  returnApproachAngle: Math.PI / 4,
  returnCurveStrength: 0.5,
  returnControlMin: 140,
  returnControlMax: 260,
  returnDockingDuration: 300,
  returnDockingSlide: 3,
} as const;

type RocketFlightState =
  | "idle"
  | "vacuuming"
  | "dumping"
  | "departing"
  | "homebound"
  | "docking"
  | "launching"
  | "flying"
  | "landing"
  | "landed"
  | "complete"
  | "error";

interface ContactPoint {
  x: number;
  y: number;
}

interface ContactOrbitClock {
  startTime: number | null;
  now: number;
  phase: number;
  currentAngle: number;
  angularVelocity: number;
  orbitDuration: number;
  direction: "clockwise";
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  geometryRevision: number;
}

interface RocketFlightPlan {
  startTime: number;
  duration: number;
  launchPoint: ContactPoint;
  horizontalLaunchPoint: ContactPoint;
  horizontalLaunchDuration: number;
  p0: ContactPoint;
  p1: ContactPoint;
  p2: ContactPoint;
  p3: ContactPoint;
  landingPoint: ContactPoint;
  rotationStartTime: number;
  rotationStartAngle: number;
  descentStartTime: number;
  verticalDescentDuration: number;
  landingPlanetCenter: ContactPoint;
  landingPlanetRadius: number;
  totalPathLength: number;
  horizontalLaunchDistance: number;
  approachPathLength: number;
  verticalDescentDistance: number;
  geometryRevision: number;
}

interface VacuumLetter {
  element: HTMLElement;
  start: ContactPoint;
  control: ContactPoint;
  delay: number;
  duration: number;
  spin: number;
  width: number;
  height: number;
}

interface RocketReturnPlan {
  startTime: number;
  distanceOffset: number;
  p0: ContactPoint;
  p1: ContactPoint;
  p2: ContactPoint;
  p3: ContactPoint;
  cruiseLength: number;
  q0: ContactPoint;
  q1: ContactPoint;
  q2: ContactPoint;
  q3: ContactPoint;
  flareLength: number;
  flareStartTime: number;
  flareDuration: number;
  slot: ContactPoint;
  geometryRevision: number;
}

interface DumpLetter {
  letter: VacuumLetter;
  delay: number;
  offsetX: number;
  vx: number;
  vy: number;
  spin: number;
  startY: number;
  emittedAt: number | null;
  done: boolean;
}

interface ContactSubmissionPayload {
  name: string;
  email: string;
  message: string;
}

type SmokeColor = readonly [number, number, number];

interface SmokeTone {
  light: SmokeColor;
  mid: SmokeColor;
  dark: SmokeColor;
  shadow: SmokeColor;
}

interface RocketSmokeParticle {
  age: number;
  maxAge: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  seed: number;
  size: number;
  growth: number;
  spriteIndex: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

// Keep the tuning values together so the smoke can be reshaped without
// changing the canvas implementation below.
const ROCKET_SMOKE_CONFIG = {
  rocketSpeed: 96,
  rocketTravelDistance: 35,
  rocketTravelDuration: 2_200,
  exhaustAnchorX: 0.11,
  exhaustAnchorY: 0.5,
  initialEmissionRate: 54,
  smokeEmissionRate: 276,
  initialLeftwardVelocity: 132,
  upwardDrift: -7,
  turbulence: 30,
  particleLifetime: 3.5,
  particleExpansionSpeed: 31,
  smokeOpacity: 0.44,
  dissipationSpeed: 0.99,
  accelerationDuration: 1_100,
  maxDevicePixelRatio: 1.5,
  maxFrameRate: 30,
} as const;

const ROCKET_SMOKE_PALETTE: readonly SmokeTone[] = [
  {
    light: [252, 250, 242],
    mid: [218, 216, 207],
    dark: [169, 169, 161],
    shadow: [122, 119, 108],
  },
  {
    light: [244, 245, 241],
    mid: [198, 202, 199],
    dark: [149, 157, 157],
    shadow: [104, 111, 111],
  },
  {
    light: [226, 228, 222],
    mid: [174, 179, 176],
    dark: [126, 132, 131],
    shadow: [91, 94, 89],
  },
  {
    light: [241, 231, 210],
    mid: [204, 191, 165],
    dark: [157, 143, 120],
    shadow: [115, 101, 82],
  },
] as const;

const rgba = (color: SmokeColor, alpha: number) =>
  `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;

const easeInOutCubic = (progress: number) =>
  progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

const easeOutCubic = (progress: number) =>
  1 - Math.pow(1 - progress, 3);

const easeOutPower = (progress: number, exponent: number) =>
  1 - Math.pow(1 - progress, exponent);

const easeOutBack = (progress: number, overshoot = 1.3) =>
  1 +
  (overshoot + 1) * Math.pow(progress - 1, 3) +
  overshoot * Math.pow(progress - 1, 2);

const easeInCubic = (progress: number) => progress * progress * progress;

const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

const lerpPoint = (
  start: ContactPoint,
  end: ContactPoint,
  progress: number,
): ContactPoint => ({
  x: lerp(start.x, end.x, progress),
  y: lerp(start.y, end.y, progress),
});

const normalizeAngle = (angle: number) =>
  ((angle + Math.PI) % (Math.PI * 2)) - Math.PI;

const lerpAngle = (start: number, end: number, progress: number) =>
  start + normalizeAngle(end - start) * progress;

const getCubicPoint = (
  p0: ContactPoint,
  p1: ContactPoint,
  p2: ContactPoint,
  p3: ContactPoint,
  progress: number,
): ContactPoint => {
  const inverse = 1 - progress;
  const inverseSquared = inverse * inverse;
  const progressSquared = progress * progress;

  return {
    x:
      inverseSquared * inverse * p0.x +
      3 * inverseSquared * progress * p1.x +
      3 * inverse * progressSquared * p2.x +
      progressSquared * progress * p3.x,
    y:
      inverseSquared * inverse * p0.y +
      3 * inverseSquared * progress * p1.y +
      3 * inverse * progressSquared * p2.y +
      progressSquared * progress * p3.y,
  };
};

const estimateCubicLength = (
  p0: ContactPoint,
  p1: ContactPoint,
  p2: ContactPoint,
  p3: ContactPoint,
) => {
  let length = 0;
  let previous = p0;

  for (let index = 1; index <= 28; index += 1) {
    const point = getCubicPoint(p0, p1, p2, p3, index / 28);
    length += Math.hypot(point.x - previous.x, point.y - previous.y);
    previous = point;
  }

  return length;
};

const getCubicPointAtDistance = (
  p0: ContactPoint,
  p1: ContactPoint,
  p2: ContactPoint,
  p3: ContactPoint,
  distance: number,
  totalLength: number,
) => {
  if (distance <= 0) {
    return p0;
  }

  if (distance >= totalLength) {
    return p3;
  }

  let travelled = 0;
  let previous = p0;

  for (let index = 1; index <= 28; index += 1) {
    const point = getCubicPoint(p0, p1, p2, p3, index / 28);
    const segmentLength = Math.hypot(
      point.x - previous.x,
      point.y - previous.y,
    );

    if (travelled + segmentLength >= distance) {
      const segmentProgress = segmentLength
        ? (distance - travelled) / segmentLength
        : 0;
      return lerpPoint(previous, point, segmentProgress);
    }

    travelled += segmentLength;
    previous = point;
  }

  return p3;
};

const getCubicProgressAtDistance = (
  p0: ContactPoint,
  p1: ContactPoint,
  p2: ContactPoint,
  p3: ContactPoint,
  distance: number,
  totalLength: number,
) => {
  if (distance <= 0) {
    return 0;
  }

  if (distance >= totalLength) {
    return 1;
  }

  let travelled = 0;
  let previous = p0;

  for (let index = 1; index <= 28; index += 1) {
    const point = getCubicPoint(p0, p1, p2, p3, index / 28);
    const segmentLength = Math.hypot(
      point.x - previous.x,
      point.y - previous.y,
    );

    if (travelled + segmentLength >= distance) {
      const segmentProgress = segmentLength
        ? (distance - travelled) / segmentLength
        : 0;
      return (index - 1 + segmentProgress) / 28;
    }

    travelled += segmentLength;
    previous = point;
  }

  return 1;
};

const getCubicTangent = (
  p0: ContactPoint,
  p1: ContactPoint,
  p2: ContactPoint,
  p3: ContactPoint,
  progress: number,
): ContactPoint => {
  const inverse = 1 - progress;

  return {
    x:
      3 * inverse * inverse * (p1.x - p0.x) +
      6 * inverse * progress * (p2.x - p1.x) +
      3 * progress * progress * (p3.x - p2.x),
    y:
      3 * inverse * inverse * (p1.y - p0.y) +
      6 * inverse * progress * (p2.y - p1.y) +
      3 * progress * progress * (p3.y - p2.y),
  };
};

const getRocketAcceleration = () =>
  CONTACT_ROCKET_FLIGHT_CONFIG.flightSpeed /
  (CONTACT_ROCKET_FLIGHT_CONFIG.accelerationDuration / 1000);

const getRocketDistanceAtTime = (elapsed: number) => {
  const elapsedSeconds = Math.max(0, elapsed) / 1000;
  const accelerationSeconds =
    CONTACT_ROCKET_FLIGHT_CONFIG.accelerationDuration / 1000;
  const acceleration = getRocketAcceleration();
  const accelerationDistance =
    0.5 * acceleration * accelerationSeconds * accelerationSeconds;

  if (elapsedSeconds <= accelerationSeconds) {
    return 0.5 * acceleration * elapsedSeconds * elapsedSeconds;
  }

  return (
    accelerationDistance +
    (elapsedSeconds - accelerationSeconds) *
      CONTACT_ROCKET_FLIGHT_CONFIG.flightSpeed
  );
};

const getRocketTimeForDistance = (distance: number) => {
  const clampedDistance = Math.max(0, distance);
  const accelerationSeconds =
    CONTACT_ROCKET_FLIGHT_CONFIG.accelerationDuration / 1000;
  const acceleration = getRocketAcceleration();
  const accelerationDistance =
    0.5 * acceleration * accelerationSeconds * accelerationSeconds;

  if (clampedDistance <= accelerationDistance) {
    return Math.sqrt((2 * clampedDistance) / acceleration) * 1000;
  }

  return (
    CONTACT_ROCKET_FLIGHT_CONFIG.accelerationDuration +
    ((clampedDistance - accelerationDistance) /
      CONTACT_ROCKET_FLIGHT_CONFIG.flightSpeed) *
      1000
  );
};

const getRocketDecelerationDuration = (distance: number) =>
  (Math.max(0, distance) / CONTACT_ROCKET_FLIGHT_CONFIG.flightSpeed) *
  CONTACT_ROCKET_FLIGHT_CONFIG.descentDecelerationScale *
  1000;

const submitContactMessage = async (payload: ContactSubmissionPayload) => {
  const formData = new FormData();
  formData.set("name", payload.name);
  formData.set("email", payload.email);
  formData.set("message", payload.message);

  const response = await fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  const result = (await response.json().catch(() => null)) as {
    error?: string;
    errors?: Array<{ message?: string }>;
  } | null;

  if (!response.ok) {
    const formspreeErrors = result?.errors
      ?.map((error) => error.message)
      .filter((message): message is string => Boolean(message))
      .join(" ");

    throw new Error(
      formspreeErrors || result?.error || "Form submission failed.",
    );
  }

};

const traceIrregularSmokeBlob = (
  context: CanvasRenderingContext2D,
  size: number,
  seed: number,
) => {
  const points = Array.from({ length: 13 }, (_, index) => {
    const noise = Math.abs(
      Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453,
    ) % 1;
    const angle =
      (index / 13) * Math.PI * 2 +
      (noise - 0.5) * 0.24;
    const secondaryNoise = Math.abs(
      Math.sin(seed * 4.271 + index * 31.71) * 15731.743,
    ) % 1;
    const radius = size * (0.58 + noise * 0.54);

    return {
      x: Math.cos(angle) * radius * (1.02 + secondaryNoise * 0.2),
      y: Math.sin(angle) * radius * (0.68 + secondaryNoise * 0.22),
    };
  });

  context.beginPath();
  points.forEach((point, index) => {
    const nextPoint = points[(index + 1) % points.length];
    const midpoint = {
      x: (point.x + nextPoint.x) / 2,
      y: (point.y + nextPoint.y) / 2,
    };

    if (index === 0) {
      context.moveTo(midpoint.x, midpoint.y);
    }

    context.quadraticCurveTo(point.x, point.y, midpoint.x, midpoint.y);
  });
  context.closePath();
};

interface ContactErrors {
  name?: string;
  email?: string;
  message?: string;
}

interface ContactSectionProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function ContactSection({
  isDarkMode,
  onToggleTheme,
}: ContactSectionProps) {
  const stageRef = useRef<HTMLElement | null>(null);
  const systemRef = useRef<HTMLDivElement | null>(null);
  const sunRef = useRef<HTMLDivElement | null>(null);
  const ringsRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const smokeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rocketButtonRef = useRef<HTMLButtonElement | null>(null);
  const rocketFlightLayerRef = useRef<HTMLElement | null>(null);
  const landedRocketPositionRef = useRef<(() => void) | null>(null);
  const rocketFlightAngleRef = useRef(0);
  const rocketSmokeStartRef = useRef<(() => void) | null>(null);
  const rocketSmokeStopRef = useRef<(() => void) | null>(null);
  const emailPlanetRef = useRef<HTMLButtonElement | null>(null);
  const orbitRefs = useRef<Array<HTMLDivElement | null>>([]);
  const connectorRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const orbitClockRef = useRef<ContactOrbitClock>({
    startTime: null,
    now: 0,
    phase: ORBITS[0].phase,
    currentAngle: ORBITS[0].phase,
    angularVelocity: CONTACT_ORBIT_ANGULAR_VELOCITY,
    orbitDuration: CONTACT_ORBIT_PERIOD,
    direction: "clockwise",
    centerX: 0,
    centerY: 0,
    radiusX: 0,
    radiusY: 0,
    geometryRevision: 0,
  });
  const flightStateRef = useRef<RocketFlightState>("idle");
  const startRocketFlightRef = useRef<
    ((payload: ContactSubmissionPayload) => Promise<void>) | null
  >(null);
  const cancelRocketFlightRef = useRef<(() => void) | null>(null);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [announcement, setAnnouncement] = useState(
    "Complete the form to send a message.",
  );

  useEffect(() => {
    const stage = stageRef.current;
    const system = systemRef.current;
    const sun = sunRef.current;
    const rings = ringsRef.current;

    if (!stage || !system || !sun || !rings) {
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let reducedMotion = reducedMotionQuery.matches;
    let pointerIsTouch = false;
    let pointerInside = false;
    let animationFrame = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let initialized = false;
    let orbitStartTime: number | null = null;
    let layout = {
      width: 0,
      height: 0,
      scale: 1,
      homeX: 0,
      homeY: 0,
      sunBoundaryRadiusX: 0,
      sunBoundaryRadiusY: 0,
      sunMousePullRadiusX: 0,
      sunMousePullRadiusY: 0,
    };

    const constrainSunToOuterRing = (x: number, y: number) => {
      const { homeX, homeY, sunBoundaryRadiusX, sunBoundaryRadiusY } = layout;

      if (sunBoundaryRadiusX <= 0 || sunBoundaryRadiusY <= 0) {
        return { x: homeX, y: homeY };
      }

      const differenceX = x - homeX;
      const differenceY = y - homeY;
      const normalizedDistance =
        (differenceX * differenceX) / (sunBoundaryRadiusX * sunBoundaryRadiusX) +
        (differenceY * differenceY) / (sunBoundaryRadiusY * sunBoundaryRadiusY);

      if (normalizedDistance <= 1) {
        return { x, y };
      }

      const boundaryScale = 1 / Math.sqrt(normalizedDistance);
      return {
        x: homeX + differenceX * boundaryScale,
        y: homeY + differenceY * boundaryScale,
      };
    };

    const isWithinSunMousePullRadius = (x: number, y: number) => {
      const {
        homeX,
        homeY,
        sunMousePullRadiusX,
        sunMousePullRadiusY,
      } = layout;

      if (sunMousePullRadiusX <= 0 || sunMousePullRadiusY <= 0) {
        return false;
      }

      const differenceX = x - homeX;
      const differenceY = y - homeY;
      const normalizedDistance =
        (differenceX * differenceX) /
          (sunMousePullRadiusX * sunMousePullRadiusX) +
        (differenceY * differenceY) /
          (sunMousePullRadiusY * sunMousePullRadiusY);

      return normalizedDistance <= 1;
    };

    const constrainSunPosition = (x: number, y: number) =>
      constrainSunToOuterRing(x, y);

    const getPlanetPosition = (orbit: OrbitDefinition, progress: number) => {
      const { homeX, homeY, scale } = layout;
      const angle = orbit.phase + progress * Math.PI * 2;

      return {
        x: homeX + Math.cos(angle) * CONTACT_OUTER_RING_RADIUS.x * scale,
        y: homeY + Math.sin(angle) * CONTACT_OUTER_RING_RADIUS.y * scale,
      };
    };

    const getSystemPosition = (x: number, y: number) => {
      const { homeX, homeY } = layout;

      return {
        x: homeX + (x - homeX) / CONTACT_SYSTEM_SCALE,
        y: homeY + (y - homeY) / CONTACT_SYSTEM_SCALE,
      };
    };

    const getRocketCollisionRects = () => {
      const rects: Array<{
        left: number;
        top: number;
        right: number;
        bottom: number;
      }> = [];
      const addRect = (element: HTMLElement | null) => {
        if (!element) {
          return;
        }

        const styles = window.getComputedStyle(element);
        if (styles.visibility === "hidden" || styles.opacity === "0") {
          return;
        }

        const bounds = element.getBoundingClientRect();
        if (bounds.width <= 0 || bounds.height <= 0) {
          return;
        }

        rects.push({
          left: bounds.left - CONTACT_LABEL_ROCKET_GAP,
          top: bounds.top - CONTACT_LABEL_ROCKET_GAP,
          right: bounds.right + CONTACT_LABEL_ROCKET_GAP,
          bottom: bounds.bottom + CONTACT_LABEL_ROCKET_GAP,
        });
      };

      addRect(
        rocketButtonRef.current?.querySelector<HTMLElement>(
          ".contact-form__rocket",
        ) ?? null,
      );
      addRect(rocketFlightLayerRef.current);

      return rects;
    };

    const rectanglesOverlap = (
      first: { left: number; top: number; right: number; bottom: number },
      second: { left: number; top: number; right: number; bottom: number },
    ) =>
      first.left < second.right &&
      first.right > second.left &&
      first.top < second.bottom &&
      first.bottom > second.top;

    const positionOrbitItems = (progress: number) => {
      const { width, height, homeX, homeY } = layout;
      const rocketCollisionRects = getRocketCollisionRects();

      ORBITS.forEach((orbit, index) => {
        const { x: planetX, y: planetY } = getPlanetPosition(orbit, progress);
        const orbitNode = orbitRefs.current[index];

        if (!orbitNode) {
          return;
        }

        orbitNode.style.transform = `translate3d(${planetX}px, ${planetY}px, 0)`;

        const label = orbitNode.querySelector<HTMLElement>(
          ".contact-orbit-item__label",
        );
        if (!label) {
          return;
        }

        const planet = orbitNode.querySelector<HTMLElement>(".contact-planet");
        const planetRadius = planet
          ? Math.max(planet.offsetWidth, planet.offsetHeight) / 2
          : 41;
        const differenceX = planetX - homeX;
        const differenceY = planetY - homeY;
        const distance = Math.hypot(differenceX, differenceY) || 1;
        const directionX = differenceX / distance;
        const directionY = differenceY / distance;
        const labelWidth = Math.max(label.offsetWidth, label.scrollWidth);
        const labelHeight = Math.max(label.offsetHeight, label.scrollHeight);
        const labelGap = CONTACT_PLANET_LABEL_GAP;
        const shouldAvoidRocket = orbit.name === "email";
        const labelDirections =
          shouldAvoidRocket
            ? [
                { x: directionX, y: directionY },
                { x: -directionY, y: directionX },
                { x: directionY, y: -directionX },
                { x: -directionX, y: -directionY },
                { x: 1, y: 0 },
                { x: -1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: -1 },
              ]
            : [{ x: directionX, y: directionY }];

        let labelPositioned = false;

        labelDirections.forEach(({ x: candidateX, y: candidateY }) => {
          if (labelPositioned) {
            return;
          }

          const candidateDistance = Math.hypot(candidateX, candidateY) || 1;
          const normalizedX = candidateX / candidateDistance;
          const normalizedY = candidateY / candidateDistance;
          const labelHalfExtent =
            Math.abs(normalizedX) * labelWidth * 0.5 +
            Math.abs(normalizedY) * labelHeight * 0.5;
          const labelDistance = planetRadius + labelHalfExtent + labelGap;

          // The orbit system is scaled around its home position. Clamp the
          // label after that transform so the text stays inside the stage at
          // narrow widths instead of being clipped by the viewport edge.
          const labelCenterX = planetX + normalizedX * labelDistance;
          const labelCenterY = planetY + normalizedY * labelDistance;
          const visibleLabelHalfWidth =
            labelWidth * CONTACT_SYSTEM_SCALE * 0.5;
          const visibleLabelHalfHeight =
            labelHeight * CONTACT_SYSTEM_SCALE * 0.5;
          const transformedLabelCenterX =
            homeX + (labelCenterX - homeX) * CONTACT_SYSTEM_SCALE;
          const transformedLabelCenterY =
            homeY + (labelCenterY - homeY) * CONTACT_SYSTEM_SCALE;
          const safeLabelCenterX = clamp(
            transformedLabelCenterX,
            visibleLabelHalfWidth + 6,
            width - visibleLabelHalfWidth - 6,
          );
          const safeLabelCenterY = clamp(
            transformedLabelCenterY,
            visibleLabelHalfHeight + 6,
            height - visibleLabelHalfHeight - 6,
          );
          const clampedLabelCenterX =
            homeX + (safeLabelCenterX - homeX) / CONTACT_SYSTEM_SCALE;
          const clampedLabelCenterY =
            homeY + (safeLabelCenterY - homeY) / CONTACT_SYSTEM_SCALE;

          label.style.left = `${clampedLabelCenterX - planetX}px`;
          label.style.top = `${clampedLabelCenterY - planetY}px`;
          label.style.right = "auto";

          const labelBounds = label.getBoundingClientRect();
          labelPositioned =
            !shouldAvoidRocket ||
            !rocketCollisionRects.some((rocketRect) =>
              rectanglesOverlap(labelBounds, rocketRect),
            );
        });

        // If every fallback direction is occupied during a landing, keep the
        // copy readable to assistive technology but remove the visual overlap.
        label.style.opacity =
          shouldAvoidRocket && !labelPositioned ? "0" : "";

        // Extend the label's target to the planet, following its final clamped
        // position and any direction changes made to avoid the rocket.
        const labelOffsetX = Number.parseFloat(label.style.left);
        const labelOffsetY = Number.parseFloat(label.style.top);
        label.style.setProperty(
          "--label-hit-length",
          `${Math.max(0, Math.hypot(labelOffsetX, labelOffsetY) - planetRadius + 2)}px`,
        );
        label.style.setProperty("--label-hit-height", `${planetRadius * 2}px`);
        label.style.setProperty(
          "--label-hit-angle",
          `${Math.atan2(-labelOffsetY, -labelOffsetX)}rad`,
        );
        label.style.pointerEvents =
          shouldAvoidRocket && !labelPositioned ? "none" : "";
      });
    };

    const positionConnectors = (
      sunX: number,
      sunY: number,
      progress: number,
    ) => {
      ORBITS.forEach((orbit, index) => {
        const { x: planetX, y: planetY } = getPlanetPosition(orbit, progress);
        const connector = connectorRefs.current[index];

        if (!connector) {
          return;
        }

        const differenceX = planetX - sunX;
        const differenceY = planetY - sunY;
        connector.style.left = `${sunX}px`;
        connector.style.top = `${sunY}px`;
        connector.style.width = `${Math.hypot(differenceX, differenceY)}px`;
        connector.style.transform = `rotate(${Math.atan2(differenceY, differenceX)}rad)`;
      });
    };

    const positionStaticSystem = () => {
      const { homeX, homeY, scale } = layout;

      system.style.transformOrigin = `${homeX}px ${homeY}px`;
      system.style.transform = `scale(${CONTACT_SYSTEM_SCALE})`;
      rings.style.transform = `translate3d(${homeX}px, ${homeY}px, 0) scale(${scale})`;

      positionOrbitItems(0);
      landedRocketPositionRef.current?.();

      positionConnectors(homeX, homeY, 0);
    };

    const updateLayout = () => {
      const stageBounds = stage.getBoundingClientRect();
      const { width, height } = stageBounds;
      const isMobile = width < 640;
      const isTablet = width >= 640 && width < 900;
      const scale = isMobile
        ? clamp((width - 76) / (292 * 2), 0.42, 0.58)
        : isTablet
          ? clamp(width / 1060, 0.68, 0.82)
        : clamp(width / 1672, 0.92, 1);
      const preferredHomeX = isMobile ? width / 2 : width * (isTablet ? 0.66 : 0.618);
      const preferredHomeY =
        (isMobile ? height - 260 : height * (isTablet ? 0.56 : 0.465)) +
        CONTACT_SOLAR_SYSTEM_OFFSET_Y;
      const homeX = preferredHomeX;
      const homeY = preferredHomeY;
      const sunClearance =
        (isMobile
          ? CONTACT_SUN_RAY_DIAMETER.mobile
          : CONTACT_SUN_RAY_DIAMETER.desktop) *
        0.5 *
        CONTACT_SUN_RAY_MAX_SCALE;
      const planetCircleRadiusX =
        CONTACT_OUTER_RING_RADIUS.x * scale;
      const planetCircleRadiusY =
        CONTACT_OUTER_RING_RADIUS.y * scale;
      const sunBoundaryScale = Math.max(
        0,
        1 - sunClearance / Math.min(planetCircleRadiusX, planetCircleRadiusY),
      );
      const sunBoundaryRadiusX = Math.max(
        0,
        planetCircleRadiusX * sunBoundaryScale,
      );
      const sunBoundaryRadiusY = Math.max(
        0,
        planetCircleRadiusY * sunBoundaryScale,
      );
      const sunMousePullRadiusX =
        sunBoundaryRadiusX * CONTACT_SUN_MOUSE_PULL_RADIUS_SCALE;
      const sunMousePullRadiusY =
        sunBoundaryRadiusY * CONTACT_SUN_MOUSE_PULL_RADIUS_SCALE;

      layout = {
        width,
        height,
        scale,
        homeX,
        homeY,
        sunBoundaryRadiusX,
        sunBoundaryRadiusY,
        sunMousePullRadiusX,
        sunMousePullRadiusY,
      };

      const orbitClock = orbitClockRef.current;
      const nextCenterX = stageBounds.left + homeX;
      const nextCenterY = stageBounds.top + homeY;
      const nextRadiusX =
        CONTACT_SYSTEM_SCALE * CONTACT_OUTER_RING_RADIUS.x * scale;
      const nextRadiusY =
        CONTACT_SYSTEM_SCALE * CONTACT_OUTER_RING_RADIUS.y * scale;

      if (
        Math.abs(orbitClock.centerX - nextCenterX) > 0.5 ||
        Math.abs(orbitClock.centerY - nextCenterY) > 0.5 ||
        Math.abs(orbitClock.radiusX - nextRadiusX) > 0.5 ||
        Math.abs(orbitClock.radiusY - nextRadiusY) > 0.5
      ) {
        orbitClock.geometryRevision += 1;
      }

      orbitClock.centerX = nextCenterX;
      orbitClock.centerY = nextCenterY;
      orbitClock.radiusX = nextRadiusX;
      orbitClock.radiusY = nextRadiusY;
      orbitClock.angularVelocity = reducedMotion
        ? 0
        : CONTACT_ORBIT_ANGULAR_VELOCITY;
      orbitClock.orbitDuration = CONTACT_ORBIT_PERIOD;

      positionStaticSystem();

      if (!initialized) {
        currentX = homeX;
        currentY = homeY;
        targetX = homeX;
        targetY = homeY;
        initialized = true;
      } else {
        const currentPosition = constrainSunPosition(currentX, currentY);
        currentX = currentPosition.x;
        currentY = currentPosition.y;
        if (!pointerInside || pointerIsTouch || reducedMotion) {
          targetX = homeX;
          targetY = homeY;
        } else {
          const targetPosition = constrainSunPosition(targetX, targetY);
          targetX = targetPosition.x;
          targetY = targetPosition.y;
        }
      }
    };

    const sendHome = () => {
      pointerInside = false;
      targetX = layout.homeX;
      targetY = layout.homeY;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        pointerIsTouch = true;
        sendHome();
        return;
      }

      pointerIsTouch = false;
      const bounds = stage.getBoundingClientRect();
      const pointerX = event.clientX - bounds.left;
      const pointerY = event.clientY - bounds.top;

      if (!isWithinSunMousePullRadius(pointerX, pointerY)) {
        sendHome();
        return;
      }

      pointerInside = true;
      const targetPosition = constrainSunPosition(pointerX, pointerY);
      targetX = targetPosition.x;
      targetY = targetPosition.y;
    };

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      orbitStartTime = null;
      orbitClockRef.current.startTime = null;
      orbitClockRef.current.angularVelocity = reducedMotion
        ? 0
        : CONTACT_ORBIT_ANGULAR_VELOCITY;
      if (reducedMotion) {
        pointerIsTouch = false;
        sendHome();
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        sendHome();
      }
    };

    const renderFrame = (time: number) => {
      if (orbitStartTime === null) {
        orbitStartTime = time;
        orbitClockRef.current.startTime = time;
      }

      const orbitProgress = reducedMotion
        ? 0
        : ((time - orbitStartTime) % CONTACT_ORBIT_PERIOD) /
          CONTACT_ORBIT_PERIOD;

      const stageBounds = stage.getBoundingClientRect();
      const orbitClock = orbitClockRef.current;
      const nextCenterX = stageBounds.left + layout.homeX;
      const nextCenterY = stageBounds.top + layout.homeY;

      if (
        Math.abs(orbitClock.centerX - nextCenterX) > 0.5 ||
        Math.abs(orbitClock.centerY - nextCenterY) > 0.5
      ) {
        orbitClock.geometryRevision += 1;
        orbitClock.centerX = nextCenterX;
        orbitClock.centerY = nextCenterY;
      }

      orbitClock.now = time;
      orbitClock.phase = ORBITS[0].phase;
      orbitClock.currentAngle =
        ORBITS[0].phase +
        orbitClock.angularVelocity * (time - (orbitStartTime ?? time));

      if (reducedMotion || pointerIsTouch) {
        targetX = layout.homeX;
        targetY = layout.homeY;
      }

      const ease = reducedMotion ? 1 : pointerInside ? 0.082 : 0.045;
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;
      const currentPosition = constrainSunPosition(currentX, currentY);
      currentX = currentPosition.x;
      currentY = currentPosition.y;

      const systemSunPosition = getSystemPosition(currentX, currentY);

      system.style.transformOrigin = `${layout.homeX}px ${layout.homeY}px`;
      system.style.transform = `scale(${CONTACT_SYSTEM_SCALE})`;
      sun.style.transform = `translate3d(${systemSunPosition.x}px, ${systemSunPosition.y}px, 0)`;
      positionOrbitItems(orbitProgress);
      landedRocketPositionRef.current?.();
      positionConnectors(
        systemSunPosition.x,
        systemSunPosition.y,
        orbitProgress,
      );

      stage.dataset.ready = "true";
      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    updateLayout();
    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(stage);
    document.addEventListener("pointermove", handlePointerMove, {
      capture: true,
      passive: true,
    });
    window.addEventListener("pointercancel", sendHome);
    window.addEventListener("blur", sendHome);
    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotionQuery.addEventListener("change", handleMotionPreference);
    animationFrame = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      document.removeEventListener("pointermove", handlePointerMove, true);
      window.removeEventListener("pointercancel", sendHome);
      window.removeEventListener("blur", sendHome);
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotionQuery.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = smokeCanvasRef.current;
    const rocketButton = rocketButtonRef.current;
    const rocket = rocketButton?.querySelector<HTMLElement>(
      ".contact-form__rocket",
    );

    if (!stage || !canvas || !rocketButton || !rocket) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let reducedMotion = reducedMotionQuery.matches;
    let sectionInView = true;
    let flightActive = false;
    let pointerInside = false;
    let focused = false;
    let flightStartedAt = 0;
    let emissionAccumulator = 0;
    let lastFrameTime = 0;
    let animationFrame = 0;
    let finishTimer = 0;
    let previousAnchor: { x: number; y: number } | null = null;
    let canvasWidth = 0;
    let canvasHeight = 0;
    let devicePixelRatio = 1;
    const particles: RocketSmokeParticle[] = [];
    const smokeSprites: HTMLCanvasElement[] = [];

    const createSmokeSprite = (tone: SmokeTone, seed: number) => {
      const sprite = document.createElement("canvas");
      const spriteSize = 96;
      const spriteContext = sprite.getContext("2d");

      sprite.width = spriteSize;
      sprite.height = spriteSize;

      if (!spriteContext) {
        return sprite;
      }

      const center = spriteSize / 2;
      spriteContext.translate(center, center);
      spriteContext.globalCompositeOperation = "source-over";

      spriteContext.save();
      spriteContext.globalAlpha = 0.22;
      spriteContext.filter = "blur(3px)";
      spriteContext.fillStyle = rgba(tone.dark, 0.3);
      traceIrregularSmokeBlob(spriteContext, 29, seed + 4.6);
      spriteContext.fill();
      spriteContext.restore();

      spriteContext.globalAlpha = 0.96;
      spriteContext.filter = "none";
      const gradient = spriteContext.createRadialGradient(
        -7,
        -7,
        1,
        0,
        0,
        34,
      );
      gradient.addColorStop(0, rgba(tone.light, 0.94));
      gradient.addColorStop(0.36, rgba(tone.mid, 0.82));
      gradient.addColorStop(0.76, rgba(tone.dark, 0.56));
      gradient.addColorStop(1, rgba(tone.shadow, 0.08));
      spriteContext.fillStyle = gradient;
      traceIrregularSmokeBlob(spriteContext, 29, seed);
      spriteContext.fill();

      spriteContext.save();
      spriteContext.globalAlpha = 0.4;
      spriteContext.translate(-5, -3);
      spriteContext.scale(0.72, 0.56);
      spriteContext.fillStyle = rgba(tone.light, 0.62);
      traceIrregularSmokeBlob(spriteContext, 21, seed + 17.2);
      spriteContext.fill();
      spriteContext.restore();

      return sprite;
    };

    ROCKET_SMOKE_PALETTE.forEach((tone, toneIndex) => {
      for (let variantIndex = 0; variantIndex < 3; variantIndex += 1) {
        smokeSprites.push(
          createSmokeSprite(
            tone,
            toneIndex * 97 + variantIndex * 23 + 11,
          ),
        );
      }
    });

    rocketButton.style.setProperty(
      "--rocket-travel-distance",
      `${ROCKET_SMOKE_CONFIG.rocketTravelDistance}px`,
    );
    rocketButton.style.setProperty(
      "--rocket-travel-distance-mid",
      `${ROCKET_SMOKE_CONFIG.rocketTravelDistance * 0.25}px`,
    );
    rocketButton.style.setProperty(
      "--rocket-travel-distance-late",
      `${ROCKET_SMOKE_CONFIG.rocketTravelDistance * 0.72}px`,
    );
    rocketButton.style.setProperty(
      "--rocket-travel-duration",
      `${ROCKET_SMOKE_CONFIG.rocketTravelDuration}ms`,
    );

    const resizeCanvas = () => {
      const bounds = stage.getBoundingClientRect();
      canvasWidth = Math.max(1, bounds.width);
      canvasHeight = Math.max(1, bounds.height);
      devicePixelRatio = Math.min(
        window.devicePixelRatio || 1,
        ROCKET_SMOKE_CONFIG.maxDevicePixelRatio,
      );
      canvas.width = Math.ceil(canvasWidth * devicePixelRatio);
      canvas.height = Math.ceil(canvasHeight * devicePixelRatio);
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      context.setTransform(
        devicePixelRatio,
        0,
        0,
        devicePixelRatio,
        0,
        0,
      );
      previousAnchor = null;
    };

    const clearCanvas = () => {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(
        devicePixelRatio,
        0,
        0,
        devicePixelRatio,
        0,
        0,
      );
    };

    const getExhaustAnchor = () => {
      const sectionRect = stage.getBoundingClientRect();
      const flightLayer = rocketFlightLayerRef.current;

      if (flightLayer) {
        const layerBounds = flightLayer.getBoundingClientRect();
        const layerWidth = flightLayer.offsetWidth || layerBounds.width;
        const layerHeight = flightLayer.offsetHeight || layerBounds.height;
        const localX =
          (ROCKET_SMOKE_CONFIG.exhaustAnchorX - 0.5) * layerWidth;
        const localY =
          (ROCKET_SMOKE_CONFIG.exhaustAnchorY - 0.5) * layerHeight;
        const angle = rocketFlightAngleRef.current;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);

        return {
          x:
            layerBounds.left +
            layerBounds.width / 2 -
            sectionRect.left +
            localX * cosine -
            localY * sine,
          y:
            layerBounds.top +
            layerBounds.height / 2 -
            sectionRect.top +
            localX * sine +
            localY * cosine,
        };
      }

      const rocketRect = rocket.getBoundingClientRect();

      return {
        x:
          rocketRect.left - sectionRect.left +
          rocketRect.width * ROCKET_SMOKE_CONFIG.exhaustAnchorX,
        y:
          rocketRect.top - sectionRect.top +
          rocketRect.height * ROCKET_SMOKE_CONFIG.exhaustAnchorY,
      };
    };

    const resetRocketFlightPosition = () => {
      rocketButton.removeAttribute("data-rocket-flight");
      rocket.style.animation = "none";
      rocket.style.transform =
        "translateX(-7px) translateY(0) scale(1) rotate(0deg)";
      void rocket.offsetWidth;
      rocket.style.animation = "";
      rocket.style.transform = "";
    };

    const spawnParticle = (
      anchor: { x: number; y: number },
      rocketVelocityX: number,
      rocketVelocityY: number,
      rocketAngle: number,
      accelerationProgress: number,
    ) => {
      const toneIndex = Math.floor(
        Math.random() * ROCKET_SMOKE_PALETTE.length,
      );
      const densityBoost = 0.86 + accelerationProgress * 0.58;
      const startingSize = 7 + Math.random() * 15;
      const exhaustVelocity =
        ROCKET_SMOKE_CONFIG.initialLeftwardVelocity *
        (0.72 + accelerationProgress * 0.64);

      particles.push({
        age: 0,
        maxAge:
          ROCKET_SMOKE_CONFIG.particleLifetime * (0.82 + Math.random() * 0.36),
        opacity:
          ROCKET_SMOKE_CONFIG.smokeOpacity *
          (0.76 + Math.random() * 0.38) *
          densityBoost,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.7,
        seed: Math.random() * 1000,
        size: startingSize,
        growth:
          ROCKET_SMOKE_CONFIG.particleExpansionSpeed *
          (0.72 + Math.random() * 0.64),
        spriteIndex: toneIndex * 3 + Math.floor(Math.random() * 3),
        vx:
          rocketVelocityX * 0.38 -
          Math.cos(rocketAngle) * exhaustVelocity +
          (Math.random() - 0.56) * 24,
        vy:
          rocketVelocityY * 0.38 -
          Math.sin(rocketAngle) * exhaustVelocity +
          ROCKET_SMOKE_CONFIG.upwardDrift +
          (Math.random() - 0.5) * 26,
        x: anchor.x + (Math.random() - 0.5) * 7,
        y: anchor.y + (Math.random() - 0.5) * 10,
      });
    };

    const drawParticle = (particle: RocketSmokeParticle) => {
      const lifeProgress = particle.age / particle.maxAge;
      const fadeIn = clamp(particle.age / 0.14, 0, 1);
      const fadeOut = clamp((1 - lifeProgress) / 0.28, 0, 1);
      const alpha = particle.opacity * fadeIn * fadeOut;
      const size =
        particle.size +
        particle.growth * particle.age * (0.84 + lifeProgress * 0.16);

      if (alpha <= 0 || size <= 0) {
        return;
      }

      const sprite = smokeSprites[particle.spriteIndex];
      if (!sprite) {
        return;
      }

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.globalAlpha = alpha;
      const spriteScale = size / 29;
      const drawSize = 96 * spriteScale;
      context.drawImage(
        sprite,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize,
      );
      context.restore();
    };

    const renderFrame = (time: number) => {
      animationFrame = 0;

      if (!sectionInView || document.hidden) {
        lastFrameTime = 0;
        return;
      }

      const frameInterval = 1000 / ROCKET_SMOKE_CONFIG.maxFrameRate;
      if (lastFrameTime && time - lastFrameTime < frameInterval) {
        animationFrame = window.requestAnimationFrame(renderFrame);
        return;
      }

      const seconds = lastFrameTime
        ? Math.min(0.08, Math.max(0.001, (time - lastFrameTime) / 1000))
        : frameInterval / 1000;
      lastFrameTime = time;
      clearCanvas();

      const anchor = getExhaustAnchor();
      const rocketVelocityX = previousAnchor
        ? clamp((anchor.x - previousAnchor.x) / seconds, -220, 220)
        : 0;
      const rocketVelocityY = previousAnchor
        ? clamp((anchor.y - previousAnchor.y) / seconds, -220, 220)
        : 0;
      const rocketAngle = rocketFlightLayerRef.current
        ? rocketFlightAngleRef.current
        : 0;
      previousAnchor = anchor;

      if (flightActive && !reducedMotion) {
        const elapsed = time - flightStartedAt;
        const accelerationProgress = clamp(
          elapsed / ROCKET_SMOKE_CONFIG.accelerationDuration,
          0,
          1,
        );

        const emissionRate =
          ROCKET_SMOKE_CONFIG.initialEmissionRate +
          ROCKET_SMOKE_CONFIG.smokeEmissionRate *
            (0.16 + accelerationProgress * 1.2);
        emissionAccumulator += emissionRate * seconds;

        let particlesToSpawn = Math.min(24, Math.floor(emissionAccumulator));
        emissionAccumulator -= particlesToSpawn;

        while (particlesToSpawn > 0) {
          spawnParticle(
            anchor,
            rocketVelocityX,
            rocketVelocityY,
            rocketAngle,
            accelerationProgress,
          );
          particlesToSpawn -= 1;
        }
      }

      const damping = Math.pow(
        ROCKET_SMOKE_CONFIG.dissipationSpeed,
        seconds * 60,
      );

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.age += seconds;

        const turbulencePhase = particle.seed + particle.age * 1.12;
        const turbulenceScale =
          ROCKET_SMOKE_CONFIG.turbulence *
          (0.25 + particle.age / ROCKET_SMOKE_CONFIG.particleLifetime);
        particle.vx +=
          Math.sin(turbulencePhase * 1.37) * turbulenceScale * seconds * 0.16;
        particle.vy +=
          Math.cos(turbulencePhase * 0.91) * turbulenceScale * seconds * 0.12;
        particle.vy += ROCKET_SMOKE_CONFIG.upwardDrift * seconds * 0.08;

        particle.vx *= damping;
        particle.vy *= damping;
        particle.x += particle.vx * seconds;
        particle.y += particle.vy * seconds;
        particle.rotation += particle.rotationSpeed * seconds;

        const particleSize = particle.size + particle.growth * particle.age;
        if (
          particle.age >= particle.maxAge ||
          particle.x < -particleSize * 2.5 ||
          particle.x > canvasWidth + particleSize * 2.5 ||
          particle.y < -particleSize * 2.5 ||
          particle.y > canvasHeight + particleSize * 2.5
        ) {
          particles.splice(index, 1);
          continue;
        }

      }

      // Paint older smoke first so the newest exhaust puffs stay visible on top
      // of the larger cloud while their individual growth continues.
      for (let index = 0; index < particles.length; index += 1) {
        drawParticle(particles[index]);
      }

      if (flightActive || particles.length > 0) {
        animationFrame = window.requestAnimationFrame(renderFrame);
      }
    };

    const startLoop = () => {
      if (
        reducedMotion ||
        !sectionInView ||
        document.hidden ||
        animationFrame !== 0
      ) {
        return;
      }

      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    const beginFlight = () => {
      if (reducedMotion) {
        return;
      }

      window.clearTimeout(finishTimer);
      if (!flightActive) {
        resetRocketFlightPosition();
        flightActive = true;
        flightStartedAt = performance.now();
        emissionAccumulator = 0;
        previousAnchor = null;
        rocketButton.dataset.rocketFlight = "active";
      }
      startLoop();
    };

    const finishFlight = () => {
      if (reducedMotion || rocketButton.dataset.contactSubmission === "active") {
        return;
      }

      flightActive = false;
      rocketButton.dataset.rocketFlight = "cooldown";
      startLoop();
      window.clearTimeout(finishTimer);
      finishTimer = window.setTimeout(() => {
        if (!pointerInside && !focused) {
          delete rocketButton.dataset.rocketFlight;
        }
      }, 760);
    };

    const handlePointerEnter = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }
      pointerInside = true;
      beginFlight();
    };

    const handlePointerLeave = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }
      pointerInside = false;
      finishFlight();
    };

    const handleFocus = () => {
      focused = true;
      beginFlight();
    };

    const handleBlur = () => {
      focused = false;
      if (!pointerInside) {
        finishFlight();
      }
    };

    const handlePointerCancel = () => {
      pointerInside = false;
      focused = false;
      finishFlight();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        flightActive = false;
        if (animationFrame) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }
        lastFrameTime = 0;
        return;
      }

      startLoop();
    };

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      if (reducedMotion) {
        flightActive = false;
        particles.length = 0;
        rocketButton.removeAttribute("data-rocket-flight");
        if (animationFrame) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }
        clearCanvas();
        return;
      }

      if (pointerInside || focused) {
        beginFlight();
      }
    };

    const intersectionObserver =
      "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => {
            sectionInView = Boolean(
              entry?.isIntersecting && entry.intersectionRatio > 0.02,
            );

            if (!sectionInView && animationFrame) {
              window.cancelAnimationFrame(animationFrame);
              animationFrame = 0;
              lastFrameTime = 0;
            }

            if (sectionInView) {
              startLoop();
            }
          }, { threshold: [0, 0.02] })
        : null;

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(stage);
    intersectionObserver?.observe(stage);
    rocketButton.addEventListener("pointerenter", handlePointerEnter);
    rocketButton.addEventListener("pointerleave", handlePointerLeave);
    rocketButton.addEventListener("focus", handleFocus);
    rocketButton.addEventListener("blur", handleBlur);
    window.addEventListener("pointercancel", handlePointerCancel);
    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotionQuery.addEventListener("change", handleMotionPreference);
    rocketSmokeStartRef.current = beginFlight;
    rocketSmokeStopRef.current = finishFlight;

    return () => {
      window.clearTimeout(finishTimer);
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      rocketButton.removeEventListener("pointerenter", handlePointerEnter);
      rocketButton.removeEventListener("pointerleave", handlePointerLeave);
      rocketButton.removeEventListener("focus", handleFocus);
      rocketButton.removeEventListener("blur", handleBlur);
      window.removeEventListener("pointercancel", handlePointerCancel);
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotionQuery.removeEventListener("change", handleMotionPreference);
      if (rocketSmokeStartRef.current === beginFlight) {
        rocketSmokeStartRef.current = null;
      }
      if (rocketSmokeStopRef.current === finishFlight) {
        rocketSmokeStopRef.current = null;
      }
      rocketButton.removeAttribute("data-rocket-flight");
      clearCanvas();
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const form = formRef.current;
    const rocketButton = rocketButtonRef.current;
    const emailPlanet = emailPlanetRef.current;
    const sun = sunRef.current;
    const rocket = rocketButton?.querySelector<HTMLElement>(
      ".contact-form__rocket",
    );
    const rocketImage = rocket?.querySelector<HTMLImageElement>(
      ".contact-form__rocket-image",
    );

    if (
      !stage ||
      !form ||
      !rocketButton ||
      !emailPlanet ||
      !sun ||
      !rocket ||
      !rocketImage
    ) {
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let reducedMotion = reducedMotionQuery.matches;
    let animationFrame = 0;
    let reducedMotionTimer = 0;
    let phaseStartedAt = 0;
    let lastPlanRebuildAt = 0;
    let geometryDirty = false;
    let returningToForm = false;
    let returnStartedAt = 0;
    let returnFrom: ContactPoint | null = null;
    let returnFromAngle = 0;
    let flightLayer: HTMLElement | null = null;
    let landedRocket: HTMLElement | null = null;
    let activePlan: RocketFlightPlan | null = null;
    let returnPlan: RocketReturnPlan | null = null;
    let departSeatOffset: ContactPoint = { x: 0, y: 0 };
    let dockingStartAngle = 0;
    let launchCenter: ContactPoint | null = null;
    let currentCenter: ContactPoint | null = null;
    let landingStart: ContactPoint | null = null;
    let rocketWidth = 0;
    let rocketHeight = 0;
    let rocketPngVisibleBottomOffset = 0;
    let planetRadius = 0;
    let resolveFlight: (() => void) | null = null;
    let rejectFlight: ((reason?: unknown) => void) | null = null;
    let controlsBeforeFlight: Array<{
      element: HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement;
      disabled: boolean;
    }> = [];
    let previousButtonDisabled = false;
    let previousButtonVisibility = "";
    let previousButtonPointerEvents = "";
    let previousFormBusy: string | null = null;
    let previousContactFlight: string | undefined;
    let previousContactSubmission: string | undefined;
    let vacuumElement: HTMLElement | null = null;
    let vacuumLetters: VacuumLetter[] = [];
    let dumpLetters: DumpLetter[] = [];
    let vacuumMouth: ContactPoint = { x: 0, y: 0 };
    let vacuumTargetExtension = 0;
    let vacuumCurrentExtension = 0;
    let returnVacuumExtension = 0;
    let vacuumMessageField: HTMLTextAreaElement | null = null;
    let previousMessageColor = "";
    let previousMessageCaretColor = "";
    const rocketOverlay = document.createElement("div");
    rocketOverlay.className = "contact-rocket-overlay";
    rocketOverlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(rocketOverlay);

    const getLivePlanetMetrics = () => {
      const bounds = emailPlanet.getBoundingClientRect();
      const radius = Math.max(bounds.width, bounds.height) / 2;

      return {
        bounds,
        center: {
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height / 2,
        },
        radius,
      };
    };

    const getOrbitPositionAt = (time: number): ContactPoint => {
      const orbitClock = orbitClockRef.current;

      if (orbitClock.radiusX <= 0 || orbitClock.radiusY <= 0) {
        return getLivePlanetMetrics().center;
      }

      const elapsed = Math.max(
        0,
        time - (orbitClock.startTime ?? orbitClock.now),
      );
      const angle =
        orbitClock.phase + orbitClock.angularVelocity * elapsed;

      return {
        x: orbitClock.centerX + orbitClock.radiusX * Math.cos(angle),
        y: orbitClock.centerY + orbitClock.radiusY * Math.sin(angle),
      };
    };

    const getOrbitPlanetMetrics = (time: number) => {
      const livePlanetMetrics = getLivePlanetMetrics();

      return {
        center: getOrbitPositionAt(time),
        radius: livePlanetMetrics.radius || planetRadius,
      };
    };

    const getLandingPoint = (
      planetCenter: ContactPoint,
      radius: number,
    ): ContactPoint => {
      const turnAngle = CONTACT_ROCKET_FLIGHT_CONFIG.counterclockwiseTurn;
      const rotatedRocketHalfHeight =
        Math.abs(Math.sin(turnAngle)) * rocketWidth / 2 +
        Math.abs(Math.cos(turnAngle)) * rocketHeight / 2;
      const visibleRocketBottomOffset =
        rocketPngVisibleBottomOffset > 0
          ? rocketPngVisibleBottomOffset
          : rotatedRocketHalfHeight *
            CONTACT_ROCKET_FLIGHT_CONFIG.landingVisualScale;

      // The supplied rocket artwork has transparent padding around its body.
      // Use its visible footprint so the body settles directly onto the planet
      // instead of stopping above the surface.
      return {
        x: planetCenter.x,
        y:
          planetCenter.y -
          radius -
          visibleRocketBottomOffset +
          CONTACT_ROCKET_FLIGHT_CONFIG.landingOverlap,
      };
    };

    const positionLandedRocketOnPlanet = (
      rocketLayer: HTMLElement,
      bounce = 0,
    ) => {
      const planetBounds = emailPlanet.getBoundingClientRect();
      const planetStyles = window.getComputedStyle(emailPlanet);
      const planetWidth = emailPlanet.offsetWidth || planetBounds.width;
      const attachmentScale =
        planetBounds.width > 0 && planetWidth > 0
          ? planetBounds.width / planetWidth
          : CONTACT_SYSTEM_SCALE;
      const planetSize =
        Number(planetStyles.getPropertyValue("--planet-size").replace("px", "")) ||
        planetWidth;
      const turnAngle = CONTACT_ROCKET_FLIGHT_CONFIG.counterclockwiseTurn;
      const rotatedRocketHalfHeight =
        Math.abs(Math.sin(turnAngle)) * rocketWidth / 2 +
        Math.abs(Math.cos(turnAngle)) * rocketHeight / 2;
      const visibleRocketBottomOffset =
        rocketPngVisibleBottomOffset > 0
          ? rocketPngVisibleBottomOffset
          : rotatedRocketHalfHeight *
            CONTACT_ROCKET_FLIGHT_CONFIG.landingVisualScale;
      const landingCenter = {
        x: planetBounds.left + planetBounds.width / 2,
        y:
          planetBounds.top +
          planetBounds.height / 2 -
          (attachmentScale * planetSize) / 2 -
          visibleRocketBottomOffset +
          CONTACT_ROCKET_FLIGHT_CONFIG.landingOverlap +
          bounce,
      };

      rocketLayer.dataset.flightAnchor = "planet";
      rocketLayer.style.position = "absolute";
      rocketLayer.style.left = `${landingCenter.x}px`;
      rocketLayer.style.top = `${landingCenter.y}px`;
      rocketLayer.style.width = `${rocketWidth}px`;
      rocketLayer.style.height = `${rocketHeight}px`;
      rocketLayer.style.filter = planetStyles.filter;
      rocketLayer.style.transform =
        `translate3d(-50%, -50%, 0) rotate(${turnAngle}rad)`;
      rocketFlightAngleRef.current = turnAngle;
    };

    const attachLandedRocketToPlanet = (
      rocketLayer: HTMLElement,
      bounce = 0,
    ) => {
      if (rocketLayer.parentNode !== rocketOverlay) {
        rocketOverlay.appendChild(rocketLayer);
      }
      positionLandedRocketOnPlanet(rocketLayer, bounce);
    };

    const detachRocketFromPlanet = (rocketLayer: HTMLElement) => {
      const bounds = rocketLayer.getBoundingClientRect();
      const center = {
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      };

      rocketLayer.removeAttribute("data-flight-anchor");
      if (rocketLayer.parentNode !== rocketOverlay) {
        rocketOverlay.appendChild(rocketLayer);
      }
      rocketLayer.style.position = "absolute";
      rocketLayer.style.left = `${center.x}px`;
      rocketLayer.style.top = `${center.y}px`;
      rocketLayer.style.width = `${rocketWidth}px`;
      rocketLayer.style.height = `${rocketHeight}px`;
      rocketLayer.style.removeProperty("filter");
      rocketLayer.style.transform =
        `translate3d(-50%, -50%, 0) rotate(${rocketFlightAngleRef.current}rad)`;

      return center;
    };

    const getSunMetrics = () => {
      const sunCore = sun.querySelector<HTMLElement>(".contact-sun__core");
      const coreBounds = sunCore?.getBoundingClientRect();
      const sunBounds = sun.getBoundingClientRect();
      const bounds =
        coreBounds && coreBounds.width > 0 ? coreBounds : sunBounds;

      return {
        center: {
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height / 2,
        },
        radius: Math.max(bounds.width, bounds.height) / 2,
      };
    };

    const getMinimumSunClearance = (
      p0: ContactPoint,
      p1: ContactPoint,
      p2: ContactPoint,
      p3: ContactPoint,
    ) => {
      const sunMetrics = getSunMetrics();
      let minimumClearance = Number.POSITIVE_INFINITY;

      for (let index = 0; index <= 24; index += 1) {
        const point = getCubicPoint(p0, p1, p2, p3, index / 24);
        minimumClearance = Math.min(
          minimumClearance,
          Math.hypot(
            point.x - sunMetrics.center.x,
            point.y - sunMetrics.center.y,
          ) -
            sunMetrics.radius -
            CONTACT_ROCKET_FLIGHT_CONFIG.sunAvoidancePadding,
        );
      }

      return minimumClearance;
    };

    const buildControlPoints = (
      p0: ContactPoint,
      p3: ContactPoint,
    ): { p1: ContactPoint; p2: ContactPoint } => {
      const differenceX = p3.x - p0.x;
      const differenceY = p3.y - p0.y;
      const distance = Math.hypot(differenceX, differenceY) || 1;
      const rightwardBoost = clamp(
        CONTACT_ROCKET_FLIGHT_CONFIG.horizontalTurnEaseDistance +
          Math.abs(differenceX) * 0.16,
        CONTACT_ROCKET_FLIGHT_CONFIG.horizontalTurnEaseDistance,
        280,
      );
      const approachDistance = clamp(
        distance * 0.18,
        84,
        CONTACT_ROCKET_FLIGHT_CONFIG.landingApproachDistance,
      );
      const arcMagnitude = clamp(
        distance * CONTACT_ROCKET_FLIGHT_CONFIG.curveStrength * 0.22,
        30,
        104,
      );
      const sunMetrics = getSunMetrics();
      const midpointY = (p0.y + p3.y) / 2;
      const awayFromSun = midpointY < sunMetrics.center.y ? -1 : 1;
      const offsets = [
        0,
        awayFromSun * arcMagnitude,
        -awayFromSun * arcMagnitude,
        awayFromSun * arcMagnitude * 1.55,
        -awayFromSun * arcMagnitude * 1.55,
      ];

      let bestCandidate: {
        p1: ContactPoint;
        p2: ContactPoint;
        score: number;
      } | null = null;

      offsets.forEach((offset, index) => {
        const p1 = {
          x: p0.x + rightwardBoost,
          y: p0.y,
        };
        const p2 = {
          x: p3.x,
          y:
            p3.y -
            approachDistance +
            offset * 0.42,
        };
        const length = estimateCubicLength(p0, p1, p2, p3);
        const clearance = getMinimumSunClearance(p0, p1, p2, p3);
        const score =
          clearance - length * 0.008 + (index === 0 ? 3 : 0);

        if (!bestCandidate || score > bestCandidate.score) {
          bestCandidate = { p1, p2, score };
        }
      });

      return bestCandidate ?? {
        p1: {
          x: p0.x + rightwardBoost,
          y: p0.y,
        },
        p2: {
          x: p3.x,
          y: p3.y - approachDistance,
        },
      };
    };

    const buildFlightPlan = (
      startTime: number,
      startPoint: ContactPoint,
      radius: number,
      startingAngle = 0,
    ): RocketFlightPlan => {
      const currentPlanetCenter = getOrbitPositionAt(startTime);
      const initialDistance = Math.hypot(
        currentPlanetCenter.x - startPoint.x,
        currentPlanetCenter.y - startPoint.y,
      );
      const verticalDescentDistance =
        CONTACT_ROCKET_FLIGHT_CONFIG.verticalDescentDistance;
      let duration = clamp(
        getRocketTimeForDistance(initialDistance) +
          getRocketDecelerationDuration(verticalDescentDistance),
        CONTACT_ROCKET_FLIGHT_CONFIG.minimumFlightDuration,
        CONTACT_ROCKET_FLIGHT_CONFIG.maximumFlightDuration,
      );
      const horizontalLaunchPoint = {
        x:
          startPoint.x +
          CONTACT_ROCKET_FLIGHT_CONFIG.horizontalLaunchDistance,
        y: startPoint.y,
      };
      const horizontalLaunchDistance = Math.hypot(
        horizontalLaunchPoint.x - startPoint.x,
        horizontalLaunchPoint.y - startPoint.y,
      );
      const horizontalLaunchDuration =
        getRocketTimeForDistance(horizontalLaunchDistance);
      let finalPlan: RocketFlightPlan | null = null;

      for (let iteration = 0; iteration < 6; iteration += 1) {
        const predictedPlanetCenter = getOrbitPositionAt(
          startTime + duration,
        );
        const landingPoint = getLandingPoint(predictedPlanetCenter, radius);
        const descentStartPoint = {
          x: landingPoint.x,
          y: landingPoint.y - verticalDescentDistance,
        };
        const controls = buildControlPoints(
          horizontalLaunchPoint,
          descentStartPoint,
        );
        const approachPathLength = estimateCubicLength(
          horizontalLaunchPoint,
          controls.p1,
          controls.p2,
          descentStartPoint,
        );
        const pathLength =
          horizontalLaunchDistance +
          approachPathLength +
          verticalDescentDistance;
        const descentStartDuration =
          getRocketTimeForDistance(
            horizontalLaunchDistance + approachPathLength,
          );
        const verticalDescentDuration = getRocketDecelerationDuration(
          verticalDescentDistance,
        );
        const nextDuration = clamp(
          descentStartDuration + verticalDescentDuration,
          CONTACT_ROCKET_FLIGHT_CONFIG.minimumFlightDuration,
          CONTACT_ROCKET_FLIGHT_CONFIG.maximumFlightDuration,
        );

        finalPlan = {
          startTime,
          duration,
          launchPoint: startPoint,
          horizontalLaunchPoint,
          horizontalLaunchDuration,
          p0: horizontalLaunchPoint,
          p1: controls.p1,
          p2: controls.p2,
          p3: descentStartPoint,
          landingPoint,
          rotationStartTime: startTime,
          rotationStartAngle: startingAngle,
          descentStartTime:
            startTime + descentStartDuration,
          verticalDescentDuration,
          landingPlanetCenter: predictedPlanetCenter,
          landingPlanetRadius: radius,
          totalPathLength: pathLength,
          horizontalLaunchDistance,
          approachPathLength,
          verticalDescentDistance,
          geometryRevision: orbitClockRef.current.geometryRevision,
        };

        if (Math.abs(nextDuration - duration) < 4 || iteration === 5) {
          return finalPlan;
        }

        duration = nextDuration;
      }

      return finalPlan as RocketFlightPlan;
    };

    const setFlightLayerPosition = (
      layer: HTMLElement,
      center: ContactPoint,
      angle: number,
      scaleX = 1,
    ) => {
      layer.style.left = `${center.x}px`;
      layer.style.top = `${center.y}px`;
      rocketFlightAngleRef.current = angle;
      layer.style.transform =
        `translate3d(-50%, -50%, 0) rotate(${angle}rad) scaleX(${scaleX})`;
    };

    const setLayerPosition = (
      center: ContactPoint,
      angle: number,
      scaleX = 1,
    ) => {
      if (!flightLayer) {
        return;
      }

      setFlightLayerPosition(flightLayer, center, angle, scaleX);
      currentCenter = center;
    };

    const setLayerPhase = (phase: string) => {
      flightLayer?.setAttribute("data-flight-phase", phase);
    };

    const setVacuumExtension = (extension: number) => {
      vacuumCurrentExtension = extension;
      vacuumElement?.style.setProperty("--vacuum-extension", `${extension}px`);
    };

    const setVacuumPhase = (phase: string) => {
      vacuumElement?.setAttribute("data-vacuum-phase", phase);
    };

    const removeVacuumElement = () => {
      vacuumElement?.remove();
      vacuumElement = null;
    };

    const removeVacuumLetters = () => {
      vacuumLetters.forEach(({ element }) => element.remove());
      vacuumLetters = [];
    };

    const restoreVacuumMessageField = () => {
      if (vacuumMessageField) {
        vacuumMessageField.style.color = previousMessageColor;
        vacuumMessageField.style.caretColor = previousMessageCaretColor;
        vacuumMessageField = null;
      }
    };

    const teardownVacuum = () => {
      removeVacuumLetters();
      dumpLetters = [];
      restoreVacuumMessageField();
      removeVacuumElement();
      vacuumTargetExtension = 0;
      vacuumCurrentExtension = 0;
    };

    const beginLaunchPhase = (time: number) => {
      flightStateRef.current = "launching";
      phaseStartedAt = time;
      setLayerPhase("preparing");
      rocketSmokeStartRef.current?.();
    };

    const createVacuumLetters = (
      textarea: HTMLTextAreaElement,
      mouth: ContactPoint,
    ) => {
      const textareaRect = textarea.getBoundingClientRect();
      const style = window.getComputedStyle(textarea);
      const mirror = document.createElement("div");
      const copiedProperties = [
        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStyle",
        "fontVariant",
        "letterSpacing",
        "wordSpacing",
        "lineHeight",
        "textTransform",
        "textIndent",
        "tabSize",
        "textAlign",
        "direction",
        "wordBreak",
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft",
        "borderTopWidth",
        "borderRightWidth",
        "borderBottomWidth",
        "borderLeftWidth",
      ] as const;
      copiedProperties.forEach((property) => {
        mirror.style[property] = style[property];
      });
      mirror.style.position = "absolute";
      mirror.style.visibility = "hidden";
      mirror.style.pointerEvents = "none";
      mirror.style.margin = "0";
      mirror.style.overflow = "hidden";
      mirror.style.boxSizing = "border-box";
      mirror.style.whiteSpace = "pre-wrap";
      mirror.style.overflowWrap = "break-word";
      mirror.style.borderStyle = "solid";
      mirror.style.borderColor = "transparent";
      mirror.style.left = `${textareaRect.left}px`;
      mirror.style.top = `${textareaRect.top}px`;
      mirror.style.height = `${textareaRect.height}px`;
      mirror.style.width = `${
        textarea.clientWidth +
        parseFloat(style.borderLeftWidth) +
        parseFloat(style.borderRightWidth)
      }px`;

      // Each character is measured in a hidden copy wrapped like the textarea,
      // so the particles start exactly where the text is drawn.
      const mirrorGlyphs: Array<{ char: string; span: HTMLSpanElement }> = [];
      Array.from(textarea.value).forEach((char) => {
        if (/\s/.test(char)) {
          mirror.appendChild(document.createTextNode(char));
          return;
        }

        const span = document.createElement("span");
        span.textContent = char;
        mirror.appendChild(span);
        mirrorGlyphs.push({ char, span });
      });
      rocketOverlay.appendChild(mirror);
      mirror.scrollTop = textarea.scrollTop;

      const visibleTop =
        textareaRect.top + parseFloat(style.borderTopWidth);
      const visibleBottom =
        textareaRect.bottom - parseFloat(style.borderBottomWidth);
      const visibleGlyphs = mirrorGlyphs
        .map(({ char, span }) => ({
          char,
          rect: span.getBoundingClientRect(),
        }))
        .filter(({ rect }) => {
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          return (
            rect.width > 0 &&
            centerY >= visibleTop &&
            centerY <= visibleBottom &&
            centerX >= textareaRect.left &&
            centerX <= textareaRect.right
          );
        })
        .slice(0, CONTACT_ROCKET_FLIGHT_CONFIG.vacuumMaxLetters);
      mirror.remove();

      const letters = visibleGlyphs.map(({ char, rect }): VacuumLetter => {
        const element = document.createElement("span");
        element.className = "contact-flight-letter";
        element.textContent = char;
        element.style.left = `${rect.left}px`;
        element.style.top = `${rect.top}px`;
        element.style.width = `${rect.width}px`;
        element.style.height = `${rect.height}px`;
        element.style.lineHeight = `${rect.height}px`;
        element.style.fontFamily = style.fontFamily;
        element.style.fontSize = style.fontSize;
        element.style.fontWeight = style.fontWeight;
        element.style.fontStyle = style.fontStyle;
        element.style.letterSpacing = style.letterSpacing;
        element.style.textTransform = style.textTransform;
        element.style.color = style.color;
        rocketOverlay.insertBefore(element, flightLayer);

        return {
          element,
          start: {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          },
          control: { x: 0, y: 0 },
          delay: 0,
          duration: 0,
          spin: 0,
          width: rect.width,
          height: rect.height,
        };
      });

      const distances = letters.map((letter) =>
        Math.hypot(letter.start.x - mouth.x, letter.start.y - mouth.y),
      );
      const maxDistance = Math.max(1, ...distances);

      letters.forEach((letter, index) => {
        const config = CONTACT_ROCKET_FLIGHT_CONFIG;
        const duration =
          config.vacuumLetterDuration +
          (Math.random() * 2 - 1) * config.vacuumLetterDurationJitter;
        const spread = clamp(
          (distances[index] / maxDistance) * 0.7 + Math.random() * 0.3,
          0,
          1,
        );

        letter.duration = duration;
        letter.delay = spread * (config.vacuumSuctionDuration - duration);
        letter.spin =
          (letter.start.x < mouth.x ? -1 : 1) * (0.9 + Math.random() * 1.7);
        letter.control = {
          x:
            lerp(letter.start.x, mouth.x, 0.8) +
            (Math.random() * 2 - 1) * 6,
          y: lerp(letter.start.y, mouth.y, 0.35),
        };
      });

      if (letters.length > 0) {
        vacuumMessageField = textarea;
        previousMessageColor = textarea.style.color;
        previousMessageCaretColor = textarea.style.caretColor;
        textarea.style.color = "transparent";
        textarea.style.caretColor = "transparent";
      }

      return letters;
    };

    const updateVacuumLetters = (suctionElapsed: number) => {
      const config = CONTACT_ROCKET_FLIGHT_CONFIG;

      vacuumLetters.forEach((letter) => {
        const progress = (suctionElapsed - letter.delay) / letter.duration;

        if (progress < 0) {
          const remaining = letter.delay - suctionElapsed;
          if (remaining < config.vacuumLetterPrewobble) {
            const amplitude =
              0.8 * (1 - remaining / config.vacuumLetterPrewobble);
            letter.element.style.transform = `translate3d(${
              (Math.random() * 2 - 1) * amplitude
            }px, ${(Math.random() * 2 - 1) * amplitude}px, 0)`;
          }
          return;
        }

        if (progress >= 1) {
          if (letter.element.style.visibility !== "hidden") {
            letter.element.style.visibility = "hidden";
          }
          return;
        }

        const eased = progress ** 1.7;
        const inverse = 1 - eased;
        const point = {
          x:
            inverse * inverse * letter.start.x +
            2 * inverse * eased * letter.control.x +
            eased * eased * vacuumMouth.x,
          y:
            inverse * inverse * letter.start.y +
            2 * inverse * eased * letter.control.y +
            eased * eased * vacuumMouth.y,
        };
        const scale = lerp(1, 0.28, eased);
        const rotation = letter.spin * eased;

        letter.element.style.transform = `translate3d(${
          point.x - letter.start.x
        }px, ${point.y - letter.start.y}px, 0) rotate(${rotation}rad) scale(${scale})`;
        letter.element.style.opacity = `${
          progress < 0.72 ? 1 : 1 - (progress - 0.72) / 0.28
        }`;
      });
    };

    const hideVacuumLetters = () => {
      vacuumLetters.forEach(({ element }) => {
        element.style.visibility = "hidden";
      });
    };

    const beginDumpPhase = (time: number) => {
      const config = CONTACT_ROCKET_FLIGHT_CONFIG;
      const sortedLetters = [...vacuumLetters].sort(
        (a, b) => b.delay - a.delay,
      );
      const lastIndex = Math.max(1, sortedLetters.length - 1);

      flightStateRef.current = "dumping";
      phaseStartedAt = time;
      setLayerPhase("dumping");
      emailPlanet.classList.add("contact-planet--absorbing");
      dumpLetters = sortedLetters.map((letter, index) => ({
        letter,
        delay:
          (index / lastIndex) * config.dumpPourDuration * 0.92 +
          Math.random() * config.dumpPourDuration * 0.08,
        offsetX: (Math.random() * 2 - 1) * 5,
        vx: (Math.random() * 2 - 1) * 26,
        vy: 16 + Math.random() * 28,
        spin: (Math.random() * 2 - 1) * 3.2,
        startY: 0,
        emittedAt: null,
        done: false,
      }));
    };

    const updateDumpLetters = (
      pourElapsed: number,
      time: number,
      center: ContactPoint,
      radius: number,
      lift: number,
    ) => {
      const config = CONTACT_ROCKET_FLIGHT_CONFIG;

      dumpLetters.forEach((dump) => {
        if (dump.done || pourElapsed < dump.delay) {
          return;
        }

        const { element, width, height } = dump.letter;
        if (dump.emittedAt === null) {
          dump.emittedAt = time;
          dump.startY = -radius - lift - config.dumpNozzleInset;
          element.style.left = "0px";
          element.style.top = "0px";
          element.style.visibility = "visible";
        }

        const age = (time - dump.emittedAt) / 1000;
        const x = dump.offsetX + dump.vx * age;
        const y =
          dump.startY + dump.vy * age + 0.5 * config.dumpGravity * age * age;
        const surfaceY = -Math.sqrt(Math.max(0, radius * radius - x * x));
        const depth = y - surfaceY;

        if (depth >= config.dumpAbsorbDepth || age > 2.5) {
          element.style.visibility = "hidden";
          dump.done = true;
          return;
        }

        const absorbProgress = Math.max(0, depth) / config.dumpAbsorbDepth;
        element.style.opacity = `${1 - absorbProgress}`;
        element.style.transform = `translate3d(${
          center.x + x - width / 2
        }px, ${center.y + y - height / 2}px, 0) rotate(${
          dump.spin * age
        }rad) scale(${lerp(1, 0.55, absorbProgress)})`;
      });
    };

    const clearLandedRocket = () => {
      const rocketToClear = landedRocket;
      rocketToClear?.parentNode?.removeChild(rocketToClear);
      if (rocketFlightLayerRef.current === rocketToClear) {
        rocketFlightLayerRef.current = null;
      }
      landedRocket = null;
    };

    const updateLandedRocketPosition = () => {
      if (landedRocket) {
        positionLandedRocketOnPlanet(landedRocket);
      }
    };
    landedRocketPositionRef.current = updateLandedRocketPosition;

    const measureSlotCenter = (): ContactPoint | null => {
      const visible = rocket.getBoundingClientRect();
      const bounds =
        visible.width > 0 ? visible : rocketButton.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) {
        return null;
      }

      return {
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      };
    };

    const buildReturnPlan = (
      startTime: number,
      startPoint: ContactPoint,
      heading: ContactPoint,
      slot: ContactPoint,
      distanceOffset: number,
    ): RocketReturnPlan => {
      const config = CONTACT_ROCKET_FLIGHT_CONFIG;
      const approach = {
        x: Math.cos(config.returnApproachAngle),
        y: Math.sin(config.returnApproachAngle),
      };
      const approachStart = {
        x: slot.x - approach.x * config.returnApproachDistance,
        y: slot.y - approach.y * config.returnApproachDistance,
      };
      const chord =
        Math.hypot(approachStart.x - startPoint.x, approachStart.y - startPoint.y) ||
        1;
      const control = clamp(
        chord * config.returnCurveStrength,
        config.returnControlMin,
        config.returnControlMax,
      );
      const p0 = startPoint;
      const p2 = {
        x: approachStart.x - approach.x * control,
        y: approachStart.y - approach.y * control,
      };
      const p3 = approachStart;

      let bestP1: ContactPoint = {
        x: p0.x + heading.x * control,
        y: p0.y + heading.y * control,
      };
      let bestScore = Number.NEGATIVE_INFINITY;
      [1, 0.62, 0.38].forEach((scale, index) => {
        const p1 = {
          x: p0.x + heading.x * control * scale,
          y: p0.y + heading.y * control * scale,
        };
        const length = estimateCubicLength(p0, p1, p2, p3);
        const clearance = getMinimumSunClearance(p0, p1, p2, p3);
        const score = clearance - length * 0.008 + (index === 0 ? 3 : 0);

        if (score > bestScore) {
          bestScore = score;
          bestP1 = p1;
        }
      });

      const flareControl = config.returnApproachDistance * 0.45;
      const q0 = approachStart;
      const q1 = {
        x: approachStart.x + approach.x * flareControl,
        y: approachStart.y + approach.y * flareControl,
      };
      const q2 = { x: slot.x - flareControl, y: slot.y };
      const q3 = slot;
      const cruiseLength = estimateCubicLength(p0, bestP1, p2, p3);
      const flareLength = estimateCubicLength(q0, q1, q2, q3);

      return {
        startTime,
        distanceOffset,
        p0,
        p1: bestP1,
        p2,
        p3,
        cruiseLength,
        q0,
        q1,
        q2,
        q3,
        flareLength,
        flareStartTime:
          startTime +
          getRocketTimeForDistance(distanceOffset + cruiseLength) /
            config.returnSpeedScale,
        flareDuration:
          getRocketDecelerationDuration(flareLength) / config.returnSpeedScale,
        slot,
        geometryRevision: orbitClockRef.current.geometryRevision,
      };
    };

    const getReturnPose = (plan: RocketReturnPlan, distance: number) => {
      const useCruise = distance <= plan.cruiseLength;
      const [c0, c1, c2, c3] = useCruise
        ? [plan.p0, plan.p1, plan.p2, plan.p3]
        : [plan.q0, plan.q1, plan.q2, plan.q3];
      const segmentDistance = useCruise
        ? distance
        : distance - plan.cruiseLength;
      const segmentLength = useCruise ? plan.cruiseLength : plan.flareLength;
      const progress = getCubicProgressAtDistance(
        c0,
        c1,
        c2,
        c3,
        segmentDistance,
        segmentLength,
      );
      const tangent = getCubicTangent(c0, c1, c2, c3, progress);

      return {
        point: getCubicPoint(c0, c1, c2, c3, progress),
        angle: Math.atan2(tangent.y, tangent.x),
      };
    };

    const beginDepartPhase = (time: number) => {
      if (!flightLayer) {
        settleFlight();
        return;
      }

      emailPlanet.classList.remove("contact-planet--absorbing");
      const detachCenter = detachRocketFromPlanet(flightLayer);
      const live = getLivePlanetMetrics();
      const seat = getLandingPoint(live.center, live.radius || planetRadius);
      departSeatOffset = {
        x: detachCenter.x - seat.x,
        y: detachCenter.y - seat.y,
      };
      currentCenter = detachCenter;
      flightStateRef.current = "departing";
      phaseStartedAt = time;
      setLayerPhase("ignition");
    };

    const beginHomeboundPhase = (time: number) => {
      const slot = measureSlotCenter() ?? launchCenter;
      if (!slot || !currentCenter) {
        settleFlight(new Error("Rocket return position is unavailable."));
        return;
      }

      launchCenter = slot;
      emailPlanet.classList.remove("contact-planet--rocket-contact");
      returnPlan = buildReturnPlan(
        time,
        currentCenter,
        { x: 0, y: -1 },
        slot,
        0,
      );
      lastPlanRebuildAt = time;
      geometryDirty = false;
      flightStateRef.current = "homebound";
      phaseStartedAt = time;
      setLayerPhase("flying");
    };

    const restoreSubmissionLock = () => {
      controlsBeforeFlight.forEach(({ element, disabled }) => {
        element.disabled = disabled;
      });
      controlsBeforeFlight = [];
      rocketButton.disabled = previousButtonDisabled;
      rocketButton.style.visibility = previousButtonVisibility;
      rocketButton.style.pointerEvents = previousButtonPointerEvents;

      if (previousFormBusy === null) {
        form.removeAttribute("aria-busy");
      } else {
        form.setAttribute("aria-busy", previousFormBusy);
      }

      if (previousContactFlight === undefined) {
        delete rocketButton.dataset.contactFlight;
      } else {
        rocketButton.dataset.contactFlight = previousContactFlight;
      }
      if (previousContactSubmission === undefined) {
        delete rocketButton.dataset.contactSubmission;
      } else {
        rocketButton.dataset.contactSubmission = previousContactSubmission;
      }

      emailPlanet.classList.remove(
        "contact-planet--rocket-contact",
        "contact-planet--reduced-highlight",
        "contact-planet--absorbing",
      );
    };

    const settleFlight = (error?: unknown, preserveLandedRocket = false) => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      window.clearTimeout(reducedMotionTimer);
      reducedMotionTimer = 0;

      if (preserveLandedRocket && flightLayer) {
        landedRocket = flightLayer;
        attachLandedRocketToPlanet(landedRocket);
        rocketFlightLayerRef.current = landedRocket;
      } else if (flightLayer?.parentNode) {
        flightLayer.parentNode.removeChild(flightLayer);
        rocketFlightLayerRef.current = null;
      }
      flightLayer = null;
      rocketFlightAngleRef.current = 0;
      activePlan = null;
      returnPlan = null;
      launchCenter = null;
      currentCenter = null;
      landingStart = null;
      returningToForm = false;
      returnFromAngle = 0;

      teardownVacuum();
      restoreSubmissionLock();
      rocketSmokeStopRef.current?.();

      if (preserveLandedRocket) {
        // Keep the form's space stable, but leave the landed clone as the
        // only visible rocket after a successful submission.
        rocketButton.style.visibility = "hidden";
        rocketButton.style.pointerEvents = "none";
        rocketButton.dataset.contactFlight = "landed";
      }

      const resolve = resolveFlight;
      const reject = rejectFlight;
      resolveFlight = null;
      rejectFlight = null;
      flightStateRef.current = error ? "error" : "complete";

      if (error) {
        reject?.(error);
      } else {
        resolve?.();
      }

      flightStateRef.current = "idle";
    };

    const beginFlyingPhase = (time: number) => {
      if (!launchCenter) {
        settleFlight(new Error("Rocket launch position is unavailable."));
        return;
      }

      const livePlanetMetrics = getLivePlanetMetrics();
      if (livePlanetMetrics.radius <= 0) {
        settleFlight(new Error("Email planet position is unavailable."));
        return;
      }

      planetRadius = livePlanetMetrics.radius;
      activePlan = buildFlightPlan(time, launchCenter, planetRadius, 0);
      lastPlanRebuildAt = time;
      geometryDirty = false;
      flightStateRef.current = "flying";
      phaseStartedAt = time;
      setLayerPhase("flying");
    };

    const cancelFlight = () => {
      if (flightStateRef.current === "idle") {
        return;
      }

      if (!flightLayer || !currentCenter || !launchCenter) {
        settleFlight(new Error("Contact flight cancelled."));
        return;
      }

      if (flightLayer.dataset.flightAnchor === "planet") {
        currentCenter = detachRocketFromPlanet(flightLayer);
      }

      returningToForm = true;
      returnStartedAt = performance.now();
      returnFrom = currentCenter;
      returnFromAngle = rocketFlightAngleRef.current;
      returnVacuumExtension = vacuumCurrentExtension;
      setVacuumPhase("retracting");
      removeVacuumLetters();
      dumpLetters = [];
      restoreVacuumMessageField();
      flightStateRef.current = "error";
      setLayerPhase("returning");
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(renderFrame);
      }
    };

    const renderFrame = (time: number) => {
      animationFrame = 0;

      if (!flightLayer) {
        return;
      }

      if (returningToForm && returnFrom && launchCenter) {
        const progress = clamp(
          (time - returnStartedAt) / 340,
          0,
          1,
        );
        const point = lerpPoint(
          returnFrom,
          launchCenter,
          easeOutCubic(progress),
        );
        setLayerPosition(
          point,
          lerpAngle(returnFromAngle, 0, easeOutCubic(progress)),
        );
        setVacuumExtension(
          lerp(returnVacuumExtension, 0, easeOutCubic(progress)),
        );

        if (progress >= 1) {
          settleFlight(new Error("Contact submission failed."));
          return;
        }

        animationFrame = window.requestAnimationFrame(renderFrame);
        return;
      }

      switch (flightStateRef.current) {
        case "vacuuming": {
          if (!launchCenter || !vacuumElement) {
            beginLaunchPhase(time);
            break;
          }

          const config = CONTACT_ROCKET_FLIGHT_CONFIG;
          const elapsed = Math.max(0, time - phaseStartedAt);
          const suctionEnd =
            config.vacuumRiseDuration + config.vacuumSuctionDuration;
          const retractEnd = suctionEnd + config.vacuumRetractDuration;

          if (elapsed < config.vacuumRiseDuration) {
            setVacuumPhase("rising");
            setVacuumExtension(
              vacuumTargetExtension *
                easeOutBack(elapsed / config.vacuumRiseDuration),
            );
          } else if (elapsed < suctionEnd) {
            setVacuumPhase("sucking");
            setVacuumExtension(vacuumTargetExtension);
            updateVacuumLetters(elapsed - config.vacuumRiseDuration);
          } else if (elapsed < retractEnd) {
            setVacuumPhase("retracting");
            hideVacuumLetters();
            setVacuumExtension(
              vacuumTargetExtension *
                (1 -
                  easeInCubic(
                    (elapsed - suctionEnd) / config.vacuumRetractDuration,
                  )),
            );
          } else {
            removeVacuumElement();
            beginLaunchPhase(time);
          }

          setLayerPosition(launchCenter, 0);
          break;
        }
        case "launching": {
          if (!launchCenter) {
            settleFlight(new Error("Rocket launch position is unavailable."));
            return;
          }

          const elapsed = time - phaseStartedAt;
          if (
            elapsed < CONTACT_ROCKET_FLIGHT_CONFIG.preparationDuration
          ) {
            setLayerPhase("preparing");
            setLayerPosition(launchCenter, 0);
          } else if (
            elapsed <
            CONTACT_ROCKET_FLIGHT_CONFIG.preparationDuration +
              CONTACT_ROCKET_FLIGHT_CONFIG.ignitionDuration
          ) {
            const ignitionProgress = clamp(
              (elapsed - CONTACT_ROCKET_FLIGHT_CONFIG.preparationDuration) /
                CONTACT_ROCKET_FLIGHT_CONFIG.ignitionDuration,
              0,
              1,
            );
            const compression =
              Math.sin(ignitionProgress * Math.PI) * 4.5;
            setLayerPhase("ignition");
            setLayerPosition(
              { x: launchCenter.x - compression, y: launchCenter.y },
              0,
              1 - Math.sin(ignitionProgress * Math.PI) * 0.025,
            );
          } else {
            beginFlyingPhase(time);
          }
          break;
        }
        case "flying": {
          if (!activePlan) {
            beginFlyingPhase(time);
            break;
          }

          if (
            (geometryDirty ||
              activePlan.geometryRevision !==
                orbitClockRef.current.geometryRevision) &&
            time - lastPlanRebuildAt > 180 &&
            currentCenter
          ) {
            const livePlanetMetrics = getLivePlanetMetrics();
            planetRadius = livePlanetMetrics.radius || planetRadius;
            activePlan = buildFlightPlan(
              time,
              currentCenter,
              planetRadius,
              rocketFlightAngleRef.current,
            );
            lastPlanRebuildAt = time;
            geometryDirty = false;
          }

          const elapsed = time - activePlan.startTime;
          const preDescentDistance =
            activePlan.horizontalLaunchDistance +
            activePlan.approachPathLength;
          const isDescending = time >= activePlan.descentStartTime;
          const travelDistance = isDescending
            ? preDescentDistance
            : clamp(
                getRocketDistanceAtTime(elapsed),
                0,
                preDescentDistance,
              );
          const horizontalProgress = clamp(
            travelDistance / Math.max(1, activePlan.horizontalLaunchDistance),
            0,
            1,
          );
          const approachDistance = Math.max(
            0,
            travelDistance - activePlan.horizontalLaunchDistance,
          );
          const descentProgress = isDescending
            ? clamp(
                (time - activePlan.descentStartTime) /
                  Math.max(1, activePlan.verticalDescentDuration),
                0,
                1,
              )
            : 0;
          let point: ContactPoint;

          if (travelDistance < activePlan.horizontalLaunchDistance) {
            point = lerpPoint(
              activePlan.launchPoint,
              activePlan.horizontalLaunchPoint,
              horizontalProgress,
            );
          } else if (approachDistance < activePlan.approachPathLength) {
            point = getCubicPointAtDistance(
              activePlan.p0,
              activePlan.p1,
              activePlan.p2,
              activePlan.p3,
              approachDistance,
              activePlan.approachPathLength,
            );
          } else if (isDescending) {
            point = lerpPoint(
              activePlan.p3,
              activePlan.landingPoint,
              easeOutPower(
                descentProgress,
                CONTACT_ROCKET_FLIGHT_CONFIG.descentDecelerationScale,
              ),
            );
          } else {
            point = activePlan.p3;
          }
          const rotationProgress = clamp(
            (time - activePlan.rotationStartTime) /
              Math.max(
                1,
                activePlan.descentStartTime -
                  activePlan.rotationStartTime,
              ),
            0,
            1,
          );
          const angle = lerp(
            activePlan.rotationStartAngle,
            CONTACT_ROCKET_FLIGHT_CONFIG.counterclockwiseTurn,
            easeInOutCubic(rotationProgress),
          );

          setLayerPhase("flying");
          setLayerPosition(point, angle);

          if (elapsed >= activePlan.duration) {
            currentCenter = activePlan.landingPoint;
            landingStart = activePlan.landingPoint;
            phaseStartedAt = time;
            flightStateRef.current = "landing";
            setLayerPhase("landing");
          }
          break;
        }
        case "landing": {
          const livePlanetMetrics = getLivePlanetMetrics();
          const target = getLandingPoint(
            livePlanetMetrics.center,
            livePlanetMetrics.radius || planetRadius,
          );
          const progress = clamp(
            (time - phaseStartedAt) /
              CONTACT_ROCKET_FLIGHT_CONFIG.landingDuration,
            0,
            1,
          );
          const point = lerpPoint(
            landingStart ?? target,
            target,
            easeOutCubic(progress),
          );
          const bounce =
            Math.sin(progress * Math.PI) *
            CONTACT_ROCKET_FLIGHT_CONFIG.landingBounce *
            0.55;
          setLayerPosition(
            { x: point.x, y: point.y + bounce },
            CONTACT_ROCKET_FLIGHT_CONFIG.counterclockwiseTurn,
          );

          if (progress >= 1) {
            flightStateRef.current = "landed";
            phaseStartedAt = time;
            emailPlanet.classList.add("contact-planet--rocket-contact");
            setLayerPhase("landed");
            if (flightLayer) {
              attachLandedRocketToPlanet(flightLayer);
            }
          }
          break;
        }
        case "landed": {
          const elapsed = time - phaseStartedAt;
          const bounceProgress = clamp(elapsed / 260, 0, 1);
          const bounce =
            Math.sin(bounceProgress * Math.PI) *
            CONTACT_ROCKET_FLIGHT_CONFIG.landingBounce;
          if (flightLayer?.dataset.flightAnchor === "planet") {
            positionLandedRocketOnPlanet(flightLayer, bounce);
          } else {
            const orbitPlanetMetrics = getOrbitPlanetMetrics(time);
            const target = getLandingPoint(
              orbitPlanetMetrics.center,
              orbitPlanetMetrics.radius,
            );
            setLayerPosition(
              { x: target.x, y: target.y + bounce },
              CONTACT_ROCKET_FLIGHT_CONFIG.counterclockwiseTurn,
            );
          }

          if (
            elapsed >= CONTACT_ROCKET_FLIGHT_CONFIG.landedDuration
          ) {
            if (vacuumLetters.length > 0) {
              beginDumpPhase(time);
              break;
            }
            beginDepartPhase(time);
            break;
          }
          break;
        }
        case "dumping": {
          const config = CONTACT_ROCKET_FLIGHT_CONFIG;
          const elapsed = Math.max(0, time - phaseStartedAt);
          const pourStart = config.dumpLiftDuration;
          const lowerStart =
            pourStart + config.dumpPourDuration + config.dumpPourTail;
          const end = lowerStart + config.dumpLowerDuration;
          const lift =
            elapsed < pourStart
              ? config.dumpLift * easeOutCubic(elapsed / pourStart)
              : elapsed < lowerStart
                ? config.dumpLift +
                  Math.sin((elapsed - pourStart) / 140) * 0.8
                : config.dumpLift *
                  (1 -
                    easeInOutCubic(
                      clamp(
                        (elapsed - lowerStart) / config.dumpLowerDuration,
                        0,
                        1,
                      ),
                    ));

          if (flightLayer) {
            if (flightLayer.dataset.flightAnchor === "planet") {
              positionLandedRocketOnPlanet(flightLayer, -lift);
            } else {
              attachLandedRocketToPlanet(flightLayer, -lift);
            }
          }

          const planet = getLivePlanetMetrics();
          updateDumpLetters(
            elapsed - pourStart,
            time,
            planet.center,
            planet.radius || planetRadius,
            lift,
          );

          if (elapsed >= end && dumpLetters.every((dump) => dump.done)) {
            beginDepartPhase(time);
            break;
          }
          break;
        }
        case "departing": {
          const config = CONTACT_ROCKET_FLIGHT_CONFIG;
          const live = getLivePlanetMetrics();
          const seat = getLandingPoint(live.center, live.radius || planetRadius);
          const base = {
            x: seat.x + departSeatOffset.x,
            y: seat.y + departSeatOffset.y,
          };
          const progress = clamp(
            (time - phaseStartedAt) / config.returnIgnitionDuration,
            0,
            1,
          );
          const compression = Math.sin(progress * Math.PI) * 4.5;

          setLayerPhase("ignition");
          setLayerPosition(
            { x: base.x, y: base.y + compression },
            config.counterclockwiseTurn,
            1 - Math.sin(progress * Math.PI) * 0.025,
          );

          if (progress >= 1) {
            beginHomeboundPhase(time);
          }
          break;
        }
        case "homebound": {
          const config = CONTACT_ROCKET_FLIGHT_CONFIG;
          let plan = returnPlan;
          if (!plan) {
            beginHomeboundPhase(time);
            break;
          }

          if (
            (geometryDirty ||
              plan.geometryRevision !==
                orbitClockRef.current.geometryRevision) &&
            time - lastPlanRebuildAt > 180 &&
            currentCenter
          ) {
            const slot = measureSlotCenter() ?? plan.slot;
            const travelled = clamp(
              getRocketDistanceAtTime(
                (time - plan.startTime) * config.returnSpeedScale,
              ) - plan.distanceOffset,
              0,
              plan.cruiseLength,
            );

            if (
              time < plan.flareStartTime &&
              plan.cruiseLength - travelled >= 80
            ) {
              returnPlan = buildReturnPlan(
                plan.startTime,
                currentCenter,
                {
                  x: Math.cos(rocketFlightAngleRef.current),
                  y: Math.sin(rocketFlightAngleRef.current),
                },
                slot,
                plan.distanceOffset + travelled,
              );
            } else {
              const delta = {
                x: slot.x - plan.slot.x,
                y: slot.y - plan.slot.y,
              };
              const shift = (point: ContactPoint) => ({
                x: point.x + delta.x,
                y: point.y + delta.y,
              });
              returnPlan = {
                ...plan,
                p0: shift(plan.p0),
                p1: shift(plan.p1),
                p2: shift(plan.p2),
                p3: shift(plan.p3),
                q0: shift(plan.q0),
                q1: shift(plan.q1),
                q2: shift(plan.q2),
                q3: shift(plan.q3),
                slot,
                geometryRevision: orbitClockRef.current.geometryRevision,
              };
            }
            plan = returnPlan ?? plan;
            launchCenter = slot;
            lastPlanRebuildAt = time;
            geometryDirty = false;
          }

          const scaledElapsed = (time - plan.startTime) * config.returnSpeedScale;
          let distance: number;
          let progress = 0;
          if (time < plan.flareStartTime) {
            distance = clamp(
              getRocketDistanceAtTime(scaledElapsed) - plan.distanceOffset,
              0,
              plan.cruiseLength,
            );
            setLayerPhase("flying");
          } else {
            progress = clamp(
              (time - plan.flareStartTime) / Math.max(1, plan.flareDuration),
              0,
              1,
            );
            distance =
              plan.cruiseLength +
              plan.flareLength *
                easeOutPower(
                  progress,
                  config.descentDecelerationScale,
                );
            setLayerPhase(progress < 0.4 ? "flying" : "landing");
          }

          const pose = getReturnPose(plan, distance);
          setLayerPosition(pose.point, pose.angle);

          if (time >= plan.flareStartTime && progress >= 1) {
            dockingStartAngle = rocketFlightAngleRef.current;
            flightStateRef.current = "docking";
            phaseStartedAt = time;
            setLayerPhase("complete");
          }
          break;
        }
        case "docking": {
          const config = CONTACT_ROCKET_FLIGHT_CONFIG;
          if (geometryDirty) {
            launchCenter = measureSlotCenter() ?? launchCenter;
            geometryDirty = false;
          }

          const slot = launchCenter ?? returnPlan?.slot;
          if (!slot) {
            settleFlight();
            return;
          }

          const progress = clamp(
            (time - phaseStartedAt) / config.returnDockingDuration,
            0,
            1,
          );
          if (progress >= 1) {
            setLayerPosition(slot, 0);
            settleFlight();
            return;
          }

          setLayerPosition(
            {
              x: slot.x + Math.sin(progress * Math.PI) * config.returnDockingSlide,
              y: slot.y,
            },
            lerpAngle(dockingStartAngle, 0, easeOutCubic(progress)),
          );
          break;
        }
        case "complete": {
          if (time - phaseStartedAt >= 240) {
            settleFlight();
            return;
          }
          break;
        }
        default:
          break;
      }

      if (flightLayer && flightStateRef.current !== "idle") {
        animationFrame = window.requestAnimationFrame(renderFrame);
      }
    };

    const lockFormForFlight = () => {
      previousButtonDisabled = rocketButton.disabled;
      previousButtonVisibility = rocketButton.style.visibility;
      previousButtonPointerEvents = rocketButton.style.pointerEvents;
      previousFormBusy = form.getAttribute("aria-busy");
      previousContactFlight = rocketButton.dataset.contactFlight;
      previousContactSubmission = rocketButton.dataset.contactSubmission;
      controlsBeforeFlight = Array.from(
        form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>(
          "input, textarea, button",
        ),
      ).map((element) => ({
        element,
        disabled: element.disabled,
      }));
      controlsBeforeFlight.forEach(({ element }) => {
        element.disabled = true;
      });
      form.setAttribute("aria-busy", "true");
      rocketButton.disabled = true;
    };

    const startFlight = (_payload: ContactSubmissionPayload) =>
      new Promise<void>((resolve, reject) => {
        if (flightStateRef.current !== "idle") {
          reject(new Error("Contact form is already submitting."));
          return;
        }

        clearLandedRocket();
        resolveFlight = resolve;
        rejectFlight = reject;
        flightStateRef.current = "launching";
        phaseStartedAt = performance.now();
        activePlan = null;
        returnPlan = null;
        returningToForm = false;
        geometryDirty = false;

        try {
          lockFormForFlight();
          rocketButton.dataset.contactSubmission = "active";
          rocketButton.dataset.contactFlight = "preparing";

          // Read both the submit button and its visible artwork immediately
          // before cloning so the flight starts in viewport coordinates.
          const buttonBounds = rocketButton.getBoundingClientRect();
          const visibleRocketBounds = rocket.getBoundingClientRect();
          const artworkBounds =
            visibleRocketBounds.width > 0 ? visibleRocketBounds : buttonBounds;
          const livePlanetMetrics = getLivePlanetMetrics();

          if (
            artworkBounds.width <= 0 ||
            artworkBounds.height <= 0 ||
            livePlanetMetrics.radius <= 0
          ) {
            throw new Error("Contact flight measurements are unavailable.");
          }

          rocketWidth = artworkBounds.width;
          rocketHeight = artworkBounds.height;
          const rocketImageBounds = rocketImage.getBoundingClientRect();
          const visibleRocketLeft =
            rocketImageBounds.left +
            (CONTACT_ROCKET_PNG_VISIBLE_LEFT / CONTACT_ROCKET_PNG_WIDTH) *
              rocketImageBounds.width;
          rocketPngVisibleBottomOffset = Math.max(
            0,
            artworkBounds.left + artworkBounds.width / 2 - visibleRocketLeft,
          );
          planetRadius = livePlanetMetrics.radius;
          launchCenter = {
            x: artworkBounds.left + artworkBounds.width / 2,
            y: artworkBounds.top + artworkBounds.height / 2,
          };
          currentCenter = launchCenter;

          if (reducedMotion) {
            emailPlanet.classList.add("contact-planet--reduced-highlight");
            rocketButton.dataset.contactFlight = "reduced";
            reducedMotionTimer = window.setTimeout(() => {
              settleFlight();
            }, 260);
            return;
          }

          flightLayer = rocket.cloneNode(true) as HTMLElement;
          flightLayer.classList.add("contact-flight-rocket");
          flightLayer.setAttribute("aria-hidden", "true");
          flightLayer.style.position = "absolute";
          flightLayer.style.zIndex = "1";
          flightLayer.style.pointerEvents = "none";
          flightLayer.style.width = `${rocketWidth}px`;
          flightLayer.style.height = `${rocketHeight}px`;
          flightLayer.style.aspectRatio = "auto";
          flightLayer.style.margin = "0";
          flightLayer.style.transformOrigin = "50% 50%";
          flightLayer.style.transition = "none";
          flightLayer.style.opacity = "1";
          flightLayer.style.willChange = "transform, opacity";

          const ignitionSmoke = document.createElement("span");
          ignitionSmoke.className = "contact-flight-ignition-smoke";
          ignitionSmoke.setAttribute("aria-hidden", "true");
          flightLayer.appendChild(ignitionSmoke);
          rocketOverlay.appendChild(flightLayer);
          rocketFlightLayerRef.current = flightLayer;

          const messageInput = form.elements.namedItem("message");
          const messageField =
            messageInput instanceof HTMLTextAreaElement ? messageInput : null;
          if (messageField) {
            const visibleRocketWidth =
              (rocketImageBounds.width *
                (CONTACT_ROCKET_PNG_VISIBLE_RIGHT -
                  CONTACT_ROCKET_PNG_VISIBLE_LEFT)) /
              CONTACT_ROCKET_PNG_WIDTH;
            const visibleRocketCenterX =
              rocketImageBounds.left +
              (((CONTACT_ROCKET_PNG_VISIBLE_LEFT +
                CONTACT_ROCKET_PNG_VISIBLE_RIGHT) /
                2) /
                CONTACT_ROCKET_PNG_WIDTH) *
                rocketImageBounds.width;
            const headWidth =
              visibleRocketWidth *
              CONTACT_ROCKET_FLIGHT_CONFIG.vacuumHeadWidthScale;
            const neckWidth = Math.max(
              10,
              headWidth * CONTACT_ROCKET_FLIGHT_CONFIG.vacuumNeckWidthScale,
            );
            const textareaRect = messageField.getBoundingClientRect();
            vacuumTargetExtension = Math.max(
              0,
              launchCenter.y -
                (textareaRect.bottom -
                  CONTACT_ROCKET_FLIGHT_CONFIG.vacuumMouthOverlap +
                  CONTACT_ROCKET_FLIGHT_CONFIG.vacuumHeadHeight),
            );
            vacuumMouth = {
              x: visibleRocketCenterX,
              y:
                textareaRect.bottom -
                CONTACT_ROCKET_FLIGHT_CONFIG.vacuumMouthOverlap +
                2,
            };

            const vacuum = document.createElement("span");
            vacuum.className = "contact-flight-vacuum";
            vacuum.setAttribute("aria-hidden", "true");
            vacuum.style.left = `${visibleRocketCenterX - artworkBounds.left}px`;
            vacuum.style.setProperty("--vacuum-width", `${headWidth}px`);
            vacuum.style.setProperty("--vacuum-neck-width", `${neckWidth}px`);
            vacuum.style.setProperty(
              "--vacuum-head-height",
              `${CONTACT_ROCKET_FLIGHT_CONFIG.vacuumHeadHeight}px`,
            );
            vacuum.style.setProperty("--vacuum-extension", "0px");
            const vacuumNeck = document.createElement("span");
            vacuumNeck.className = "contact-flight-vacuum__neck";
            const vacuumHead = document.createElement("span");
            vacuumHead.className = "contact-flight-vacuum__head";
            const vacuumMouthSlot = document.createElement("span");
            vacuumMouthSlot.className = "contact-flight-vacuum__mouth";
            vacuumHead.appendChild(vacuumMouthSlot);
            vacuum.append(vacuumNeck, vacuumHead);
            flightLayer.appendChild(vacuum);
            vacuumElement = vacuum;
            vacuumCurrentExtension = 0;

            vacuumLetters = createVacuumLetters(messageField, vacuumMouth);
            if (vacuumLetters.length === 0) {
              removeVacuumElement();
            }
          }

          // Hiding the original after the clone is in place preserves the
          // form's layout while the fixed layer takes over visually.
          rocketButton.style.visibility = "hidden";
          rocketButton.style.pointerEvents = "none";
          if (vacuumLetters.length > 0) {
            flightStateRef.current = "vacuuming";
            phaseStartedAt = performance.now();
            setLayerPhase("vacuum");
            setLayerPosition(launchCenter, 0);
          } else {
            setLayerPhase("preparing");
            setLayerPosition(launchCenter, 0);
            rocketSmokeStartRef.current?.();
          }
          animationFrame = window.requestAnimationFrame(renderFrame);
        } catch (error) {
          settleFlight(error);
        }
      });

    const handleResize = () => {
      geometryDirty = true;
    };

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      if (reducedMotion && flightStateRef.current !== "idle") {
        cancelFlight();
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(stage);
    resizeObserver.observe(form);
    window.addEventListener("scroll", handleResize, {
      passive: true,
    });
    reducedMotionQuery.addEventListener("change", handleMotionPreference);
    startRocketFlightRef.current = startFlight;
    cancelRocketFlightRef.current = cancelFlight;

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", handleResize);
      reducedMotionQuery.removeEventListener("change", handleMotionPreference);
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      window.clearTimeout(reducedMotionTimer);
      if (flightStateRef.current !== "idle") {
        settleFlight(new Error("Contact section unmounted."));
      }
      clearLandedRocket();
      if (landedRocketPositionRef.current === updateLandedRocketPosition) {
        landedRocketPositionRef.current = null;
      }
      rocketOverlay.remove();
      if (startRocketFlightRef.current === startFlight) {
        startRocketFlightRef.current = null;
      }
      if (cancelRocketFlightRef.current === cancelFlight) {
        cancelRocketFlightRef.current = null;
      }
    };
  }, []);

  const announceConfiguration = (label: string) => {
    setAnnouncement(
      `${label} requires configuration before this destination can open.`,
    );
  };

  const focusContactForm = () => {
    formRef.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
  };

  const requestResume = useCallback(() => {
    const message = formRef.current?.elements.namedItem("message");
    if (message instanceof HTMLTextAreaElement) {
      if (!message.value.trim() || message.value.trim() === DEFAULT_CONTACT_MESSAGE) {
        message.value = "Hi Ray, I'd love to see your résumé.";
      }
      message.focus();
      setAnnouncement("My résumé is available on request. Add your name and email to get in touch.");
    }
  }, []);

  const openOrbitDestination = (orbit: OrbitDefinition) => {
    if (orbit.name === "email") {
      if (CONTACT_EMAIL) window.location.href = `mailto:${CONTACT_EMAIL}`;
      else focusContactForm();
    } else if (orbit.name === "resume") {
      if (RESUME_URL) window.open(RESUME_URL, "_blank", "noopener,noreferrer");
      else requestResume();
    } else {
      announceConfiguration(orbit.label);
    }
  };

  const orbitActionLabel = (orbit: OrbitDefinition) => {
    if (orbit.name === "email") return "Email Ray Xu";
    if (orbit.name === "resume") return RESUME_URL ? "View Ray Xu's résumé" : "Request Ray Xu's résumé";
    return `${orbit.label}: configuration required`;
  };

  const clearFieldError = (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = event.currentTarget.name as keyof ContactErrors;
    if (!errors[field]) {
      return;
    }

    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (flightStateRef.current !== "idle") {
      return;
    }

    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const nextErrors: ContactErrors = {};

    if (name.length < 2) {
      nextErrors.name = "Please enter your name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Please enter a valid email.";
    }
    setErrors(nextErrors);
    const firstInvalidField = Object.keys(nextErrors)[0];
    if (firstInvalidField) {
      setAnnouncement("Please check the highlighted form fields.");
      const element = form.elements.namedItem(firstInvalidField);
      if (element instanceof HTMLElement) {
        element.focus();
      }
      return;
    }

    const payload = { name, email, message };
    const startFlight = startRocketFlightRef.current;

    if (!startFlight) {
      setAnnouncement("The message launch is not ready yet. Please try again.");
      return;
    }

    setAnnouncement("Sending message…");

    try {
      await Promise.all([
        startFlight(payload),
        submitContactMessage(payload),
      ]);
      form.reset();
      setAnnouncement("Message sent. Thanks — I’ll get back to you soon.");
    } catch {
      cancelRocketFlightRef.current?.();
      setAnnouncement(
        "Message could not be sent. Please try again in a moment.",
      );
    }
  };

  return (
    <section
      className="contact-experience"
      data-tour-target="contact"
      ref={stageRef}
      aria-labelledby="contact-title"
    >
      <div className="contact-paper-noise" aria-hidden="true" />
      <div className="contact-star-field" aria-hidden="true">
        {STARS.map(([left, top, bright], index) => (
          <span
            className={`contact-star${bright ? " contact-star--bright" : ""}`}
            key={`${left}-${top}-${index}`}
            style={{ left: `${left}%`, top: `${top}%` }}
          />
        ))}
        {DUST.map((particle, index) => (
          <i
            className="contact-dust"
            key={`dust-${index}`}
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
            }}
          />
        ))}
      </div>

      <ContactDoodles />
      <div className="contact-nebula contact-nebula--left" aria-hidden="true" />
      <div className="contact-nebula contact-nebula--right" aria-hidden="true" />
      <canvas ref={smokeCanvasRef} className="contact-smoke-canvas" aria-hidden="true" />

      <div className="contact-intro">
        <div className="contact-recruiter">
          <h2 id="contact-title" tabIndex={-1} data-tour-focus-block="contact-intro"><TourPageText>Want to talk?</TourPageText><span aria-hidden="true">_</span></h2>
          <p>I'm currently looking for software engineering opportunities.</p>
        </div>

        <form
          aria-labelledby="contact-form-note"
          className="contact-form"
          noValidate
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <aside className="contact-sticky-note">
            <p id="contact-form-note">Send a message to launch the rocket!</p>
          </aside>

          <label>
            <span className="sr-only">Your name</span>
            <input
              aria-describedby={errors.name ? "contact-name-error" : undefined}
              aria-invalid={Boolean(errors.name)}
              name="name"
              onInput={clearFieldError}
              placeholder="Your name"
              type="text"
            />
            {errors.name ? (
              <small className="contact-form__error" id="contact-name-error">
                {errors.name}
              </small>
            ) : null}
          </label>

          <label>
            <span className="sr-only">Your email</span>
            <input
              aria-describedby={errors.email ? "contact-email-error" : undefined}
              aria-invalid={Boolean(errors.email)}
              inputMode="email"
              name="email"
              onInput={clearFieldError}
              placeholder="Your email"
              type="email"
            />
            {errors.email ? (
              <small className="contact-form__error" id="contact-email-error">
                {errors.email}
              </small>
            ) : null}
          </label>

          <label>
            <span className="sr-only">Your message</span>
            <textarea
              aria-describedby={errors.message ? "contact-message-error" : undefined}
              aria-invalid={Boolean(errors.message)}
              defaultValue={DEFAULT_CONTACT_MESSAGE}
              name="message"
              onInput={clearFieldError}
              placeholder="Your message"
              rows={3}
            />
            {errors.message ? (
              <small className="contact-form__error" id="contact-message-error">
                {errors.message}
              </small>
            ) : null}
          </label>

          <div className="contact-form__rocket-launch">
            <button
              className="contact-form__rocket-button"
              ref={rocketButtonRef}
              type="submit"
              aria-label="Send message"
            >
              <span className="contact-form__rocket" aria-hidden="true">
                <span className="contact-form__rocket-flame contact-form__rocket-flame--outer" />
                <span className="contact-form__rocket-flame-spark contact-form__rocket-flame-spark--one" />
                <span className="contact-form__rocket-flame-spark contact-form__rocket-flame-spark--two" />
                <span className="contact-form__rocket-flame-spark contact-form__rocket-flame-spark--three" />
                <span className="contact-form__rocket-flame-spark contact-form__rocket-flame-spark--four" />
                <span className="contact-form__rocket-image-frame">
                  <img
                    className="contact-form__rocket-image"
                    src="/send-message-rocket-clean.png"
                    alt=""
                  />
                </span>
                <span className="contact-form__rocket-html-label">Send message</span>
              </span>
            </button>
          </div>
        </form>

        <p className="contact-announcement" aria-live="polite">
          {announcement}
        </p>
      </div>

      <div className="contact-cosmos">
        <div className="contact-orbit-rings" ref={ringsRef}>
          <span className="contact-orbit-ring contact-orbit-ring--one" />
          <span className="contact-orbit-ring contact-orbit-ring--two" />
          <span className="contact-orbit-ring contact-orbit-ring--three" />
          <span className="contact-orbit-ring contact-orbit-ring--four" />
          <span className="contact-orbit-ring contact-orbit-ring--shared" />
        </div>

        <div className="contact-cosmos__system" ref={systemRef}>
          <div className="contact-asteroids contact-asteroids--one">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="contact-asteroids contact-asteroids--two">
            <i />
            <i />
            <i />
            <i />
          </div>

          {ORBITS.map((orbit, index) => (
            <span
              className={`contact-connector contact-connector--${orbit.name}`}
              key={`connector-${orbit.name}`}
              ref={(node) => {
                connectorRefs.current[index] = node;
              }}
            />
          ))}

          <div
            className={`contact-sun${isDarkMode ? " contact-sun--moon" : ""}`}
            ref={sunRef}
          >
            <span className="contact-sun__rays" />
            <button
              className="contact-sun__core"
              type="button"
              aria-label={
                isDarkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              aria-pressed={isDarkMode}
              onClick={onToggleTheme}
            >
              <Power className="contact-sun__power" aria-hidden="true" />
            </button>
          </div>

          {ORBITS.map((orbit, index) => (
            <div
              className={`contact-orbit-item contact-orbit-item--${orbit.name}`}
              data-orbit-item
              key={orbit.name}
              ref={(node) => {
                orbitRefs.current[index] = node;
              }}
            >
              {orbit.name === "linkedin" || orbit.name === "github" || orbit.name === "schedule" ? (
                <a
                  className={`contact-planet contact-planet--${orbit.name}`}
                  data-tour-focus-block={`contact-planet-${orbit.name}`}
                  href={
                    orbit.name === "linkedin"
                      ? LINKEDIN_URL
                      : orbit.name === "github"
                        ? GITHUB_URL
                        : SCHEDULE_URL
                  }
                  target="_blank"
                  rel="noreferrer"
                  aria-label={
                    orbit.name === "schedule"
                      ? "Book a meeting with Ray Xu"
                      : `Open Ray Xu's ${orbit.label} profile`
                  }
                >
                  {orbit.icon}
                </a>
              ) : (
                <button
                  className={`contact-planet contact-planet--${orbit.name}`}
                  data-tour-focus-block={`contact-planet-${orbit.name}`}
                  type="button"
                  aria-label={orbitActionLabel(orbit)}
                  onClick={() => openOrbitDestination(orbit)}
                  ref={(node) => {
                    if (orbit.name === "email") {
                      emailPlanetRef.current = node;
                    }
                  }}
                >
                  {orbit.icon}
                </button>
              )}

              {orbit.name === "linkedin" || orbit.name === "github" || orbit.name === "schedule" ? (
                <a
                  className="contact-orbit-item__label"
                  data-tour-focus-block={`contact-planet-${orbit.name}`}
                  href={
                    orbit.name === "linkedin"
                      ? LINKEDIN_URL
                      : orbit.name === "github"
                        ? GITHUB_URL
                        : SCHEDULE_URL
                  }
                  target="_blank"
                  rel="noreferrer"
                  aria-label={
                    orbit.name === "schedule"
                      ? "Book a meeting with Ray Xu"
                      : `Open Ray Xu's ${orbit.label} profile`
                  }
                >
                  <strong>
                    {orbit.name === "linkedin" || orbit.name === "schedule"
                      ? <TourPageText inline>{orbit.label}</TourPageText>
                      : orbit.label}
                    <ArrowUpRight aria-hidden="true" />
                  </strong>
                </a>
              ) : (
                <button
                  className="contact-orbit-item__label"
                  data-tour-focus-block={`contact-planet-${orbit.name}`}
                  type="button"
                  aria-label={orbitActionLabel(orbit)}
                  onClick={() => openOrbitDestination(orbit)}
                >
                  <strong>
                    {orbit.label}
                    <ArrowUpRight aria-hidden="true" />
                  </strong>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
