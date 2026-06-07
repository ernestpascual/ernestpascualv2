import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ernest Pascual",
  description: "Ernest Pascual's personal website.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

import ParticlesBackground from "./components/ParticlesBackground";
import CustomCursor from "./components/CustomCursor";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jost.variable} antialiased`}
    >
      <body className="min-h-full flex flex-col font-jost overflow-x-hidden">
        <CustomCursor />
        <ParticlesBackground />
        {children}
      </body>
    </html>
  );
}
