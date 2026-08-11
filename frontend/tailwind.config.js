/** Design tokens from DESIGN_SYSTEM.md — dark-first intelligence terminal. */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { base: "#0B0E14", surface: "#12161F", raised: "#1A2029" },
        bd: { subtle: "#232B36", strong: "#33404F" },
        tx: { primary: "#E8EDF4", secondary: "#9AA7B8", muted: "#5E6B7E" },
        accent: "#4D9FFF",
        sev: {
          critical: "#F0554D",
          high: "#F2913D",
          watch: "#E5C445",
          positive: "#3FBF77",
          info: "#4D9FFF",
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
        kpi: ["28px", "1.1"],
      },
      borderRadius: { card: "10px", ctl: "6px" },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.4)",
        glow: "0 0 12px rgba(240,85,77,.15)",
      },
    },
  },
  plugins: [],
};
