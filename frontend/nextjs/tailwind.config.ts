import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "hsl(var(--bg))",
        "bg-elev": "hsl(var(--bg-elev))",
        "bg-elev-2": "hsl(var(--bg-elev-2))",
        fg: "hsl(var(--fg))",
        "fg-muted": "hsl(var(--fg-muted))",
        "fg-dim": "hsl(var(--fg-dim))",
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        accent: "hsl(var(--accent))",
        "accent-2": "hsl(var(--accent-2))",
        "accent-3": "hsl(var(--accent-3))",
        "accent-4": "hsl(var(--accent-4))",
        danger: "hsl(var(--danger))",
        warn: "hsl(var(--warn))",
      },
      fontFamily: {
        display: ["'Inter Tight'", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: { lg: "10px", md: "8px", sm: "6px" },
    },
  },
  plugins: [],
};
export default config;
