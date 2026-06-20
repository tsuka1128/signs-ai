/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          DEFAULT: "#A8E6CF",
          light: "#E8F8F0",
        },
        teal: {
          DEFAULT: "#38B2AC",
        },
        dark: "#1A202C",
        blue: {
          light: "#DCEEFB",
        },
        // 目に優しい「黒とグレーの間」のダークインク。
        // slate-900(#0f172a) は真っ黒で目が疲れるため、本文/ダーク文字の最暗色を
        // 1段やわらげる（コントラストは白背景で約8.9:1＝AAA相当で可読性は維持）。
        // 見出しは text-slate-800(#1e293b) のままで、サイズ・太さで強調する。
        slate: {
          900: "#334155",
        },
      },
      // 本文(読ませる文字)の主体である text-sm を 14px → 13px に再定義。
      // 見出し(text-lg/xl/2xl 等)・ラベル(text-xs=12px)は対象外。
      fontSize: {
        sm: ["0.8125rem", { lineHeight: "1.25rem" }], // 13px / 20px
      },
      fontFamily: {
        sans: ["var(--font-noto-sans-jp)", "var(--font-inter)", "sans-serif"],
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out forwards",
        slideUp: "slideUp 0.5s ease-out forwards",
        float: "float 3s ease-in-out infinite",
        glow: "glow 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(168, 230, 207, 0.2)" },
          "50%": { boxShadow: "0 0 30px rgba(168, 230, 207, 0.5)" },
        },
      },
    },
  },
  plugins: [],
};
