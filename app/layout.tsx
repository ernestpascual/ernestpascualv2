import type { Metadata } from "next";
import "./globals.css";

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
      className="antialiased"
    >
      <body className="min-h-full flex flex-col font-iosevka overflow-x-hidden">
        <CustomCursor />
        <ParticlesBackground />
        {children}
      </body>
    </html>
  );
}
