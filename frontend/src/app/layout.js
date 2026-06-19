import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata = {
  title: "AURA - Agentic AI Platform for Banking CRM",
  description: "Production-grade BFSI Customer Relationship Intelligence system with LangGraph and configurable Gemini API",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} dark`}>
      <body className="antialiased font-sans bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
