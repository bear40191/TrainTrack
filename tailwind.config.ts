import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-noto-sans-thai)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        // ชุดสีระบบ 60-30-10 จากภาพ Palette:
        // 60% = Canvas / Surface (#EFEFEF)
        // 30% = Secondary / Structure (#19705F และ #2BA185)
        // 10% = Accent / Highlights (#6FD098)
        brand: {
          canvas: "#EFEFEF", // 60% Dominant Background
          accent: "#6FD098", // 10% Accent
          teal: "#2BA185",   // Mid-tone Teal
          dark: "#19705F",   // 30% Secondary Dark Pine
          darker: "#145C4E",
          deep: "#0E3E35",
        },
        primary: {
          50: "#F2F9F6",
          100: "#E2F4EB",
          200: "#C2EAD6",
          300: "#9BDEC0",
          400: "#6FD098", // 10% Accent
          500: "#2BA185", // Teal
          600: "#238B72",
          700: "#19705F", // 30% Secondary
          800: "#145C4E",
          900: "#0E3E35",
          950: "#082520",
        },
        emerald: {
          50: "#F2F9F6",
          100: "#E2F4EB",
          200: "#C2EAD6",
          300: "#9BDEC0",
          400: "#6FD098", // 10% Accent (Mint)
          500: "#2BA185", // Teal
          600: "#238B72",
          700: "#19705F", // 30% Secondary (Pine)
          800: "#145C4E",
          900: "#0E3E35",
          950: "#082520",
        },
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        pine: "0 10px 25px -5px rgba(25, 112, 95, 0.25), 0 8px 10px -6px rgba(25, 112, 95, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
