import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: {
          DEFAULT: "var(--surface)",
          subtle: "var(--surface-subtle)",
          muted: "var(--surface-muted)",
          hover: "var(--surface-hover)",
        },
        border: {
          DEFAULT: "var(--border)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
        text: {
          DEFAULT: "var(--text-main)",
          muted: "var(--text-muted)",
          dimmed: "var(--text-dimmed)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          foreground: "var(--accent-foreground)",
          subtle: "var(--accent-subtle)",
        },
        success: {
          DEFAULT: "var(--success)",
          surface: "var(--success-surface)",
          border: "var(--success-border)",
          text: "var(--success-text)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          surface: "var(--warning-surface)",
          border: "var(--warning-border)",
          text: "var(--warning-text)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          surface: "var(--danger-surface)",
          border: "var(--danger-border)",
          text: "var(--danger-text)",
        },
        neutral: {
          surface: "var(--neutral-surface)",
          border: "var(--neutral-border)",
          text: "var(--neutral-text)",
        }
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
