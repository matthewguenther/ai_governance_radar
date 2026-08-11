/** Incident category icon in a severity-tinted tile. */

import {
  AlertTriangle, Bot, Database, EyeOff, FlaskConical, KeyRound,
  MessageSquareX, Scale, ScanFace, ShieldAlert, TerminalSquare,
} from "lucide-react";

const ICONS: Record<string, typeof AlertTriangle> = {
  prompt_injection: TerminalSquare,
  data_leakage: Database,
  bias_discrimination: Scale,
  deepfake_abuse: ScanFace,
  hallucination_harm: MessageSquareX,
  excessive_agency: Bot,
  agent_failure: Bot,
  sandbox_escape: ShieldAlert,
  model_theft: KeyRound,
  data_poisoning: FlaskConical,
  ai_cyberattack: ShieldAlert,
  system_compromise: ShieldAlert,
  privacy: EyeOff,
};

export function IncidentIcon({ category, tone, size = 28 }: {
  category: string; tone: string; size?: number;
}) {
  const Icon = ICONS[category] ?? AlertTriangle;
  return (
    <span
      aria-hidden
      style={{
        width: size, height: size, borderRadius: 8, flexShrink: 0,
        background: `${tone}1E`, border: `1px solid ${tone}55`,
        display: "inline-grid", placeItems: "center",
      }}
    >
      <Icon size={size * 0.55} color={tone} strokeWidth={1.8} />
    </span>
  );
}
