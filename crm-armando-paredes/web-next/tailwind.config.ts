import type { Config } from "tailwindcss";

const c = (v: string) => `rgb(var(${v}) / <alpha-value>)`;
const soft = (v: string) => `rgb(var(${v}) / 0.12)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: c("--bg-rgb"),
        surface: c("--surface-rgb"),
        raised: c("--raised-rgb"),
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        ink: {
          DEFAULT: c("--ink-rgb"),
          muted: c("--ink-muted-rgb"),
          faint: c("--ink-faint-rgb"),
        },
        gold: { DEFAULT: c("--gold-rgb"), soft: soft("--gold-rgb") },
        green: { DEFAULT: c("--green-rgb"), soft: soft("--green-rgb") },
        red: { DEFAULT: c("--red-rgb"), soft: soft("--red-rgb") },
        blue: { DEFAULT: c("--blue-rgb"), soft: soft("--blue-rgb") },
        violet: { DEFAULT: c("--violet-rgb"), soft: soft("--violet-rgb") },
      },
      fontFamily: {
        display: ['"Syne"', "system-ui", "sans-serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["11px", { lineHeight: "14px", letterSpacing: "0.12em" }],
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "20px" }],
        base: ["14px", { lineHeight: "22px" }],
        lg: ["16px", { lineHeight: "24px" }],
        xl: ["20px", { lineHeight: "26px", letterSpacing: "-0.01em" }],
        "2xl": ["28px", { lineHeight: "32px", letterSpacing: "-0.02em" }],
        "3xl": ["40px", { lineHeight: "44px", letterSpacing: "-0.03em" }],
      },
      borderRadius: { card: "12px", pill: "999px" },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        pulse2: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
        pulse2: "pulse2 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
