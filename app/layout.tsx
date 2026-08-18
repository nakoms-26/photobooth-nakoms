import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medkom Box - Digital Photobooth",
  description: "Digital photobooth modern dan praktis dengan live camera, custom PNG frames, sticker, dan GIF export",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full light" style={{ colorScheme: 'light' }}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="https://api.fontshare.com/v2/css?f[]=chillax@300,400,500,600,700&display=swap"
          as="style"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--color-background)] text-[var(--color-text)] selection:bg-[var(--color-primary)] selection:text-[var(--color-white)]">
        {children}
      </body>
    </html>
  );
}
