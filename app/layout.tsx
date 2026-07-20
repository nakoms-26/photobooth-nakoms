import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sketchie Box 🎪 Arcade Photobooth",
  description: "Playful & Nostalgic Photobooth Arcade Machine with Live Camera, Custom PNG Frames, Stickers & GIF Export!",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-[#FFFBEA] text-[#1A1325] selection:bg-[#FFE01B] selection:text-[#1B52D8]">
        {children}
      </body>
    </html>
  );
}
