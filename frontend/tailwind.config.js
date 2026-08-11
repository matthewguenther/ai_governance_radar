/** Design tokens — "Refined Intelligence Dashboard" (approved Direction A rev 2).
 * Keep hex values in sync with src/lib/tokens.ts (used for inline SVG/dynamic styles). */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { base: "#090C12", surface: "#10151E", raised: "#1A2230" },
        bd: { subtle: "#1E2836", strong: "#2C3A4E" },
        tx: { primary: "#E8EDF5", secondary: "#8FA0B5", muted: "#5C6B80" },
        accent: "#628BFF",
        sev: {
          critical: "#F2564D",
          high: "#F2913D",
          watch: "#E5C445",
          positive: "#3FBF77",
          info: "#5B9BD8",
          emerging: "#A78BFA",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      fontSize: {
        meta: ["11px", { lineHeight: "1.35", letterSpacing: "0.06em" }],
        xs: ["12px", "1.4"],
        sm: ["13px", "1.45"],
        base: ["14px", "1.45"],
        lg: ["16px", "1.4"],
        xl: ["20px", "1.35"],
        kpi: ["30px", "1.15"],
      },
      borderRadius: { card: "12px", ctl: "8px" },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.045)",
      },
      backgroundImage: {
        surface: "linear-gradient(180deg, #131A26 0%, #0F141D 100%)",
      },
    },
  },
  plugins: [],
};
