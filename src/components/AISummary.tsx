import { BrainCircuit, Code2, ScanEye, Sparkles } from "lucide-react";

type OverviewToken = {
  text: string;
  strong: boolean;
  keepTogether?: boolean;
};

const OVERVIEW_TOKENS: readonly OverviewToken[] = [
  { text: "Ray builds software that makes technology more intuitive to use. His projects pair ", strong: false },
  { text: "computer vision", strong: true },
  { text: " and ", strong: false },
  { text: "machine learning", strong: true },
  { text: " with ", strong: false },
  { text: "full-stack development", strong: true },
  { text: ", from camera-based input to spatial 3D design.", strong: false },
];

const skills = [
  { label: "Python", icon: Code2, kind: "python" },
  { label: "Computer Vision", icon: ScanEye, kind: "computer-vision" },
  { label: "Machine Learning", icon: BrainCircuit, kind: "machine-learning" },
] as const;

export function AISummary() {
  return (
    <section className="ai-overview" aria-labelledby="ai-overview-title">
      <header className="ai-overview__header">
        <Sparkles size={17} strokeWidth={1.6} aria-hidden="true" />
        <h2 id="ai-overview-title">AI Overview</h2>
      </header>

      <p className="ai-overview__copy">
        {OVERVIEW_TOKENS.map((token, index) =>
          token.strong ? (
            <strong key={index}>{token.text}</strong>
          ) : (
            <span key={index}>{token.text}</span>
          ),
        )}
      </p>

      <div className="ai-overview__skills" aria-label="Areas of focus">
        {skills.map((skill) => (
          <span className="ai-overview__skill" key={skill.kind}>
            <skill.icon
              className="ai-overview__skill-icon"
              size={19}
              strokeWidth={1.65}
              aria-hidden="true"
            />
            <span>{skill.label}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
